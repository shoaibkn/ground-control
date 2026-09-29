"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Clock,
  Activity,
  CheckSquare,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  FolderKanban,
  Building,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { usePageTitle } from "@/hooks/use-page-title"
import { CreateTaskDialog } from "../tasks/components/create-task-dialog"

export default function DashboardPage() {
  const router = useRouter()
  usePageTitle("Dashboard")

  const { data: session } = authClient.useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()

  const orgId = activeOrg?.id

  // Live Convex Queries
  const tasks = useQuery(
    api.tasks.getTasks,
    orgId ? { organizationId: orgId } : "skip"
  )

  const approvals = useQuery(
    api.approvals.getApprovals,
    orgId ? { organizationId: orgId } : "skip"
  )

  const threads = useQuery(
    api.inbox.getInboxThreads,
    orgId ? { organizationId: orgId } : "skip"
  )

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    orgId ? { organizationId: orgId, limit: 6 } : "skip"
  )

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    orgId ? { organizationId: orgId } : "skip"
  )

  // Live Convex Mutations
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus)

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  // User Greeting
  const userFullName = session?.user?.name
  const userFirstName = userFullName
    ? userFullName.split(" ")[0]
    : session?.user?.email
      ? session.user.email.split("@")[0]
      : "there"

  // Metrics Calculation
  const totalTasks = tasks?.length ?? 0
  const activeTasks = useMemo(
    () =>
      tasks?.filter(
        (t) => t.status !== "Completed" && t.status !== "Cancelled"
      ) ?? [],
    [tasks]
  )
  const completedTasks = useMemo(
    () => tasks?.filter((t) => t.status === "Completed") ?? [],
    [tasks]
  )

  const highPriorityActiveCount = useMemo(
    () =>
      activeTasks.filter(
        (t) =>
          t.priority === "High" ||
          t.priority === "Urgent" ||
          t.priority === "Critical"
      ).length,
    [activeTasks]
  )

  const pendingApprovalsCount = useMemo(
    () => approvals?.filter((a) => a.status === "Pending").length ?? 0,
    [approvals]
  )

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const activeThreadsCount = threads?.length ?? 0
  const unreadAlerts = unreadCount ?? 0

  const stats = [
    {
      title: "Active Tasks",
      value: tasks === undefined ? "—" : activeTasks.length.toString(),
      description:
        tasks === undefined
          ? "Loading tasks..."
          : highPriorityActiveCount > 0
            ? `${highPriorityActiveCount} high priority items`
            : "All items on schedule",
      icon: CheckSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Approvals",
      value: approvals === undefined ? "—" : pendingApprovalsCount.toString(),
      description:
        approvals === undefined
          ? "Loading approvals..."
          : pendingApprovalsCount > 0
            ? `${pendingApprovalsCount} requiring action`
            : "No pending reviews",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Active Threads",
      value: threads === undefined ? "—" : activeThreadsCount.toString(),
      description:
        unreadAlerts > 0
          ? `${unreadAlerts} unread notification${unreadAlerts > 1 ? "s" : ""}`
          : "All discussions read",
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Completion Rate",
      value: tasks === undefined ? "—" : `${completionRate}%`,
      description:
        tasks === undefined
          ? "Calculating..."
          : `${completedTasks.length} of ${totalTasks} completed`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ]

  // Top 5 checklist tasks (active first, sorted by due date)
  const sortedTasks = useMemo(() => {
    if (!tasks) return []
    return [...tasks]
      .sort((a, b) => {
        const aDone = a.status === "Completed" || a.status === "Cancelled"
        const bDone = b.status === "Completed" || b.status === "Cancelled"
        if (aDone !== bDone) return aDone ? 1 : -1
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return b._creationTime - a._creationTime
      })
      .slice(0, 5)
  }, [tasks])

  const handleToggleTask = async (
    e: React.MouseEvent,
    taskId: any,
    currentStatus: string
  ) => {
    e.stopPropagation()
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed"
    try {
      await updateTaskStatus({ taskId, status: newStatus })
      toast.success(
        newStatus === "Completed"
          ? "Task marked as completed"
          : "Task marked as pending"
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to update task status")
    }
  }

  const getPriorityBadgeProps = (priority: string) => {
    const num = parseInt(priority, 10)
    if (!isNaN(num)) {
      if (num <= 3) return { variant: "outline" as const, label: `P${num} Low` }
      if (num <= 7) return { variant: "secondary" as const, label: `P${num} Medium` }
      return { variant: "destructive" as const, label: `P${num} High` }
    }
    switch (priority) {
      case "Critical":
      case "Urgent":
      case "High":
        return { variant: "destructive" as const, label: priority }
      case "Normal":
      case "Medium":
        return { variant: "secondary" as const, label: priority }
      default:
        return { variant: "outline" as const, label: priority }
    }
  }

  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return { text: "No deadline", isOverdue: false }
    const date = new Date(timestamp)
    const isOverdue = timestamp < Date.now()
    return {
      text: format(date, "MMM d, yyyy"),
      isOverdue,
    }
  }

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return "recently"
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "recently"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-6 text-white shadow-xl dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs text-primary-foreground backdrop-blur-xs"
              >
                <Sparkles className="mr-1 size-3.5 animate-pulse text-amber-400" />
                {activeOrg ? activeOrg.name : "Ground Control"}
              </Badge>
              {activeMember?.role && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                >
                  {activeMember.role}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              Welcome back, {userFirstName}!
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Here is what is happening across {activeOrg?.name || "your organization"} today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              className="gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/95 hover:shadow-primary/20"
            >
              <Plus className="size-3.5" data-icon="inline-start" /> Create Task
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="overflow-hidden border border-border/60 shadow-xs transition-all duration-300 hover:border-border hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {stat.title}
                  </span>
                  <div className={`rounded-xl p-2 ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {stat.description}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Grid: Tasks & Activities */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Task List (Left column group) */}
        <Card className="border border-border/60 shadow-xs md:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 className="size-4 text-primary" />
                Action Items Checklist
              </CardTitle>
              <CardDescription className="text-[10px]">
                Your assignments and active work requests.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tasks")}
              className="h-8 gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              View All <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pt-0 pb-4">
            {tasks === undefined ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center">
                <FolderKanban className="size-8 text-muted-foreground/60 mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  No tasks recorded in this workspace
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">
                  Create a task to assign milestones, track progress, and organize team delivery.
                </p>
                <Button
                  size="sm"
                  className="mt-3.5 h-8 gap-1 text-xs"
                  onClick={() => setIsCreateTaskOpen(true)}
                >
                  <Plus className="size-3.5" data-icon="inline-start" /> Create Task
                </Button>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const priorityBadge = getPriorityBadgeProps(task.priority)
                const dueInfo = formatDueDate(task.dueDate)
                const isCompleted = task.status === "Completed"

                return (
                  <div
                    key={task._id}
                    onClick={() => router.push(`/tasks?taskId=${task._id}`)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all select-none ${
                      isCompleted
                        ? "border-muted/50 bg-muted/20 opacity-70"
                        : "border-border/60 bg-card hover:border-border hover:shadow-xs"
                    }`}
                  >
                    <div
                      className="mt-0.5"
                      onClick={(e) => handleToggleTask(e, task._id, task.status)}
                    >
                      <div
                        className={`flex size-4.5 items-center justify-center rounded-sm border transition-colors ${
                          isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-muted-foreground/40 hover:border-primary"
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle2 className="size-3.5 fill-emerald-500 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs leading-tight font-semibold ${
                          isCompleted
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`flex items-center gap-1 text-[10px] ${
                            dueInfo.isOverdue && !isCompleted
                              ? "font-medium text-rose-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="size-3" />
                          {dueInfo.isOverdue && !isCompleted ? "Overdue: " : ""}
                          {dueInfo.text}
                        </span>
                        <Badge
                          variant={priorityBadge.variant}
                          className="rounded-md px-1.5 py-0 text-[9px]"
                        >
                          {priorityBadge.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-md px-1.5 py-0 text-[9px] text-muted-foreground"
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed (Right column group) */}
        <Card className="flex flex-col justify-between border border-border/60 shadow-xs md:col-span-5">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Activity className="size-4 text-primary" />
              Recent Feed
            </CardTitle>
            <CardDescription className="text-[10px]">
              Updates and dispatches from members of your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 px-4 pt-0 pb-4">
            {notifications === undefined ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Activity className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-medium text-foreground">No recent alerts</p>
                <p className="text-[10px] mt-0.5 text-muted-foreground max-w-xs">
                  Activity feeds, task notices, and approvals will populate here as work happens.
                </p>
              </div>
            ) : (
              notifications.map((item, idx) => {
                const hasLink = !!item.link
                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (item.link) router.push(item.link)
                    }}
                    className={`relative flex gap-3 text-xs ${
                      hasLink ? "cursor-pointer rounded-lg p-1.5 hover:bg-muted/40 transition-colors" : ""
                    }`}
                  >
                    {idx !== notifications.length - 1 && (
                      <div className="absolute top-6 bottom-[-20px] left-[9px] w-0.5 bg-border/60" />
                    )}
                    <div className="mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-primary text-[9px] font-bold">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-foreground font-medium">
                        {item.title}
                      </p>
                      {item.message && (
                        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                      )}
                      <span className="mt-1 block text-[9px] text-muted-foreground/80">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
          <CardFooter className="border-t border-border/60 bg-muted/10 p-4">
            <div className="flex w-full items-center justify-between text-xs">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Building className="size-3 text-muted-foreground" />
                {activeOrg?.name || "Workspace"}
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/5 text-[9px] text-emerald-500 font-medium"
              >
                All Systems Normal
              </Badge>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        setIsOpen={setIsCreateTaskOpen}
      />
    </div>
  )
}
