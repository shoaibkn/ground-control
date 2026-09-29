import { query, mutation, internalQuery } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components, internal } from "./_generated/api"

export const DEFAULT_REMINDER_SETTINGS = {
  dueSoonEnabled: true,
  dueSoonNoticeHours: [24],
  dueSoonRecipients: {
    assignees: true,
    creator: false,
    collaborators: false,
  },
  dueSoonMinPriority: "all", // "all" | "medium_and_above" | "high_and_urgent"

  overdueEnabled: true,
  overdueGraceMinutes: 0,
  overdueRepeatIntervalHours: 24, // daily
  overdueMaxRepetitions: undefined as number | undefined,
  overdueRecipients: {
    assignees: true,
    creator: true,
    adminsOnEscalation: true,
  },
  overdueEscalationThresholdDays: 3,

  quietHoursEnabled: false,
  timezone: "UTC",
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  customReminderMessage: undefined as string | undefined,
}

export function isInsideQuietHours(
  timezone = "UTC",
  start = "22:00",
  end = "08:00",
  timestamp = Date.now()
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
    const parts = formatter.formatToParts(new Date(timestamp))
    const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0"
    const minutePart = parts.find((p) => p.type === "minute")?.value ?? "0"
    const currentMinutes = parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10)

    const [startH, startM] = start.split(":").map((v) => parseInt(v, 10))
    const [endH, endM] = end.split(":").map((v) => parseInt(v, 10))

    const startTotal = (startH || 0) * 60 + (startM || 0)
    const endTotal = (endH || 0) * 60 + (endM || 0)

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes < endTotal
    } else {
      // Overnight (e.g. 22:00 to 08:00)
      return currentMinutes >= startTotal || currentMinutes < endTotal
    }
  } catch (err) {
    console.warn(`[Quiet Hours Error] Invalid timezone ${timezone}:`, err)
    return false
  }
}

async function requireAuth(ctx: any) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

async function requireMember(ctx: any, userId: string, organizationId: string) {
  const memberResult = (await ctx.runQuery(
    components.betterAuth.adapter.findMany,
    {
      model: "member",
      where: [
        { field: "userId", value: userId },
        { field: "organizationId", value: organizationId },
      ],
      paginationOpts: { numItems: 1, cursor: null },
    }
  )) as any

  const member = memberResult?.page?.[0]
  if (!member) {
    throw new Error("User is not a member of this organization")
  }
  return member
}

// ---------------------------------------------------------------------------
// Queries & Mutations
// ---------------------------------------------------------------------------

export const getOrganizationReminderSettings = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await requireMember(ctx, user._id, args.organizationId)

    const settings = await ctx.db
      .query("organizationReminderSettings")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()

    if (!settings) {
      return {
        ...DEFAULT_REMINDER_SETTINGS,
        organizationId: args.organizationId,
        isCustomized: false,
      }
    }

    return {
      ...settings,
      isCustomized: true,
    }
  },
})

export const getOrganizationReminderSettingsInternal = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("organizationReminderSettings")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()

    if (!settings) {
      return {
        ...DEFAULT_REMINDER_SETTINGS,
        organizationId: args.organizationId,
      }
    }

    return settings
  },
})

export const updateOrganizationReminderSettings = mutation({
  args: {
    organizationId: v.string(),

    dueSoonEnabled: v.boolean(),
    dueSoonNoticeHours: v.array(v.number()),
    dueSoonRecipients: v.object({
      assignees: v.boolean(),
      creator: v.boolean(),
      collaborators: v.boolean(),
    }),
    dueSoonMinPriority: v.string(),

    overdueEnabled: v.boolean(),
    overdueGraceMinutes: v.number(),
    overdueRepeatIntervalHours: v.number(),
    overdueMaxRepetitions: v.optional(v.number()),
    overdueRecipients: v.object({
      assignees: v.boolean(),
      creator: v.boolean(),
      adminsOnEscalation: v.boolean(),
    }),
    overdueEscalationThresholdDays: v.optional(v.number()),

    quietHoursEnabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),

    customReminderMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    if (member.role !== "admin" && member.role !== "owner") {
      throw new Error(
        "Only organization owners and administrators can configure task reminder policies"
      )
    }

    const existing = await ctx.db
      .query("organizationReminderSettings")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()

    const now = Date.now()

    const payload = {
      organizationId: args.organizationId,
      dueSoonEnabled: args.dueSoonEnabled,
      dueSoonNoticeHours: args.dueSoonNoticeHours,
      dueSoonRecipients: args.dueSoonRecipients,
      dueSoonMinPriority: args.dueSoonMinPriority,
      overdueEnabled: args.overdueEnabled,
      overdueGraceMinutes: args.overdueGraceMinutes,
      overdueRepeatIntervalHours: args.overdueRepeatIntervalHours,
      overdueMaxRepetitions: args.overdueMaxRepetitions,
      overdueRecipients: args.overdueRecipients,
      overdueEscalationThresholdDays: args.overdueEscalationThresholdDays,
      quietHoursEnabled: args.quietHoursEnabled,
      timezone: args.timezone || "UTC",
      quietHoursStart: args.quietHoursStart || "22:00",
      quietHoursEnd: args.quietHoursEnd || "08:00",
      customReminderMessage: args.customReminderMessage?.trim() || undefined,
      updatedAt: now,
      updatedBy: user._id,
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
    } else {
      await ctx.db.insert("organizationReminderSettings", payload)
    }

    return { success: true }
  },
})

// ---------------------------------------------------------------------------
// On-Demand Manual Reminder Nudge
// ---------------------------------------------------------------------------

export const sendManualTaskReminder = mutation({
  args: {
    taskId: v.id("tasks"),
    customNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)

    const task = await ctx.db.get(args.taskId)
    if (!task || task.isArchived) {
      throw new Error("Task not found or archived")
    }

    const member = await requireMember(ctx, user._id, task.organizationId)

    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id

    if (!isAdminOrOwner && !isCreator) {
      throw new Error(
        "Only task creators and organization administrators can trigger manual reminders"
      )
    }

    if (!task.assigneeIds || task.assigneeIds.length === 0) {
      throw new Error("Cannot send reminder: task has no assigned members")
    }

    const now = Date.now()

    // Update task timestamp
    await ctx.db.patch(task._id, {
      lastManualReminderAt: now,
    })

    // Insert task audit log
    await ctx.db.insert("taskAuditLogs", {
      taskId: task._id,
      actorId: user._id,
      action: "MANUAL_REMINDER_SENT",
      details: {
        actorName: user.name || user.email,
        customNote: args.customNote,
        recipientCount: task.assigneeIds.length,
      },
      timestamp: now,
    })

    const senderName = user.name || "A team manager"
    const formattedDueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString()
      : "No fixed deadline"

    // Dispatch notifications to each assignee
    for (const assigneeId of task.assigneeIds) {
      // Don't send reminder to self if the user is assigned to their own task
      if (assigneeId === user._id) continue

      await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
        userId: assigneeId,
        organizationId: task.organizationId,
        templateName: "task_due_soon",
        parameters: {
          taskTitle: task.title,
          dueDate: formattedDueDate,
          assignerName: senderName,
          customNote: args.customNote || "",
        },
        actorId: user._id,
        entityId: task._id,
        entityType: "task",
        link: `/tasks?taskId=${task._id}`,
      })
    }

    return {
      success: true,
      recipientsCount: task.assigneeIds.length,
    }
  },
})
