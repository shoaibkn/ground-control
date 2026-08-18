import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Run overdue task check every hour
crons.interval(
  "Check overdue tasks",
  { hours: 1 },
  internal.taskCron.checkOverdueTasks
)

// Run due soon task reminder check every 4 hours
crons.interval(
  "Check due soon tasks",
  { hours: 4 },
  internal.taskCron.checkDueSoonTasks
)

// Run recurring task processor every hour
crons.interval(
  "Process recurring tasks",
  { hours: 1 },
  internal.taskCron.processRecurringTasks
)

export default crons
