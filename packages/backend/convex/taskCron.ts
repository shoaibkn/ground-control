import { internalMutation } from "./_generated/server"

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
      // In a real implementation we would call an internal Action to send the Resend email here
      // For now we just update the notification timestamp
      
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
    }
  },
})
