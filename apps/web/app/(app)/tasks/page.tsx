"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/ui/components/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Plus,
  Kanban,
  List,
  Table as TableIcon,
  Search,
  Calendar,
  Paperclip,
  MessageSquare,
  Star,
  ChevronDown,
  Loader2,
  Columns,
  ChevronLeft,
  Archive,
} from "lucide-react"
import TasksSidebar from "./components/tasks-internal-sidebar"
import { CreateTaskDialog } from "./components/create-task-dialog"
import TaskDetailsSheet from "./components/task-details-sheet"
import { toast } from "sonner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import { TaskParticipantsHoverCard } from "@/components/task-participants-hover-card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@workspace/ui/components/dropdown-menu"

export default function TasksPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<"kanban" | "list" | "table">("table")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const { data: activeOrg } = authClient.useActiveOrganization()
  
  // Fetch tasks for the current organization
  const tasks = useQuery(
    api.tasks.getTasks,
    activeOrg ? { organizationId: activeOrg.id, showArchived } : "skip"
  )

  // Fetch organization member profiles
  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // Status update mutation with optimistic UI updates
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, status } = args
      if (activeOrg?.id) {
        const queryArgs = { organizationId: activeOrg.id, showArchived }
        const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
        if (tasksList) {
          const updatedTasks = tasksList.map((t: any) => {
            if (t._id === targetId) {
              return { ...t, status }
            }
            return t
          })
          localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
        }
      }
    }
  )

  // Star toggle mutation with optimistic UI updates
  const toggleStarTask = useMutation(api.tasks.toggleStarTask).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId } = args
      if (activeOrg?.id) {
        const queryArgs = { organizationId: activeOrg.id, showArchived }
        const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
        if (tasksList) {
          const updatedTasks = tasksList.map((t: any) => {
            if (t._id === targetId) {
              return { ...t, isStarred: !t.isStarred }
            }
            return t
          })
          localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
        }
      }
    }
  )

  // Group By states
  const [groupBy, setGroupBy] = useState<"none" | "priority" | "status" | "dueDate" | "starred">("none")
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  // Kanban states
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>([
    "Pending",
    "In Progress",
    "Under Review",
    "Completed",
    "Cancelled",
  ])
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>(["Completed"])

  const handleToggleStar = async (taskId: any) => {
    try {
      await toggleStarTask({ taskId })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to toggle starred status")
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    )
  }

  const getGroupedTasks = () => {
    if (!filteredTasks) return {}
    if (groupBy === "none") return { "": filteredTasks }

    const groups: Record<string, any[]> = {}

    if (groupBy === "priority") {
      filteredTasks.forEach((task: any) => {
        const key = `Priority: ${task.priority || "Normal"}`
        if (!groups[key]) groups[key] = []
        groups[key].push(task)
      })
    } else if (groupBy === "status") {
      filteredTasks.forEach((task: any) => {
        const key = `Status: ${task.status || "Pending"}`
        if (!groups[key]) groups[key] = []
        groups[key].push(task)
      })
    } else if (groupBy === "starred") {
      groups["Starred Tasks"] = []
      groups["Other Tasks"] = []
      filteredTasks.forEach((task: any) => {
        if (task.isStarred) {
          groups["Starred Tasks"]!.push(task)
        } else {
          groups["Other Tasks"]!.push(task)
        }
      })
      if (groups["Starred Tasks"]!.length === 0) delete groups["Starred Tasks"]
      if (groups["Other Tasks"]!.length === 0) delete groups["Other Tasks"]
    } else if (groupBy === "dueDate") {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
      const weekStart = todayStart + 7 * 24 * 60 * 60 * 1000

      groups["Overdue"] = []
      groups["Today"] = []
      groups["Tomorrow"] = []
      groups["This Week"] = []
      groups["Later"] = []
      groups["No Due Date"] = []

      filteredTasks.forEach((task: any) => {
        if (!task.dueDate) {
          groups["No Due Date"]!.push(task)
        } else if (task.dueDate < todayStart) {
          groups["Overdue"]!.push(task)
        } else if (task.dueDate >= todayStart && task.dueDate < tomorrowStart) {
          groups["Today"]!.push(task)
        } else if (task.dueDate >= tomorrowStart && task.dueDate < weekStart) {
          groups["Tomorrow"]!.push(task)
        } else if (task.dueDate >= weekStart && task.dueDate < weekStart + 6 * 24 * 60 * 60 * 1000) {
          groups["This Week"]!.push(task)
        } else {
          groups["Later"]!.push(task)
        }
      })

      Object.keys(groups).forEach((key) => {
        if (groups[key]!.length === 0) delete groups[key]
      })
    }

    return groups
  }

  if (!activeOrg) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Please select or create an organization first.</p>
      </div>
    )
  }

  const handleStatusChange = async (taskId: any, newStatus: string) => {
    try {
      const result = await updateTaskStatus({
        taskId,
        status: newStatus,
      })
      toast.success(`Task status updated to ${result.newStatus}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update task status")
    }
  }

  const getAssigneeDetails = (userId: string) => {
    const member = activeOrg.members?.find((m: any) => m.userId === userId)
    return member?.user
  }

  const getAssigneeDesignation = (userId: string) => {
    const member = activeOrg.members?.find((m: any) => m.userId === userId)
    if (!member) return undefined
    const profile = profiles?.find((p: any) => p.memberId === member.id)
    if (!profile) return undefined
    const position = profile.position
    const department = profile.department
    if (position && department) {
      return `${position}, ${department}`
    }
    return position || department
  }

  // Filter tasks by search query
  const filteredTasks = tasks?.filter((task: any) => {
    const titleMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    return titleMatch || descMatch
  })

  // Priority styling helper
  const getPriorityStyle = (priority: string) => {
    const num = parseInt(priority, 10)
    if (isNaN(num)) {
      switch (priority) {
        case "Low":
          return "bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50"
        case "Normal":
          return "bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/30"
        case "High":
          return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30"
        case "Urgent":
          return "bg-orange-50 text-orange-700 border-orange-200/30 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/30"
        case "Critical":
          return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/30 font-semibold"
        default:
          return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }
    }
    if (num <= 3) {
      return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/30"
    }
    if (num <= 7) {
      return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30"
    }
    return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/30 font-semibold"
  }

  // Status badge styling helper (for trigger)
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200/30 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/30"
      case "In Progress":
        return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/30"
      case "Under Review":
        return "bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/30"
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/30"
      case "Cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 line-through"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  return (
    <div className="flex flex-col w-full min-w-0 space-y-4">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Tasks Dashboard</h2>
            <p className="text-xs text-muted-foreground">
              Manage and collaborate on tasks inside {activeOrg.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Create Task Button */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-1.5 h-8 text-xs font-medium shadow-sm hover:scale-[1.02] transition-transform"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>

            {/* View Switcher */}
            <ButtonGroup>
              <Button
                size={"icon-sm"}
                variant={view === "kanban" ? "default" : "outline"}
                onClick={() => setView("kanban")}
                className="h-8 w-8"
              >
                <Kanban className="h-3.5 w-3.5" />
              </Button>
              <Button
                size={"icon-sm"}
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
                className="h-8 w-8"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                size={"icon-sm"}
                variant={view === "table" ? "default" : "outline"}
                onClick={() => setView("table")}
                className="h-8 w-8"
              >
                <TableIcon className="h-3.5 w-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="mb-4 flex items-center gap-2 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-input/10 dark:bg-input/20 border-input/40"
            />
          </div>

          {/* Group By selector (only shown in table and list views) */}
          {(view === "table" || view === "list") && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Group By:</span>
              <Select value={groupBy} onValueChange={(val: any) => setGroupBy(val)}>
                <SelectTrigger className="h-8 w-[120px] text-xs bg-input/10 dark:bg-input/20 border-input/40">
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Column Visibility selector (only shown in kanban view) */}
          {view === "kanban" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Columns:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-input/10 dark:bg-input/20 border-input/40 flex items-center gap-1.5">
                    <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>View Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-semibold">Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((status) => {
                    const isVisible = visibleStatuses.includes(status)
                    return (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={isVisible}
                        onCheckedChange={(checked) => {
                          setVisibleStatuses((prev) =>
                            checked
                              ? [...prev, status]
                              : prev.filter((s) => s !== status)
                          )
                        }}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Archived Toggle */}
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((prev) => !prev)}
            className={cn(
              "h-8 text-xs transition-colors flex items-center gap-1.5",
              showArchived
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground bg-input/10 dark:bg-input/20 border-input/40"
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>{showArchived ? "Hide Archived" : "Show Archived"}</span>
          </Button>

          <TasksSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 rounded-xl border border-border/80 bg-card/45 shadow-xs backdrop-blur-xs overflow-hidden">
          {tasks === undefined ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading organization tasks...</p>
            </div>
          ) : view === "table" ? (
            isMobile ? (
              <div className="flex flex-col divide-y divide-border/40">
                {filteredTasks && filteredTasks.length > 0 ? (
                  filteredTasks.map((task: any) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTaskId(task._id)}
                      className="p-4 flex flex-col gap-3 hover:bg-muted/5 transition-colors cursor-pointer"
                    >
                      {/* Title and Description */}
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm text-foreground line-clamp-2">
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                              toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                            }}
                            className="font-mono text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors mr-1 select-all font-medium cursor-pointer"
                          >
                            #{task._id.slice(-4)}
                          </span>{" "}
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground line-clamp-3">
                            {task.description}
                          </span>
                        )}
                      </div>

                      {/* Badges: Priority & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-medium border ${getPriorityStyle(task.priority)}`}>
                          Priority: {task.priority}
                        </Badge>

                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={task.status}
                            onValueChange={(val) => handleStatusChange(task._id, val)}
                          >
                            <SelectTrigger className={`h-7 w-[120px] px-2 py-0 border text-[10px] font-medium rounded-full cursor-pointer transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}>
                              <SelectValue placeholder={task.status} />
                            </SelectTrigger>
                            <SelectContent position="popper" className="text-xs">
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Under Review">Under Review</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Metrics: Files, Comments, and Last Activity */}
                      <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1">
                        <div className="flex items-center gap-3">
                          {/* Files Count */}
                          <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{task.documentCount || 0} files</span>
                          </div>

                          {/* Comments Count */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className={`h-3.5 w-3.5 ${task.unreadCommentCount > 0 ? "text-blue-500 fill-blue-500/10" : "text-muted-foreground/60"}`} />
                              <span className={task.unreadCommentCount > 0 ? "font-semibold text-foreground" : ""}>
                                {task.commentCount || 0}
                              </span>
                            </div>
                            {task.unreadCommentCount > 0 && (
                              <Badge variant="default" className="h-4 px-1 text-[9px] bg-blue-500 hover:bg-blue-600 text-white border-none scale-90 font-semibold shrink-0">
                                {task.unreadCommentCount} new
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Last Activity */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <AvatarHoverCard user={task.lastActivity?.actor} userId={task.lastActivity?.actorId}>
                            <Avatar className="h-4 w-4 shrink-0">
                              <AvatarImage src={getAvatarUrl(task.lastActivity?.actor?.image, task.lastActivity?.actor?.name)} />
                              <AvatarFallback className="text-[7px] bg-accent text-accent-foreground font-semibold">
                                {task.lastActivity?.actor?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </AvatarHoverCard>
                          <span className="text-[9px] text-muted-foreground max-w-[150px] truncate">
                            {formatAction(task.lastActivity?.action)} • {formatTimeAgo(task.lastActivity?.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Date and Assignees */}
                      <div className="flex items-center justify-between pt-2.5 text-[10px] text-muted-foreground border-t border-dashed border-border/40">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span>
                            {task.dueDate
                              ? `${new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}${task.timeOfDay ? ` (${task.timeOfDay})` : ""}`
                              : "No due date"}
                          </span>
                        </div>

                        <div className="flex -space-x-1.5 overflow-hidden">
                          {task.assigneeIds && task.assigneeIds.length > 0 ? (
                            task.assigneeIds.map((userId: string) => (
                              <UserAvatar
                                key={userId}
                                userId={userId}
                                avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs hover:translate-y-[-2px] transition-transform"
                              />
                            ))
                          ) : (
                            <span className="text-[10px] italic">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center text-center text-muted-foreground text-xs p-4">
                    No tasks found. Try creating a new task to get started!
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[4%] text-center">
                        <Star className="h-3 w-3 mx-auto text-muted-foreground/40" />
                      </TableHead>
                      <TableHead className="w-[18%]">Task Title</TableHead>
                      <TableHead className="w-[10%]">Priority</TableHead>
                      <TableHead className="w-[13%]">Status</TableHead>
                      <TableHead className="w-[12%]">Due Date</TableHead>
                      <TableHead className="w-[13%]">Assignees</TableHead>
                      <TableHead className="w-[6%]">Files</TableHead>
                      <TableHead className="w-[8%]">Comments</TableHead>
                      <TableHead className="w-[16%]">Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks && filteredTasks.length > 0 ? (
                      Object.entries(getGroupedTasks()).map(([groupKey, groupTasks]) => {
                        const isCollapsed = collapsedGroups.includes(groupKey)
                        return (
                          <React.Fragment key={groupKey}>
                            {/* Group Header Row */}
                            {groupKey && (
                              <TableRow
                                className="bg-muted/40 hover:bg-muted/50 cursor-pointer select-none border-y border-border/60"
                                onClick={() => toggleGroupCollapse(groupKey)}
                              >
                                <TableCell colSpan={9} className="py-2 px-3 font-semibold text-xs text-foreground/80">
                                  <div className="flex items-center gap-2">
                                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90 text-muted-foreground/60" : "text-foreground/70"}`} />
                                    <span>{groupKey}</span>
                                    <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] font-normal text-muted-foreground/80">
                                      {groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Group Task Rows */}
                            {!isCollapsed &&
                              groupTasks.map((task: any) => (
                                <TableRow
                                  key={task._id}
                                  className={`hover:bg-muted/15 transition-colors cursor-pointer ${task.isArchived ? "opacity-60 bg-muted/5" : ""}`}
                                  onClick={() => setSelectedTaskId(task._id)}
                                >
                                  {/* Star toggle */}
                                  <TableCell className="w-[4%] text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      disabled={task.isArchived}
                                      onClick={() => !task.isArchived && handleToggleStar(task._id)}
                                      className={`focus:outline-none transition-colors ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                    >
                                      <Star
                                        className={`h-3.5 w-3.5 transition-all ${
                                          task.isStarred
                                            ? "fill-amber-400 text-amber-400 filter drop-shadow-xs scale-110"
                                            : "text-muted-foreground/35 hover:text-amber-400 hover:scale-105"
                                        }`}
                                      />
                                    </button>
                                  </TableCell>

                                  {/* Title & Desc */}
                                  <TableCell className="w-[18%]">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs text-foreground line-clamp-1">
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                                              toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                                            }}
                                            className="font-mono text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors mr-1 select-all font-medium cursor-pointer"
                                          >
                                            #{task._id.slice(-4)}
                                          </span>{" "}
                                          {task.title}
                                        </span>
                                        {task.isArchived && (
                                          <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[8px] font-normal opacity-85 shrink-0 select-none">
                                            Archived
                                          </Badge>
                                        )}
                                      </div>
                                      {task.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                          {task.description}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Priority Badge */}
                                  <TableCell className="w-[10%]">
                                    <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-medium border ${getPriorityStyle(task.priority)}`}>
                                      Priority: {task.priority}
                                    </Badge>
                                  </TableCell>

                                  {/* Status Select */}
                                  <TableCell className="w-[13%]" onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={task.status}
                                      onValueChange={(val) => handleStatusChange(task._id, val)}
                                      disabled={task.isArchived}
                                    >
                                      <SelectTrigger className={`h-6 w-[120px] px-2 py-0 border text-[10px] font-medium rounded-full cursor-pointer transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}>
                                        <SelectValue placeholder={task.status} />
                                      </SelectTrigger>
                                      <SelectContent position="popper" className="text-xs">
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Under Review">Under Review</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>

                                  {/* Due Date */}
                                  <TableCell className="w-[12%]">
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                                      <Calendar className="h-3 w-3 shrink-0" />
                                      <span>
                                        {task.dueDate
                                          ? `${new Date(task.dueDate).toLocaleDateString(undefined, {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}${task.timeOfDay ? ` (${task.timeOfDay})` : ""}`
                                          : "No due date"}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Assignees Avatars */}
                                  <TableCell className="w-[13%]" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex -space-x-1.5 overflow-hidden items-center">
                                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                        task.assigneeIds.slice(0, 3).map((userId: string) => (
                                          <UserAvatar
                                            key={userId}
                                            userId={userId}
                                            avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs transition-transform hover:translate-y-[-2px]"
                                          />
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground italic pr-1.5">Unassigned</span>
                                      )}
                                      <TaskParticipantsHoverCard task={task} />
                                    </div>
                                  </TableCell>

                                  {/* Files */}
                                  <TableCell className="w-[6%]">
                                    <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                                      <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                      <span>{task.documentCount || 0}</span>
                                    </div>
                                  </TableCell>

                                  {/* Comments */}
                                  <TableCell className="w-[8%]">
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MessageSquare className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "text-blue-500 fill-blue-500/10" : "text-muted-foreground/60"}`} />
                                        <span className={task.unreadCommentCount > 0 ? "font-semibold text-foreground" : ""}>
                                          {task.commentCount || 0}
                                        </span>
                                      </div>
                                      {task.unreadCommentCount > 0 && (
                                        <Badge variant="default" className="h-4 px-1 text-[9px] bg-blue-500 hover:bg-blue-600 text-white border-none scale-90 font-semibold shrink-0">
                                          {task.unreadCommentCount} new
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Last Activity */}
                                  <TableCell className="w-[16%]">
                                    <div className="flex items-center gap-2">
                                      <AvatarHoverCard user={task.lastActivity?.actor} userId={task.lastActivity?.actorId}>
                                        <Avatar className="h-4.5 w-4.5 shrink-0">
                                          <AvatarImage src={getAvatarUrl(task.lastActivity?.actor?.image, task.lastActivity?.actor?.name)} />
                                          <AvatarFallback className="text-[8px] bg-accent text-accent-foreground font-semibold">
                                            {task.lastActivity?.actor?.name?.charAt(0) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      </AvatarHoverCard>
                                      <div className="flex flex-col min-w-0 select-none">
                                        <span className="text-[10px] text-foreground font-medium truncate max-w-[110px]" title={formatAction(task.lastActivity?.action)}>
                                          {formatAction(task.lastActivity?.action)}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground truncate">
                                          {formatTimeAgo(task.lastActivity?.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                   </TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                          No tasks found. Try creating a new task to get started!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )
          ) : view === "list" ? (
            <div className="w-full p-4 overflow-auto max-h-[calc(100vh-220px)]">
              {filteredTasks && filteredTasks.length > 0 ? (
                Object.entries(getGroupedTasks()).map(([groupKey, groupTasks]) => {
                  const isCollapsed = collapsedGroups.includes(groupKey)
                  return (
                    <React.Fragment key={groupKey}>
                      {/* Group Header banner */}
                      {groupKey && (
                        <div
                          className="flex items-center gap-2 py-2 px-3 mb-3 font-semibold text-xs text-foreground/80 bg-muted/40 hover:bg-muted/50 cursor-pointer select-none rounded-lg border border-border/40"
                          onClick={() => toggleGroupCollapse(groupKey)}
                        >
                          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90 text-muted-foreground/60" : "text-foreground/70"}`} />
                          <span>{groupKey}</span>
                          <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] font-normal text-muted-foreground/80">
                            {groupTasks.length} {groupTasks.length === 1 ? "task" : "tasks"}
                          </Badge>
                        </div>
                      )}

                      {/* Group Card Grid */}
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                          {groupTasks.map((task: any) => (
                            <div
                              key={task._id}
                              className={`bg-card/50 backdrop-blur-xs border border-border/60 rounded-xl p-4 flex flex-col justify-between min-h-[190px] hover:shadow-md hover:border-primary/20 hover:bg-card/85 dark:hover:bg-card/75 transition-all duration-300 cursor-pointer group ${task.isArchived ? "opacity-60 bg-muted/5" : ""}`}
                              onClick={() => setSelectedTaskId(task._id)}
                            >
                              {/* Card Top Row: Star toggle & Priority Badge */}
                              <div className="flex items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={task.isArchived}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!task.isArchived) handleToggleStar(task._id)
                                    }}
                                    className={`focus:outline-none transition-colors ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                  >
                                    <Star
                                      className={`h-4 w-4 transition-all ${
                                        task.isStarred
                                          ? "fill-amber-400 text-amber-400 filter drop-shadow-xs scale-110"
                                          : "text-muted-foreground/35 hover:text-amber-400 hover:scale-105"
                                      }`}
                                    />
                                  </button>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                                      toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                                    }}
                                    className="font-mono text-[9px] text-muted-foreground/60 hover:text-foreground transition-colors select-all font-medium cursor-pointer"
                                  >
                                    #{task._id.slice(-4)}
                                  </span>
                                </div>

                                <Badge variant="outline" className={`px-2 py-0 h-5 text-[9px] font-medium border ${getPriorityStyle(task.priority)}`}>
                                  {task.priority}
                                </Badge>
                              </div>

                              {/* Card Middle: Title & Description */}
                              <div className="flex-1 flex flex-col gap-1.5 mb-3">
                                <div className="flex items-center gap-1.5 justify-between w-full">
                                  <span className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {task.title}
                                  </span>
                                  {task.isArchived && (
                                    <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[8px] font-normal opacity-85 shrink-0 select-none">
                                      Archived
                                    </Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <span className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </span>
                                )}
                              </div>

                              {/* Card Details: Status & Due Date */}
                              <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-border/40 mb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-medium text-muted-foreground">Status:</span>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={task.status}
                                      onValueChange={(val) => handleStatusChange(task._id, val)}
                                      disabled={task.isArchived}
                                    >
                                      <SelectTrigger className={`h-6 w-[110px] px-2 py-0 border text-[9px] font-medium rounded-full cursor-pointer transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}>
                                        <SelectValue placeholder={task.status} />
                                      </SelectTrigger>
                                      <SelectContent position="popper" className="text-xs">
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Under Review">Under Review</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span className="font-medium">Due Date:</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                    <span>
                                      {task.dueDate
                                        ? `${new Date(task.dueDate).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}${task.timeOfDay ? ` (${task.timeOfDay})` : ""}`
                                        : "No due date"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer: Metrics (Comments/Files) & Assignees */}
                              <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-2.5">
                                  {/* Files Count */}
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                    <span>{task.documentCount || 0}</span>
                                  </div>

                                  {/* Comments Count */}
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <MessageSquare className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "text-blue-500 fill-blue-500/10" : "text-muted-foreground/60"}`} />
                                    <span className={task.unreadCommentCount > 0 ? "font-semibold text-foreground" : ""}>
                                      {task.commentCount || 0}
                                    </span>
                                    {task.unreadCommentCount > 0 && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    )}
                                  </div>
                                </div>

                                {/* Assignee avatars */}
                                <div className="flex -space-x-1.5 overflow-hidden items-center" onClick={(e) => e.stopPropagation()}>
                                  {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                    task.assigneeIds.slice(0, 3).map((userId: string) => (
                                      <UserAvatar
                                        key={userId}
                                        userId={userId}
                                        avatarClassName="h-5 w-5 border-2 border-card shadow-xs transition-transform hover:translate-y-[-1px]"
                                      />
                                    ))
                                  ) : (
                                    <span className="text-[9px] italic text-muted-foreground pr-1">Unassigned</span>
                                  )}
                                  <TaskParticipantsHoverCard task={task} />
                                </div>
                              </div>

                              {/* Micro last activity row */}
                              <div className="flex items-center gap-1.5 mt-2.5 pt-1.5 border-t border-dashed border-border/30 text-[9px] text-muted-foreground">
                                <AvatarHoverCard user={task.lastActivity?.actor} userId={task.lastActivity?.actorId}>
                                  <Avatar className="h-4 w-4 shrink-0">
                                    <AvatarImage src={getAvatarUrl(task.lastActivity?.actor?.image, task.lastActivity?.actor?.name)} />
                                    <AvatarFallback className="text-[7px] bg-accent text-accent-foreground font-semibold">
                                      {task.lastActivity?.actor?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </AvatarHoverCard>
                                <span className="truncate max-w-[170px]">
                                  {formatAction(task.lastActivity?.action)} • {formatTimeAgo(task.lastActivity?.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <div className="h-32 flex items-center justify-center text-center text-muted-foreground text-xs p-4">
                  No tasks found. Try creating a new task to get started!
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 p-4 overflow-x-auto w-full h-[calc(100vh-220px)] items-stretch select-none">
              {visibleStatuses.map((status) => {
                const isCollapsed = collapsedColumns.includes(status)
                const statusTasks = filteredTasks?.filter((t: any) => t.status === status) || []

                const handleDragOver = (e: React.DragEvent) => {
                  e.preventDefault()
                }

                const handleDrop = async (e: React.DragEvent) => {
                  e.preventDefault()
                  const taskId = e.dataTransfer.getData("taskId")
                  if (!taskId) return
                  // Find task to see if it changed
                  const task = filteredTasks?.find((t: any) => t._id === taskId)
                  if (task && task.status !== status) {
                    await handleStatusChange(taskId, status)
                  }
                }

                if (isCollapsed) {
                  return (
                    <div
                      key={status}
                      onClick={() => setCollapsedColumns((prev) => prev.filter((s) => s !== status))}
                      className="w-12 shrink-0 bg-muted/10 border border-border/30 hover:bg-muted/15 transition-all cursor-pointer rounded-xl p-3 flex flex-col items-center justify-between h-full group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <button
                          type="button"
                          className="p-1 rounded-md hover:bg-muted/20 text-muted-foreground/60 group-hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCollapsedColumns((prev) => prev.filter((s) => s !== status))
                          }}
                        >
                          <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                        </button>
                        <div className="h-px w-full bg-border/40" />
                        <span
                          className="font-bold text-xs text-muted-foreground/80 tracking-wider whitespace-nowrap"
                          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                        >
                          {status}
                        </span>
                      </div>
                      <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[9px] font-normal text-muted-foreground/60">
                        {statusTasks.length}
                      </Badge>
                    </div>
                  )
                }

                return (
                  <div
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex-1 min-w-[280px] max-w-[340px] shrink-0 bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col h-full transition-colors duration-200"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === "Pending" ? "bg-yellow-400" :
                          status === "In Progress" ? "bg-sky-400" :
                          status === "Under Review" ? "bg-purple-400" :
                          status === "Completed" ? "bg-emerald-400" :
                          "bg-slate-400"
                        }`} />
                        <span className="font-semibold text-xs text-foreground/90">{status}</span>
                        <Badge variant="secondary" className="px-1.5 py-0 h-4.5 text-[10px] font-medium text-muted-foreground/80">
                          {statusTasks.length}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCollapsedColumns((prev) => [...prev, status])}
                        className="p-1 rounded-md hover:bg-muted/30 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                        title="Collapse Column"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Task Cards List */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 scrollbar-thin">
                      {statusTasks.length > 0 ? (
                        statusTasks.map((task: any) => (
                          <div
                            key={task._id}
                            draggable={!task.isArchived}
                            onDragStart={(e) => {
                              if (task.isArchived) return
                              e.dataTransfer.setData("taskId", task._id)
                              e.dataTransfer.effectAllowed = "move"
                            }}
                            className={`bg-card/65 backdrop-blur-xs border border-border/50 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-primary/20 hover:bg-card dark:hover:bg-card/85 transition-all group ${task.isArchived ? "opacity-60 bg-muted/5 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                            onClick={() => setSelectedTaskId(task._id)}
                          >
                            {/* Card Top Row: Star & Priority */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={task.isArchived}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!task.isArchived) handleToggleStar(task._id)
                                  }}
                                  className={`focus:outline-none transition-colors ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                >
                                  <Star
                                    className={`h-3.5 w-3.5 transition-all ${
                                      task.isStarred
                                        ? "fill-amber-400 text-amber-400 filter drop-shadow-xs scale-110"
                                        : "text-muted-foreground/35 hover:text-amber-400 hover:scale-105"
                                    }`}
                                  />
                                </button>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                                    toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                                  }}
                                  className="font-mono text-[9px] text-muted-foreground/60 hover:text-foreground transition-colors select-all font-medium cursor-pointer"
                                >
                                  #{task._id.slice(-4)}
                                </span>
                              </div>
                              <Badge variant="outline" className={`px-1.5 py-0 h-4.5 text-[8px] font-medium border ${getPriorityStyle(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>

                             {/* Card Info */}
                             <div className="flex flex-col gap-0.5 mb-2">
                               <div className="flex items-center gap-1.5 justify-between w-full">
                                 <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                   {task.title}
                                 </span>
                                {task.isArchived && (
                                  <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[8px] font-normal opacity-85 shrink-0 select-none">
                                    Archived
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <span className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                  {task.description}
                                </span>
                              )}
                            </div>

                            {/* Card Due Date */}
                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mb-2.5 bg-muted/30 dark:bg-muted/10 rounded-md p-1 px-1.5 border border-border/20">
                              <Calendar className="h-3 w-3 text-muted-foreground/70" />
                              <span className="truncate">
                                {task.dueDate
                                  ? `${new Date(task.dueDate).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}${task.timeOfDay ? ` (${task.timeOfDay})` : ""}`
                                  : "No due date"}
                              </span>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[9px] text-muted-foreground">
                              {/* Metrics */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                  <span>{task.documentCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <MessageSquare className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "text-blue-500 fill-blue-500/10" : "text-muted-foreground/60"}`} />
                                  <span className={task.unreadCommentCount > 0 ? "font-semibold text-foreground" : ""}>
                                    {task.commentCount || 0}
                                  </span>
                                </div>
                              </div>

                              {/* Assignees */}
                              <div className="flex -space-x-1.5 overflow-hidden items-center" onClick={(e) => e.stopPropagation()}>
                                {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                  task.assigneeIds.slice(0, 3).map((userId: string) => (
                                    <UserAvatar
                                      key={userId}
                                      userId={userId}
                                      avatarClassName="h-4.5 w-4.5 border border-card shadow-xs"
                                    />
                                  ))
                                ) : (
                                  <span className="text-[8px] italic text-muted-foreground pr-0.5">Unassigned</span>
                                )}
                                <TaskParticipantsHoverCard task={task} />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-24 flex items-center justify-center border border-dashed border-border/30 rounded-xl text-center text-muted-foreground/60 text-[10px] p-2">
                          No tasks in this status
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Dialog for creating tasks */}
        <CreateTaskDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />

        {/* Sheet for displaying task details */}
        <TaskDetailsSheet
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      </div>
    )
  }

const formatAction = (action?: string) => {
  if (!action) return "No activity"
  switch (action) {
    case "TASK_CREATED":
      return "Task created"
    case "STATUS_CHANGED":
      return "Status updated"
    case "TASK_UPDATED":
      return "Task updated"
    case "ASSIGNEES_UPDATED":
      return "Assignees updated"
    case "COLLABORATORS_UPDATED":
      return "Collaborators updated"
    case "SUBSCRIBERS_UPDATED":
      return "Subscribers updated"
    case "SUBTASK_CREATED":
      return "Subtask added"
    case "SUBTASK_TOGGLED":
      return "Subtask toggled"
    case "ATTACHMENT_ADDED":
      return "File attached"
    case "ATTACHMENT_DELETED":
      return "File deleted"
    case "COMMENT_ADDED":
      return "Comment added"
    default:
      return action
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return ""
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
