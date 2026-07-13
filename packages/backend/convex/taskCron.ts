import { internalMutation } from "./_generated/server"
import { spawnNextRecurringInstance } from "./tasks"
import { internal } from "./_generated/api"

export const checkOverdueTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    // 24 hours in milliseconds
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()

    const overdueTasks = tasks.filter((task) => {
      // Must have a due date in the past
      if (!task.dueDate || task.dueDate > now) return false
      
      // Ignore if completed or cancelled
      if (task.status === "Completed" || task.status === "Cancelled") return false

      // Check if we already notified within the last 24 hours
      if (task.lastOverdueNotifiedAt && (now - task.lastOverdueNotifiedAt < TWENTY_FOUR_HOURS)) {
        return false
      }

      return true
    })

    for (const task of overdueTasks) {
      await ctx.db.patch(task._id, {
        lastOverdueNotifiedAt: now
      })

      // We could also auto-update the status or add a comment/audit log
      await ctx.db.insert("taskAuditLogs", {
        taskId: task._id,
        actorId: "SYSTEM", // System generated
        action: "OVERDUE_NOTIFIED",
        details: { dueDate: task.dueDate },
        timestamp: now,
      })

      // Send overdue notifications to assignees
      for (const assigneeId of task.assigneeIds) {
        await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
          userId: assigneeId,
          organizationId: task.organizationId,
          templateName: "task_overdue",
          parameters: {
            taskTitle: task.title,
            dueDate: task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "No due date",
          },
        })
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
