import React from "react"
import { Calendar, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

interface DueDateBadgeProps {
  dueDate?: number
  timeOfDay?: string
  status?: string
  className?: string
  creationTime?: number
}

export function DueDateBadge({ dueDate, timeOfDay, status, className, creationTime }: DueDateBadgeProps) {
  if (!dueDate) {
    if (creationTime) {
      const now = Date.now()
      const diffTime = now - creationTime
      const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return (
        <Badge
          variant="outline"
          className={cn(
            "h-5 text-[9px] font-medium border border-border/40 bg-muted/5 text-muted-foreground/60 select-none",
            className
          )}
        >
          {ageDays === 0 ? "Created today" : `${ageDays}d old`}
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-5 text-[9px] font-medium border border-border/40 bg-muted/5 text-muted-foreground/60 select-none",
          className
        )}
      >
        No due date
      </Badge>
    )
  }

  const dateObj = new Date(dueDate)
  const dateStr = dateObj.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
  const fullLabel = `${dateStr}${timeOfDay ? ` (${timeOfDay})` : ""}`

  // If completed/cancelled, date urgency doesn't apply
  if (status === "Completed" || status === "Cancelled" || status === "Approved") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-5 text-[9px] font-medium border border-emerald-500/10 bg-emerald-500/5 text-emerald-600/80 dark:text-emerald-400/80 select-none flex items-center gap-1",
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Done ({dateStr})</span>
      </Badge>
    )
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1
  const endOfTomorrow = endOfToday + 24 * 60 * 60 * 1000

  // Calculate end of the current week (Sunday EOD)
  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek
  const endOfWeek = endOfToday + daysUntilSunday * 24 * 60 * 60 * 1000

  let badgeStyle = ""
  let Icon = Calendar
  let label = fullLabel

  if (dueDate < startOfToday) {
    // Overdue
    const diffTime = startOfToday - dueDate
    const delayDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    badgeStyle = "bg-red-500/10 text-red-600 border-red-500/25 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 animate-pulse font-semibold"
    Icon = AlertCircle
    label = `Overdue (${delayDays}d) - ${dateStr}`
  } else if (dueDate >= startOfToday && dueDate <= endOfToday) {
    // Today
    badgeStyle = "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 font-semibold"
    Icon = Clock
    label = `Today${timeOfDay ? ` (${timeOfDay})` : ""}`
  } else if (dueDate > endOfToday && dueDate <= endOfTomorrow) {
    // Tomorrow
    badgeStyle = "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
    label = `Tomorrow${timeOfDay ? ` (${timeOfDay})` : ""}`
  } else if (dueDate > endOfTomorrow && dueDate <= endOfWeek) {
    // This Week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dayName = days[dateObj.getDay()]
    badgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
    label = `${dayName}${timeOfDay ? ` (${timeOfDay})` : ""}`
  } else {
    // Later
    badgeStyle = "bg-muted/40 text-muted-foreground border-border/40 dark:bg-muted/20 dark:text-muted-foreground/95"
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 text-[9px] font-medium border flex items-center gap-1 select-none",
        badgeStyle,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </Badge>
  )
}
