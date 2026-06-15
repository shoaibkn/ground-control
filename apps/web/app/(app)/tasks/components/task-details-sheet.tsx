"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/ui/components/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import {
  Plus,
  Loader2,
  UserPlus,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  FileText,
  User,
  Clock,
  X,
  ListTodo,
  Pencil,
  Star,
  MoreHorizontal,
  Tag,
  File,
  Download,
  Calendar,
  MessageSquare,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { getAvatarUrl } from "@workspace/ui/lib/utils"

interface TaskDetailsSheetProps {
  taskId: any
  isOpen: boolean
  onClose: () => void
}

export default function TaskDetailsSheet({
  taskId,
  isOpen,
  onClose,
}: TaskDetailsSheetProps) {
  const { data: session } = authClient.useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()

  const task = useQuery(api.tasks.getTask, taskId ? { taskId } : "skip")
  const subtasks = useQuery(api.tasks.getSubtasks, taskId ? { taskId } : "skip")
  const auditLogs = useQuery(
    api.tasks.getTaskAuditLogs,
    taskId ? { taskId } : "skip"
  )
  const attachments = useQuery(
    api.taskAttachments.getAttachments,
    taskId ? { taskId } : "skip"
  )

  const updateDetails = useMutation(api.tasks.updateTaskDetails)
  const updateStatus = useMutation(api.tasks.updateTaskStatus)
  const invite = useMutation(api.tasks.inviteAssignees)
  const updateCollabs = useMutation(api.tasks.updateCollaborators)
  const updateSubs = useMutation(api.tasks.updateSubscribers)
  const addSubtask = useMutation(api.tasks.createSubtask)
  const toggleSub = useMutation(api.tasks.toggleSubtask)
  const registerAttach = useMutation(api.taskAttachments.registerAttachment)
  const deleteAttach = useMutation(api.taskAttachments.deleteAttachment)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubtaskLoading, setIsSubtaskLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [collabInviteOpen, setCollabInviteOpen] = useState(false)
  const [subInviteOpen, setSubInviteOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const [collabSearch, setCollabSearch] = useState("")
  const [subSearch, setSubSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddNewOpen, setIsAddNewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "activity" | "my-work" | "assigned" | "comments"
  >("activity")
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  // Sync details when task updates
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
    }
  }, [task])

  if (!isOpen) return null

  const currentUserId = session?.user?.id
  const currentUserMember = activeOrg?.members?.find(
    (m: any) => m.userId === currentUserId
  )
  const isAdminOrOwner =
    activeMember?.role === "admin" ||
    activeMember?.role === "owner" ||
    currentUserMember?.role === "admin" ||
    currentUserMember?.role === "owner"
  const isCreator = task?.creatorId === currentUserId
  const isAssignee = currentUserId ? (task?.assigneeIds?.includes(currentUserId) || false) : false
  const isCollaborator = currentUserId ? (task?.collaboratorIds?.includes(currentUserId) || false) : false
  const isSubscriber = currentUserId ? (task?.subscriberIds?.includes(currentUserId) || false) : false

  const canEditTaskDetails = isAdminOrOwner || isCreator
  const canUpdateStatus = isAdminOrOwner || isCreator || isAssignee || isCollaborator
  const canManageSubtasks = isAdminOrOwner || isCreator || isAssignee || isCollaborator
  const canManageAssignees = isAdminOrOwner || isCreator
  const canManageCollaborators = isAdminOrOwner || isCreator || isAssignee
  const canManageSubscribers = isAdminOrOwner || isCreator || isAssignee || isCollaborator
  const canAddAttachments = isAdminOrOwner || isCreator || isAssignee || isCollaborator || isSubscriber

  console.log("Task details permission check:", {
    currentUserId,
    activeMemberRole: activeMember?.role,
    currentUserMemberRole: currentUserMember?.role,
    isAdminOrOwner,
    isCreator,
    isAssignee,
    canManageCollaborators,
    canManageSubscribers,
  })

  const totalSubtasks = subtasks?.length || 0
  const completedSubtasks = subtasks?.filter((st) => st.isCompleted).length || 0
  const progressPercent =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0

  const handleUpdate = async (fields: {
    title?: string
    description?: string
    priority?: string
    dueDate?: number
  }) => {
    if (!taskId || !canEditTaskDetails) return
    setIsSaving(true)
    try {
      await updateDetails({
        taskId,
        ...fields,
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update task details")
      // Reset local state if failed
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!taskId || !canUpdateStatus) return
    try {
      const res = await updateStatus({
        taskId,
        status: newStatus,
      })
      toast.success(`Task status updated to ${res.newStatus}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtask.trim() || !taskId || !canManageSubtasks) return
    setIsSubtaskLoading(true)
    try {
      await addSubtask({
        taskId,
        title: newSubtask.trim(),
      })
      setNewSubtask("")
      toast.success("Subtask added")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to add subtask")
    } finally {
      setIsSubtaskLoading(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: any, isCompleted: boolean) => {
    if (!canManageSubtasks) {
      toast.error("You do not have permission to manage checklist items")
      return
    }
    try {
      await toggleSub({
        subtaskId,
        isCompleted,
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update subtask")
    }
  }

  const handleToggleAssignee = async (memberUserId: string) => {
    if (!taskId || !canManageAssignees) return
    const currentList = task?.assigneeIds || []
    const newList = currentList.includes(memberUserId)
      ? currentList.filter((id: string) => id !== memberUserId)
      : [...currentList, memberUserId]
    try {
      await invite({
        taskId,
        assigneeIds: newList,
      })
      toast.success("Assignees updated")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update assignees")
    }
  }

  const handleToggleCollaborator = async (memberUserId: string) => {
    if (!taskId || !canManageCollaborators) return
    const currentList = task?.collaboratorIds || []
    const newList = currentList.includes(memberUserId)
      ? currentList.filter((id: string) => id !== memberUserId)
      : [...currentList, memberUserId]
    try {
      await updateCollabs({
        taskId,
        collaboratorIds: newList,
      })
      toast.success("Collaborators updated")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update collaborators")
    }
  }

  const handleToggleSubscriber = async (memberUserId: string) => {
    if (!taskId || !canManageSubscribers) return
    const currentList = task?.subscriberIds || []
    const newList = currentList.includes(memberUserId)
      ? currentList.filter((id: string) => id !== memberUserId)
      : [...currentList, memberUserId]
    try {
      await updateSubs({
        taskId,
        subscriberIds: newList,
      })
      toast.success("Subscribers updated")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update subscribers")
    }
  }

  const handleRoleChange = async (
    targetUserId: string,
    newRole: "Assignee" | "Collaborator" | "Subscriber" | "remove"
  ) => {
    if (!taskId || !task) return
    const currentAssignees = task.assigneeIds || []
    const currentCollabs = task.collaboratorIds || []
    const currentSubs = task.subscriberIds || []

    let nextAssignees = currentAssignees.filter((id: string) => id !== targetUserId)
    let nextCollabs = currentCollabs.filter((id: string) => id !== targetUserId)
    let nextSubs = currentSubs.filter((id: string) => id !== targetUserId)

    if (newRole === "Assignee") {
      nextAssignees.push(targetUserId)
    } else if (newRole === "Collaborator") {
      nextCollabs.push(targetUserId)
    } else if (newRole === "Subscriber") {
      nextSubs.push(targetUserId)
    }

    try {
      if (JSON.stringify(currentAssignees) !== JSON.stringify(nextAssignees)) {
        await invite({ taskId, assigneeIds: nextAssignees })
      }
      if (JSON.stringify(currentCollabs) !== JSON.stringify(nextCollabs)) {
        await updateCollabs({ taskId, collaboratorIds: nextCollabs })
      }
      if (JSON.stringify(currentSubs) !== JSON.stringify(nextSubs)) {
        await updateSubs({ taskId, subscriberIds: nextSubs })
      }
      toast.success(
        newRole === "remove"
          ? "Member removed from task"
          : `Role updated to ${newRole}`
      )
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update role")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !taskId || !canAddAttachments) return
    setIsUploading(true)
    const toastId = toast.loading("Uploading document...")
    try {
      // Simulate file upload delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      await registerAttach({
        taskId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        r2Key: "mock-r2-key-" + Date.now() + "-" + file.name,
      })
      toast.success("Document uploaded successfully", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to upload document", { id: toastId })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteAttachment = async (attachmentId: any) => {
    const attach = attachments?.find((a: any) => a._id === attachmentId)
    const isUploader = attach?.uploaderId === currentUserId
    if (!canEditTaskDetails && !isUploader) {
      toast.error("Only admins, the task creator, or the uploader can delete attachments")
      return
    }
    const toastId = toast.loading("Deleting document...")
    try {
      await deleteAttach({ attachmentId })
      toast.success("Document deleted successfully", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete document", { id: toastId })
    }
  }

  const getPriorityStyle = (priority: string) => {
    const num = parseInt(priority, 10)
    if (isNaN(num)) {
      switch (priority) {
        case "Low":
          return "bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-slate-800 dark:text-slate-300"
        case "Normal":
          return "bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300"
        case "High":
          return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300"
        case "Urgent":
          return "bg-orange-50 text-orange-700 border-orange-200/30 dark:bg-orange-950/40 dark:text-orange-300"
        case "Critical":
          return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300"
        default:
          return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }
    }
    if (num <= 3)
      return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300"
    if (num <= 7)
      return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300"
    return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300 font-semibold"
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200/30 dark:bg-yellow-950/40 dark:text-yellow-300"
      case "In Progress":
        return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300"
      case "Under Review":
        return "bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/40 dark:text-purple-300"
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-300"
      case "Cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  // Get users in organization who are NOT assigned to this task
  const nonAssignees =
    activeOrg?.members?.filter(
      (m: any) => m.userId && !task?.assigneeIds?.includes(m.userId)
    ) || []

  const getMemberUser = (userId: string) => {
    return activeOrg?.members?.find((m: any) => m.userId === userId)?.user
  }

  // Group logs helper
  const groupLogsByDay = (logs: any[] | undefined) => {
    if (!logs) return {}
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    const groups: Record<string, any[]> = {}
    for (const log of logs) {
      const logDate = new Date(log.timestamp).toDateString()
      let dayGroup = "Earlier"
      if (logDate === today) {
        dayGroup = "Today"
      } else if (logDate === yesterday) {
        dayGroup = "Yesterday"
      }
      const group = groups[dayGroup] || []
      group.push(log)
      groups[dayGroup] = group
    }
    return groups
  }

  const groupedActivities = groupLogsByDay(auditLogs)

  // Map audit action types to descriptive TSX
  const renderActionText = (log: any) => {
    const actorName = log.actor?.name || "Unknown Member"
    switch (log.action) {
      case "TASK_CREATED":
        return (
          <>
            created the task{" "}
            <span className="font-semibold">
              "{log.details?.title || task?.title || ""}"
            </span>
          </>
        )
      case "STATUS_CHANGED":
        return (
          <>
            changed the status of the task from{" "}
            <span className="font-semibold text-muted-foreground">
              {log.details?.previous || "Pending"}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-primary">
              {log.details?.new || "In Progress"}
            </span>
          </>
        )
      case "TASK_UPDATED":
        const updatedFields = Object.keys(log.details || {}).join(", ")
        return <>updated task details ({updatedFields || "details"})</>
      case "ASSIGNEES_UPDATED":
        return <>updated task assignees list</>
      case "COLLABORATORS_UPDATED":
        return <>updated task collaborators list</>
      case "SUBSCRIBERS_UPDATED":
        return <>updated task subscribers list</>
      case "SUBTASK_CREATED":
        return (
          <>
            added checklist item{" "}
            <span className="font-semibold">"{log.details?.title}"</span>
          </>
        )
      case "SUBTASK_TOGGLED":
        return (
          <>
            {log.details?.isCompleted ? "completed" : "uncompleted"} checklist
            item <span className="font-semibold">"{log.details?.title}"</span>
          </>
        )
      case "ATTACHMENT_ADDED":
        return (
          <>
            uploaded document{" "}
            <span className="font-semibold">"{log.details?.fileName}"</span>
          </>
        )
      case "ATTACHMENT_DELETED":
        return (
          <>
            deleted document{" "}
            <span className="font-semibold">"{log.details?.fileName}"</span>
          </>
        )
      case "OVERDUE_NOTIFIED":
        return (
          <>
            flagged the task as overdue (due on{" "}
            {log.details?.dueDate
              ? new Date(log.details.dueDate).toLocaleDateString()
              : "unknown date"}
            )
          </>
        )
      default:
        return <>performed action {log.action}</>
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!fixed !top-4 !right-4 !bottom-4 z-50 flex !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 p-0 shadow-2xl backdrop-blur-md duration-300 outline-none sm:!max-w-xl"
      >
        <SheetTitle className="sr-only">Task Details</SheetTitle>
        <SheetDescription className="sr-only">
          {task
            ? `View and edit details for task ${task.title}`
            : "Task details drawer"}
        </SheetDescription>
        {task === undefined ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading task details...
            </p>
          </div>
        ) : !task ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h4 className="text-sm font-semibold">Task Not Found</h4>
            <p className="text-center text-xs text-muted-foreground">
              The task you are looking for does not exist or has been deleted.
            </p>
            <Button size="sm" onClick={onClose} className="mt-2 text-xs">
              Close Panel
            </Button>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card p-4 px-6">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1.5">
                {/* Edit Icon (only accessible to admins and task creator) */}
                {canEditTaskDetails && (
                  <Button
                    size="icon-sm"
                    variant={isEditingDetails ? "secondary" : "ghost"}
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                    className={`h-8 w-8 rounded-full transition-colors ${
                      isEditingDetails
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Edit Task Details"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable details view */}
            <div className="flex-1 overflow-y-auto">
              {/* Task Title & Details */}
              <div className="space-y-6 p-6 pb-4">
                {/* Title */}
                <div>
                  {isEditingDetails && canEditTaskDetails ? (
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() =>
                        title.trim() !== task.title &&
                        handleUpdate({ title: title.trim() })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                      className="-ml-1.5 h-auto border-transparent bg-transparent p-1 px-1.5 text-2xl font-bold transition-colors hover:border-input/40 focus-visible:border-input focus-visible:bg-background/50"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      {task.title}
                    </h2>
                  )}
                </div>

                {/* Metadata Properties Table */}
                <div className="grid grid-cols-[130px_1fr] items-center gap-y-4 border-b border-border/10 pb-6 text-xs">
                  {/* Created Time */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Created time</span>
                  </div>
                  <div className="font-medium text-foreground/80">
                    {task
                      ? new Date(task._creationTime).toLocaleString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Status</span>
                  </div>
                  <div>
                    {canUpdateStatus ? (
                      <Select
                        value={task.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className={`h-8 w-[150px] text-xs font-semibold rounded-full border px-2.5 ${getStatusStyle(task.status)}`}>
                          <SelectValue placeholder={task.status} />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Under Review">
                            Under Review
                          </SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`flex h-6 w-fit items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold ${getStatusStyle(task.status)}`}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        {task.status}
                      </Badge>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ListTodo className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Progress</span>
                  </div>
                  <div className="flex w-full max-w-[200px] items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/80">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-semibold text-foreground">
                      {progressPercent}%{" "}
                      <span className="font-sans font-normal text-muted-foreground">
                        ({completedSubtasks}/{totalSubtasks})
                      </span>
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckSquare className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Priority</span>
                  </div>
                  <div>
                    {isEditingDetails && canEditTaskDetails ? (
                      <Select
                        value={task.priority}
                        onValueChange={(val) => handleUpdate({ priority: val })}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue
                            placeholder={`Priority: ${task.priority}`}
                          />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          {Array.from({ length: 10 }, (_, i) =>
                            String(i + 1)
                          ).map((val) => (
                            <SelectItem key={val} value={val}>
                              {val} -{" "}
                              {val === "1"
                                ? "Lowest"
                                : val === "10"
                                  ? "Highest"
                                  : `Level ${val}`}
                            </SelectItem>
                          ))}
                          {!Array.from({ length: 10 }, (_, i) =>
                            String(i + 1)
                          ).includes(task.priority) && (
                            <SelectItem value={task.priority}>
                              {task.priority} (Legacy)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`h-6 w-fit rounded-full border px-2.5 text-[10px] font-semibold ${getPriorityStyle(task.priority)}`}
                      >
                        Priority: {task.priority}
                      </Badge>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Due Date</span>
                  </div>
                  <div>
                    {isEditingDetails && canEditTaskDetails ? (
                      <Input
                        type="date"
                        value={
                          task.dueDate
                            ? new Date(task.dueDate).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const dateVal = e.target.value
                          handleUpdate({
                            dueDate: dateVal ? new Date(dateVal).getTime() : 0,
                          })
                        }}
                        className="h-8 w-[150px] border-border/80 bg-background/50 text-xs"
                      />
                    ) : (
                      <span className="font-medium text-foreground/80">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString(
                              undefined,
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "No due date"}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
                    >
                      Task
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
                    >
                      Wireframe
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[9px] font-medium text-secondary-foreground"
                    >
                      Homepage
                    </Badge>
                  </div>

                  {/* Assigner */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Assigner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.creatorId ? (
                      (() => {
                        const userObj = getMemberUser(task.creatorId)
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <Avatar className="h-6 w-6 border border-card shadow-xs">
                                  <AvatarImage src={getAvatarUrl(userObj?.image, userObj?.name)} />
                                  <AvatarFallback className="text-[9px] font-semibold">
                                    {userObj?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-foreground/80">
                                  {userObj?.name || "Unknown User"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md">
                              <span className="font-semibold text-xs">{userObj?.name || "Unknown User"}</span>
                              {userObj?.email && <span className="text-[10px] text-muted-foreground">{userObj?.email}</span>}
                            </TooltipContent>
                          </Tooltip>
                        )
                      })()
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </div>

                  {/* Assignees */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Assignees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                        task.assigneeIds.map((userId: string) => {
                          const userObj = getMemberUser(userId)
                          return (
                            <Tooltip key={userId}>
                              <TooltipTrigger asChild>
                                <Avatar
                                  className="h-6 w-6 border border-card shadow-xs cursor-pointer"
                                >
                                  <AvatarImage src={getAvatarUrl(userObj?.image, userObj?.name)} />
                                  <AvatarFallback className="text-[9px] font-semibold">
                                    {userObj?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md">
                                <span className="font-semibold text-xs">{userObj?.name || "Unknown User"}</span>
                                {userObj?.email && <span className="text-[10px] text-muted-foreground">{userObj?.email}</span>}
                              </TooltipContent>
                            </Tooltip>
                          )
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </div>
                    {canManageAssignees && (
                        <div className="relative">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setInviteOpen(!inviteOpen)}
                            className="h-6 w-6 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          {inviteOpen && (
                            <div className="absolute top-7 left-0 z-20 w-64 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl backdrop-blur-md">
                              <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 p-2">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  Manage Assignees
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInviteOpen(false)
                                    setAssigneeSearch("")
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="p-2 border-b border-border/40 bg-muted/5">
                                <Input
                                  placeholder="Search members..."
                                  value={assigneeSearch}
                                  onChange={(e) => setAssigneeSearch(e.target.value)}
                                  className="h-7 text-[10px] bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                              </div>
                              <div className="max-h-[200px] space-y-0.5 overflow-y-auto p-1">
                                {(activeOrg?.members || [])
                                  .filter((member: any) => {
                                    const name = member.user?.name || ""
                                    const email = member.user?.email || ""
                                    const q = assigneeSearch.toLowerCase()
                                    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
                                  })
                                  .map((member: any) => {
                                  const isChecked = task.assigneeIds?.includes(member.userId)
                                  return (
                                    <button
                                      type="button"
                                      key={member.id}
                                      onClick={() => handleToggleAssignee(member.userId)}
                                      className="flex w-full items-center justify-between rounded-lg p-1.5 text-left font-sans transition-colors hover:bg-accent"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 shrink-0">
                                          <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                                          <AvatarFallback className="text-[9px]">
                                            {member.user?.name?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-col">
                                          <span className="truncate text-left text-[10px] font-medium">
                                            {member.user?.name}
                                          </span>
                                        </div>
                                      </div>
                                      {isChecked && <Check className="h-3 w-3 text-primary shrink-0" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Collaborators */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Collaborators</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.collaboratorIds && task.collaboratorIds.length > 0 ? (
                        task.collaboratorIds.map((userId: string) => {
                          const userObj = getMemberUser(userId)
                          return (
                            <Tooltip key={userId}>
                              <TooltipTrigger asChild>
                                <Avatar
                                  className="h-6 w-6 border border-card shadow-xs cursor-pointer"
                                >
                                  <AvatarImage src={getAvatarUrl(userObj?.image, userObj?.name)} />
                                  <AvatarFallback className="text-[9px] font-semibold">
                                    {userObj?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md">
                                <span className="font-semibold text-xs">{userObj?.name || "Unknown User"}</span>
                                {userObj?.email && <span className="text-[10px] text-muted-foreground">{userObj?.email}</span>}
                              </TooltipContent>
                            </Tooltip>
                          )
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No collaborators
                        </span>
                      )}
                    </div>
                    {canManageCollaborators && (
                        <div className="relative">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setCollabInviteOpen(!collabInviteOpen)}
                            className="h-6 w-6 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          {collabInviteOpen && (
                            <div className="absolute top-7 left-0 z-20 w-64 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl backdrop-blur-md">
                              <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 p-2">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  Manage Collaborators
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCollabInviteOpen(false)
                                    setCollabSearch("")
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="p-2 border-b border-border/40 bg-muted/5">
                                <Input
                                  placeholder="Search members..."
                                  value={collabSearch}
                                  onChange={(e) => setCollabSearch(e.target.value)}
                                  className="h-7 text-[10px] bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                              </div>
                              <div className="max-h-[200px] space-y-0.5 overflow-y-auto p-1">
                                {(activeOrg?.members || [])
                                  .filter((member: any) => {
                                    const name = member.user?.name || ""
                                    const email = member.user?.email || ""
                                    const q = collabSearch.toLowerCase()
                                    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
                                  })
                                  .map((member: any) => {
                                  const isChecked = task.collaboratorIds?.includes(member.userId)
                                  return (
                                    <button
                                      type="button"
                                      key={member.id}
                                      onClick={() => handleToggleCollaborator(member.userId)}
                                      className="flex w-full items-center justify-between rounded-lg p-1.5 text-left font-sans transition-colors hover:bg-accent"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 shrink-0">
                                          <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                                          <AvatarFallback className="text-[9px]">
                                            {member.user?.name?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-col">
                                          <span className="truncate text-left text-[10px] font-medium">
                                            {member.user?.name}
                                          </span>
                                        </div>
                                      </div>
                                      {isChecked && <Check className="h-3 w-3 text-primary shrink-0" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Subscribers */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Subscribers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.subscriberIds && task.subscriberIds.length > 0 ? (
                        task.subscriberIds.map((userId: string) => {
                          const userObj = getMemberUser(userId)
                          return (
                            <Tooltip key={userId}>
                              <TooltipTrigger asChild>
                                <Avatar
                                  className="h-6 w-6 border border-card shadow-xs cursor-pointer"
                                >
                                  <AvatarImage src={getAvatarUrl(userObj?.image, userObj?.name)} />
                                  <AvatarFallback className="text-[9px] font-semibold">
                                    {userObj?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md">
                                <span className="font-semibold text-xs">{userObj?.name || "Unknown User"}</span>
                                {userObj?.email && <span className="text-[10px] text-muted-foreground">{userObj?.email}</span>}
                              </TooltipContent>
                            </Tooltip>
                          )
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No subscribers
                        </span>
                      )}
                    </div>
                    {canManageSubscribers && (
                        <div className="relative">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setSubInviteOpen(!subInviteOpen)}
                            className="h-6 w-6 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                          {subInviteOpen && (
                            <div className="absolute top-7 left-0 z-20 w-64 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl backdrop-blur-md">
                              <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 p-2">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  Manage Subscribers
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubInviteOpen(false)
                                    setSubSearch("")
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="p-2 border-b border-border/40 bg-muted/5">
                                <Input
                                  placeholder="Search members..."
                                  value={subSearch}
                                  onChange={(e) => setSubSearch(e.target.value)}
                                  className="h-7 text-[10px] bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                />
                              </div>
                              <div className="max-h-[200px] space-y-0.5 overflow-y-auto p-1">
                                {(activeOrg?.members || [])
                                  .filter((member: any) => {
                                    const name = member.user?.name || ""
                                    const email = member.user?.email || ""
                                    const q = subSearch.toLowerCase()
                                    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
                                  })
                                  .map((member: any) => {
                                  const isChecked = task.subscriberIds?.includes(member.userId)
                                  return (
                                    <button
                                      type="button"
                                      key={member.id}
                                      onClick={() => handleToggleSubscriber(member.userId)}
                                      className="flex w-full items-center justify-between rounded-lg p-1.5 text-left font-sans transition-colors hover:bg-accent"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 shrink-0">
                                          <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                                          <AvatarFallback className="text-[9px]">
                                            {member.user?.name?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-col">
                                          <span className="truncate text-left text-[10px] font-medium">
                                            {member.user?.name}
                                          </span>
                                        </div>
                                      </div>
                                      {isChecked && <Check className="h-3 w-3 text-primary shrink-0" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Project Description Card */}
                <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4">
                  <h4 className="text-xs font-bold text-foreground">
                    Project Description
                  </h4>
                  {isEditingDetails && canEditTaskDetails ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() =>
                        description.trim() !== (task.description || "") &&
                        handleUpdate({ description: description.trim() })
                      }
                      placeholder="Add a detailed description for this task..."
                      rows={4}
                      className="flex min-h-[100px] w-full rounded-lg border border-input/60 bg-transparent px-3 py-2 text-xs transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 dark:bg-background/20"
                    />
                  ) : (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/90">
                      {task.description ||
                        "No description provided. Click the edit icon above to add a description."}
                    </p>
                  )}
                </div>

                {/* Documents & Attachments Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 animate-pulse text-primary" />
                      Documents & Attachments
                    </span>
                    {canAddAttachments && (
                      <div className="relative">
                        <input
                          type="file"
                          id="task-file-upload"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isUploading}
                          onClick={() =>
                            document.getElementById("task-file-upload")?.click()
                          }
                          className="flex h-7 items-center gap-1 px-2 text-[10px] transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {isUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span>Add Document</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {attachments === undefined ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : attachments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {attachments.map((attach: any) => (
                          <div
                            key={attach._id}
                            className="flex items-center justify-between rounded-xl border border-border/80 bg-background/50 p-2.5 transition-colors hover:bg-accent/15"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div className="rounded-lg bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                <File className="size-4 shrink-0" />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span
                                  className="truncate text-xs font-semibold text-foreground"
                                  title={attach.fileName}
                                >
                                  {attach.fileName}
                                </span>
                                <span className="font-mono text-[9px] text-muted-foreground uppercase">
                                  {attach.mimeType.split("/")[1] || "File"} •{" "}
                                  {(attach.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </span>
                              </div>
                            </div>
                            <div className="ml-1 flex shrink-0 items-center gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => {
                                  toast.success(
                                    `Mock download triggered for ${attach.fileName}`
                                  )
                                }}
                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                              >
                                <Download className="size-3.5" />
                              </Button>
                              {canEditTaskDetails && (
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteAttachment(attach._id)
                                  }
                                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-rose-600"
                                >
                                  <X className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/30 py-6 text-center">
                        <p className="text-[11px] text-muted-foreground italic">
                          No documents attached.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as any)}
                className="flex min-h-0 w-full flex-1 flex-col"
              >
                <div className="border-b border-border/10 px-6 pb-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="my-work">My Work</TabsTrigger>
                    <TabsTrigger value="assigned">People</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Contents */}
                <div className="p-6">
                  <TabsContent value="activity" className="mt-0 outline-none">
                    <div className="space-y-6">
                      {auditLogs === undefined ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : auditLogs.length > 0 ? (
                        Object.entries(groupedActivities).map(
                          ([day, items]) => (
                            <div key={day} className="space-y-4">
                              <h5 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                {day}
                              </h5>
                              <div className="relative pl-1">
                                {items.map((item, idx) => (
                                  <div
                                    key={item._id}
                                    className="relative pb-5 pl-8 last:pb-2"
                                  >
                                    {/* Timeline Line */}
                                    {idx < items.length - 1 && (
                                      <div className="absolute top-6 bottom-0 left-[11px] w-px bg-border/60" />
                                    )}

                                    {/* Actor Avatar */}
                                    <div className="absolute top-0 left-0">
                                      <Avatar className="h-6 w-6 border border-background">
                                        <AvatarImage
                                          src={getAvatarUrl(item.actor?.image, item.actor?.name)}
                                        />
                                        <AvatarFallback className="bg-accent text-[8px] font-semibold text-accent-foreground">
                                          {(item.actor?.name || "U").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>

                                    {/* Action text & Details */}
                                    <div className="space-y-1">
                                      <div className="font-sans text-xs leading-normal text-foreground/85">
                                        <span className="mr-1 font-semibold text-foreground">
                                          {item.actor?.name || "Unknown Member"}
                                        </span>
                                        {renderActionText(item)}
                                      </div>
                                      <span className="block text-[9px] text-muted-foreground">
                                        {new Date(
                                          item.timestamp
                                        ).toLocaleTimeString(undefined, {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                        })}
                                      </span>

                                      {/* Render file preview card inside logs if action is ATTACHMENT_ADDED */}
                                      {item.action === "ATTACHMENT_ADDED" &&
                                        item.details?.fileName && (
                                          <div className="mt-2 flex max-w-sm items-center justify-between rounded-xl border border-border/80 bg-background/50 p-3 transition-colors hover:bg-accent/15">
                                            <div className="flex items-center gap-2.5">
                                              <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                                <File className="size-4 shrink-0" />
                                              </div>
                                              <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-xs font-semibold text-foreground">
                                                  {item.details.fileName}
                                                </span>
                                                <span className="font-mono text-[9px] text-muted-foreground uppercase">
                                                  Document Upload
                                                </span>
                                              </div>
                                            </div>
                                            <Button
                                              size="icon-xs"
                                              variant="ghost"
                                              onClick={() => {
                                                toast.success(
                                                  `Mock download triggered for ${item.details.fileName}`
                                                )
                                              }}
                                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                                            >
                                              <Download className="size-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/30 py-12 text-center">
                          <Clock className="mb-3 size-10 text-muted-foreground/30" />
                          <span className="text-xs font-semibold text-foreground">
                            No activities logged yet
                          </span>
                          <span className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                            Actions taken on this task will be logged and
                            displayed in this timeline.
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="my-work" className="mt-0 outline-none">
                    <div className="space-y-4">
                      {/* Checklist Summary */}
                      {subtasks && subtasks.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                            <span>Checklist progress</span>
                            <span>
                              {Math.round(
                                (subtasks.filter((s) => s.isCompleted).length /
                                  subtasks.length) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{
                                width: `${
                                  (subtasks.filter((s) => s.isCompleted)
                                    .length /
                                    subtasks.length) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Subtask Input Form */}
                      {canManageSubtasks && (
                        <form
                          onSubmit={handleAddSubtask}
                          className="flex gap-2"
                        >
                          <Input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Add a new checklist item..."
                            disabled={isSubtaskLoading}
                            className="h-8 bg-background/50 text-xs"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSubtaskLoading || !newSubtask.trim()}
                            className="h-8 px-3 text-xs"
                          >
                            {isSubtaskLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </form>
                      )}

                      {/* Checklist List */}
                      <div className="space-y-1.5">
                        {subtasks === undefined ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : subtasks.length > 0 ? (
                          subtasks.map((sub: any) => (
                            <div
                              key={sub._id}
                              onClick={() =>
                                canManageSubtasks &&
                                handleToggleSubtask(sub._id, !sub.isCompleted)
                              }
                              className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs transition-all select-none ${
                                canManageSubtasks
                                  ? "cursor-pointer"
                                  : "cursor-default"
                              } ${
                                sub.isCompleted
                                  ? "border-border/20 bg-muted/10 text-muted-foreground line-through"
                                  : "border-border/10 hover:border-border/30 hover:bg-muted/15"
                              }`}
                            >
                              <div className="shrink-0 text-muted-foreground/80">
                                {sub.isCompleted ? (
                                  <CheckSquare className="h-4 w-4 fill-primary/10 text-primary" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </div>
                              <span className="flex-1 font-medium">
                                {sub.title}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-border/30 py-8 text-center">
                            <p className="text-[11px] text-muted-foreground italic">
                              No subtasks added yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="assigned" className="mt-0 outline-none">
                    {(() => {
                      const participants: any[] = []
                      if (task.creatorId) {
                        participants.push({
                          userId: task.creatorId,
                          role: "Assigner",
                          user: getMemberUser(task.creatorId),
                        })
                      }
                      if (task.assigneeIds) {
                        task.assigneeIds.forEach((id: string) => {
                          if (id !== task.creatorId) {
                            participants.push({
                              userId: id,
                              role: "Assignee",
                              user: getMemberUser(id),
                            })
                          }
                        })
                      }
                      if (task.collaboratorIds) {
                        task.collaboratorIds.forEach((id: string) => {
                          if (id !== task.creatorId) {
                            participants.push({
                              userId: id,
                              role: "Collaborator",
                              user: getMemberUser(id),
                            })
                          }
                        })
                      }
                      if (task.subscriberIds) {
                        task.subscriberIds.forEach((id: string) => {
                          if (id !== task.creatorId) {
                            participants.push({
                              userId: id,
                              role: "Subscriber",
                              user: getMemberUser(id),
                            })
                          }
                        })
                      }

                      const connectedUserIds = new Set([
                        task.creatorId,
                        ...(task.assigneeIds || []),
                        ...(task.collaboratorIds || []),
                        ...(task.subscriberIds || []),
                      ].filter(Boolean))

                      const filteredOrgMembers = (activeOrg?.members || []).filter(
                        (member: any) => {
                          if (!member.userId || connectedUserIds.has(member.userId)) return false
                          const name = member.user?.name || ""
                          const email = member.user?.email || ""
                          const q = searchQuery.toLowerCase()
                          return (
                            name.toLowerCase().includes(q) ||
                            email.toLowerCase().includes(q)
                          )
                        }
                      )

                      const canAddNewPerson =
                        isCreator || isAssignee || isCollaborator || isAdminOrOwner

                      const getRoleBadgeStyle = (role: string) => {
                        switch (role) {
                          case "Assigner":
                            return "bg-secondary text-secondary-foreground border-transparent rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                          case "Assignee":
                            return "bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                          case "Collaborator":
                            return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                          case "Subscriber":
                            return "bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-slate-800 dark:text-slate-300 rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                          default:
                            return "rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                        }
                      }

                      const renderRoleSelector = (p: any) => {
                        if (p.userId === task.creatorId) return null

                        const isCallerAssigner = isCreator || isAdminOrOwner
                        const isCallerAssignee = isAssignee

                        if (isCallerAssigner) {
                          return (
                            <Select
                              value={p.role}
                              onValueChange={(val) =>
                                handleRoleChange(p.userId, val as any)
                              }
                            >
                              <SelectTrigger className="h-6 w-[100px] text-[10px] ml-auto">
                                <SelectValue placeholder={p.role} />
                              </SelectTrigger>
                              <SelectContent className="text-[10px]">
                                <SelectItem value="Assignee">Assignee</SelectItem>
                                <SelectItem value="Collaborator">Collaborator</SelectItem>
                                <SelectItem value="Subscriber">Subscriber</SelectItem>
                                <SelectItem
                                  value="remove"
                                  className="text-rose-600 dark:text-rose-400 font-semibold"
                                >
                                  Remove
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )
                        }

                        if (isCallerAssignee) {
                          if (p.role === "Collaborator" || p.role === "Subscriber") {
                            return (
                              <Select
                                value={p.role}
                                onValueChange={(val) =>
                                  handleRoleChange(p.userId, val as any)
                                }
                              >
                                <SelectTrigger className="h-6 w-[100px] text-[10px] ml-auto">
                                  <SelectValue placeholder={p.role} />
                                </SelectTrigger>
                                <SelectContent className="text-[10px]">
                                  <SelectItem value="Collaborator">Collaborator</SelectItem>
                                  <SelectItem value="Subscriber">Subscriber</SelectItem>
                                  <SelectItem
                                    value="remove"
                                    className="text-rose-600 dark:text-rose-400 font-semibold"
                                  >
                                    Remove
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )
                          }
                        }

                        return null
                      }

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                              Task Participants
                            </h5>
                            {canAddNewPerson && (
                              <div className="relative">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsAddNewOpen(!isAddNewOpen)}
                                  className="flex h-7 items-center gap-1.5 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span>Add New</span>
                                </Button>
                                {isAddNewOpen && (
                                  <div className="absolute top-8 right-0 z-30 w-72 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-2xl backdrop-blur-md">
                                    <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 p-2.5">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                        Add Person to Task
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsAddNewOpen(false)
                                          setSearchQuery("")
                                        }}
                                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <div className="p-2 border-b border-border/40 bg-muted/5">
                                      <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 text-xs bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                      />
                                    </div>
                                    <div className="max-h-[220px] space-y-0.5 overflow-y-auto p-1.5">
                                      {filteredOrgMembers.length > 0 ? (
                                        filteredOrgMembers.map((member: any) => (
                                          <div
                                            key={member.id}
                                            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                              <Avatar className="h-6 w-6 shrink-0">
                                                <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                                                <AvatarFallback className="text-[10px]">
                                                  {member.user?.name?.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-left text-[11px] font-medium text-foreground">
                                                  {member.user?.name}
                                                </span>
                                                <span className="truncate text-left text-[9px] text-muted-foreground">
                                                  {member.user?.email}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              {(isCreator || isAdminOrOwner) && (
                                                <Button
                                                  size="icon-xs"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    handleRoleChange(member.userId, "Assignee")
                                                    setIsAddNewOpen(false)
                                                    setSearchQuery("")
                                                  }}
                                                  className="h-6 px-1.5 text-[9px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                  title="Add as Assignee"
                                                >
                                                  Assignee
                                                </Button>
                                              )}
                                              {(isCreator || isAssignee || isAdminOrOwner) && (
                                                <Button
                                                  size="icon-xs"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    handleRoleChange(
                                                      member.userId,
                                                      "Collaborator"
                                                    )
                                                    setIsAddNewOpen(false)
                                                    setSearchQuery("")
                                                  }}
                                                  className="h-6 px-1.5 text-[9px] font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                  title="Add as Collaborator"
                                                >
                                                  Collab
                                                </Button>
                                              )}
                                              <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                onClick={() => {
                                                  handleRoleChange(member.userId, "Subscriber")
                                                  setIsAddNewOpen(false)
                                                  setSearchQuery("")
                                                }}
                                                className="h-6 px-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-950/30"
                                                title="Add as Subscriber"
                                              >
                                                Sub
                                              </Button>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-[10px] text-muted-foreground text-center py-4 italic">
                                          No members found
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {participants.length > 0 ? (
                              participants.map((p) => (
                                <div
                                  key={p.userId}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/40 bg-background/50 p-3 gap-2 sm:gap-3 transition-colors hover:bg-muted/5"
                                >
                                  {/* Left: Member details */}
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={getAvatarUrl(p.user?.image, p.user?.name)} />
                                      <AvatarFallback className="text-[10px] font-semibold">
                                        {p.user?.name?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex min-w-0 flex-col">
                                      <span className="truncate font-semibold text-foreground text-xs">
                                        {p.user?.name || "Unknown User"}
                                      </span>
                                      <span className="truncate text-[10px] text-muted-foreground">
                                        {p.user?.email || ""}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Role & Actions */}
                                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/10">
                                    <Badge
                                      className={`${getRoleBadgeStyle(p.role)} shrink-0`}
                                      variant="outline"
                                    >
                                      {p.role}
                                    </Badge>
                                    {renderRoleSelector(p)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-border/40 py-6 text-center text-muted-foreground italic text-[11px]">
                                No participants connected.
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </TabsContent>

                  <TabsContent value="comments" className="mt-0 outline-none">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Task Comments
                      </h5>
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/30 py-12 text-center">
                        <MessageSquare className="mb-3 size-10 animate-pulse text-muted-foreground/30" />
                        <span className="text-xs font-semibold text-foreground">
                          Task Discussions
                        </span>
                        <span className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                          Comments and discussion history for this task will be
                          loaded here.
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Footer close button */}
            <div className="flex shrink-0 justify-end border-t border-border/40 bg-muted/10 p-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 text-xs font-semibold"
              >
                Close Panel
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
