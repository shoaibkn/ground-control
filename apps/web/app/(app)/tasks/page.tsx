"use client"

import { useState } from "react"
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
  Kanban,
  List,
  Table as TableIcon,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Paperclip,
  MessageSquare,
} from "lucide-react"
import TasksSidebar from "./components/tasks-internal-sidebar"
import { CreateTaskDialog } from "./components/create-task-dialog"
import TaskDetailsSheet from "./components/task-details-sheet"
import { toast } from "sonner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { getAvatarUrl } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"

export default function TasksPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<"kanban" | "list" | "table">("table")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: activeOrg } = authClient.useActiveOrganization()
  
  // Fetch tasks for the current organization
  const tasks = useQuery(
    api.tasks.getTasks,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // Fetch organization member profiles
  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // Status update mutation
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus)

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
                        <span className="font-semibold text-sm text-foreground line-clamp-2">{task.title}</span>
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
                              ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
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
                      <TableHead className="w-[22%]">Task Title</TableHead>
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
                      filteredTasks.map((task: any) => (
                        <TableRow
                          key={task._id}
                          className="hover:bg-muted/15 transition-colors cursor-pointer"
                          onClick={() => setSelectedTaskId(task._id)}
                        >
                          {/* Title & Desc */}
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-xs text-foreground line-clamp-1">{task.title}</span>
                              {task.description && (
                                <span className="text-[10px] text-muted-foreground line-clamp-1">
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Priority Badge */}
                          <TableCell>
                            <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-medium border ${getPriorityStyle(task.priority)}`}>
                              Priority: {task.priority}
                            </Badge>
                          </TableCell>

                          {/* Status Select */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={task.status}
                              onValueChange={(val) => handleStatusChange(task._id, val)}
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
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "No due date"}
                              </span>
                            </div>
                          </TableCell>

                          {/* Assignees Avatars */}
                          <TableCell>
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                task.assigneeIds.map((userId: string) => (
                                  <UserAvatar
                                    key={userId}
                                    userId={userId}
                                    avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs transition-transform hover:translate-y-[-2px]"
                                  />
                                ))
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Files */}
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                              <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                              <span>{task.documentCount || 0}</span>
                            </div>
                          </TableCell>

                          {/* Comments */}
                          <TableCell>
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
                          </TableCell>                           {/* Last Activity */}
                          <TableCell>
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                          No tasks found. Try creating a new task to get started!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            /* Kanban / List Placeholder */
            <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="p-3 bg-primary/5 rounded-full border border-primary/10">
                <TableIcon className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-foreground">
                  {view === "kanban" ? "Kanban Board" : "List View"} Coming Soon
                </h4>
                <p className="text-[10px] text-muted-foreground max-w-xs mt-1">
                  We are building this view right now. Use the **Table View** to create, assign, and update task statuses.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setView("table")} className="h-7 text-[10px] mt-1">
                Switch to Table View
              </Button>
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
