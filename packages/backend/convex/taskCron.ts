import { internalMutation } from "./_generated/server"
import { spawnNextRecurringInstance } from "./tasks"
import { components, internal } from "./_generated/api"
import {
  DEFAULT_REMINDER_SETTINGS,
  isInsideQuietHours,
} from "./taskReminders"

export const checkOverdueTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()

    // Cache organization settings to avoid duplicate queries
    const orgSettingsMap = new Map<string, any>()

    const getOrgSettings = async (organizationId: string) => {
      if (orgSettingsMap.has(organizationId)) {
        return orgSettingsMap.get(organizationId)
      }
      const record = await ctx.db
        .query("organizationReminderSettings")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", organizationId)
        )
        .first()

      const resolved = record || {
        ...DEFAULT_REMINDER_SETTINGS,
        organizationId,
      }
      orgSettingsMap.set(organizationId, resolved)
      return resolved
    }

    // Cache organization admins
    const orgAdminsMap = new Map<string, string[]>()
    const getOrgAdmins = async (organizationId: string) => {
      if (orgAdminsMap.has(organizationId)) {
        return orgAdminsMap.get(organizationId)!
      }
      try {
        const membersResult = (await ctx.runQuery(
          components.betterAuth.adapter.findMany,
          {
            model: "member",
            where: [{ field: "organizationId", value: organizationId }],
            paginationOpts: { numItems: 100, cursor: null },
          }
        )) as any

        const adminUserIds = (membersResult?.page || [])
          .filter((m: any) => m.role === "admin" || m.role === "owner")
          .map((m: any) => m.userId)

        orgAdminsMap.set(organizationId, adminUserIds)
        return adminUserIds
      } catch (err) {
        console.warn(`[Admin lookup error] org ${organizationId}:`, err)
        return []
      }
    }

    for (const task of tasks) {
      // Must have a due date in the past
      if (!task.dueDate || task.dueDate > now) continue

      // Ignore if completed or cancelled
      if (task.status === "Completed" || task.status === "Cancelled") continue

      const settings = await getOrgSettings(task.organizationId)

      // 1. Check if overdue alerts are enabled for this organization
      if (!settings.overdueEnabled) continue

      // 2. Check Grace Period
      const graceMs = (settings.overdueGraceMinutes || 0) * 60 * 1000
      if (now - task.dueDate < graceMs) continue

      // 3. Check Repeat Interval & Repetition Cap
      const repeatIntervalHours = settings.overdueRepeatIntervalHours ?? 24
      const currentCount =
        task.overdueNotificationCount ?? (task.lastOverdueNotifiedAt ? 1 : 0)

      if (task.lastOverdueNotifiedAt) {
        // If interval is 0, notify once only
        if (repeatIntervalHours === 0) continue

        const intervalMs = repeatIntervalHours * 60 * 60 * 1000
        if (now - task.lastOverdueNotifiedAt < intervalMs) continue
      }

      if (
        settings.overdueMaxRepetitions &&
        currentCount >= settings.overdueMaxRepetitions
      ) {
        continue
      }

      // 4. Quiet Hours Check
      if (
        settings.quietHoursEnabled &&
        isInsideQuietHours(
          settings.timezone,
          settings.quietHoursStart,
          settings.quietHoursEnd,
          now
        )
      ) {
        continue
      }

      // 5. Escalation Check
      const overdueDays = (now - task.dueDate) / (24 * 60 * 60 * 1000)
      const isEscalated = Boolean(
        settings.overdueRecipients?.adminsOnEscalation &&
          settings.overdueEscalationThresholdDays &&
          overdueDays >= settings.overdueEscalationThresholdDays
      )

      // 6. Build Recipients
      const recipients = new Set<string>()

      if (settings.overdueRecipients?.assignees !== false) {
        task.assigneeIds.forEach((id) => recipients.add(id))
      }

      if (settings.overdueRecipients?.creator && task.creatorId) {
        recipients.add(task.creatorId)
      }

      if (isEscalated) {
        const admins: string[] = await getOrgAdmins(task.organizationId)
        admins.forEach((adminId: string) => recipients.add(adminId))
      }

      // Update task record
      const nextCount = currentCount + 1
      await ctx.db.patch(task._id, {
        lastOverdueNotifiedAt: now,
        overdueNotificationCount: nextCount,
      })

      // Insert audit log
      await ctx.db.insert("taskAuditLogs", {
        taskId: task._id,
        actorId: "SYSTEM",
        action: "OVERDUE_NOTIFIED",
        details: {
          dueDate: task.dueDate,
          notificationCount: nextCount,
          isEscalated,
          customMessage: settings.customReminderMessage,
        },
        timestamp: now,
      })

      // Send overdue notifications
      for (const recipientId of recipients) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendNotification,
          {
            userId: recipientId,
            organizationId: task.organizationId,
            templateName: "task_overdue",
            parameters: {
              taskTitle: task.title,
              dueDate: new Date(task.dueDate).toLocaleDateString(),
              customNote: settings.customReminderMessage || "",
            },
            entityId: task._id,
            entityType: "task",
            link: `/tasks?taskId=${task._id}`,
          }
        )
      }
    }
  },
})

export const checkDueSoonTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()

    const orgSettingsMap = new Map<string, any>()

    const getOrgSettings = async (organizationId: string) => {
      if (orgSettingsMap.has(organizationId)) {
        return orgSettingsMap.get(organizationId)
      }
      const record = await ctx.db
        .query("organizationReminderSettings")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", organizationId)
        )
        .first()

      const resolved = record || {
        ...DEFAULT_REMINDER_SETTINGS,
        organizationId,
      }
      orgSettingsMap.set(organizationId, resolved)
      return resolved
    }

    for (const task of tasks) {
      if (!task.dueDate) continue
      const timeRemaining = task.dueDate - now

      // Must be due in the future
      if (timeRemaining <= 0) continue

      if (task.status === "Completed" || task.status === "Cancelled") continue

      const settings = await getOrgSettings(task.organizationId)

      // 1. Check if due soon reminders are enabled
      if (!settings.dueSoonEnabled) continue

      // 2. Check minimum priority filter
      if (settings.dueSoonMinPriority === "medium_and_above") {
        if (task.priority === "Low") continue
      } else if (settings.dueSoonMinPriority === "high_and_urgent") {
        if (task.priority !== "High" && task.priority !== "Urgent") continue
      }

      // 3. Quiet Hours Check
      if (
        settings.quietHoursEnabled &&
        isInsideQuietHours(
          settings.timezone,
          settings.quietHoursStart,
          settings.quietHoursEnd,
          now
        )
      ) {
        continue
      }

      // 4. Check Configured Notice Windows (e.g. [24, 2])
      const noticeHours: number[] = settings.dueSoonNoticeHours || [24]
      const notifiedHours = task.dueSoonNotifiedHours || []

      // Find the largest configured window that applies and hasn't been notified yet
      // Sort ascending to catch the closest applicable window
      const sortedWindows = [...noticeHours].sort((a, b) => a - b)
      let triggeredWindow: number | null = null

      for (const windowHour of sortedWindows) {
        const windowMs = windowHour * 60 * 60 * 1000
        if (timeRemaining <= windowMs && !notifiedHours.includes(windowHour)) {
          triggeredWindow = windowHour
          break
        }
      }

      if (triggeredWindow === null) continue

      // Mark this window as notified
      const updatedNotifiedHours = [...notifiedHours, triggeredWindow]

      await ctx.db.patch(task._id, {
        lastDueSoonNotifiedAt: now,
        dueSoonNotifiedHours: updatedNotifiedHours,
      })

      // Insert audit log
      await ctx.db.insert("taskAuditLogs", {
        taskId: task._id,
        actorId: "SYSTEM",
        action: "DUE_SOON_NOTIFIED",
        details: {
          windowHours: triggeredWindow,
          dueDate: task.dueDate,
          customMessage: settings.customReminderMessage,
        },
        timestamp: now,
      })

      // Build recipients
      const recipients = new Set<string>()

      if (settings.dueSoonRecipients?.assignees !== false) {
        task.assigneeIds.forEach((id) => recipients.add(id))
      }

      if (settings.dueSoonRecipients?.creator && task.creatorId) {
        recipients.add(task.creatorId)
      }

      if (
        settings.dueSoonRecipients?.collaborators &&
        task.collaboratorIds
      ) {
        task.collaboratorIds.forEach((id) => recipients.add(id))
      }

      // Dispatch notifications
      for (const recipientId of recipients) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendNotification,
          {
            userId: recipientId,
            organizationId: task.organizationId,
            templateName: "task_due_soon",
            parameters: {
              taskTitle: task.title,
              dueDate: new Date(task.dueDate).toLocaleDateString(),
              noticeHours: triggeredWindow.toString(),
              customNote: settings.customReminderMessage || "",
            },
            entityId: task._id,
            entityType: "task",
            link: `/tasks?taskId=${task._id}`,
          }
        )
      }
    }
  },
})

export const processRecurringTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()

    const recurringTasks = tasks.filter(
      (task) => task.recurrence && task.dueDate && task.dueDate <= now
    )

    for (const task of recurringTasks) {
      await spawnNextRecurringInstance(ctx, task)
    }
  },
})
