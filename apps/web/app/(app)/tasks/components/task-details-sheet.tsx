"use client"

import { useState, useEffect, useRef } from "react"
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
import { Switch } from "@workspace/ui/components/switch"
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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/popover"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
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
  Calendar as CalendarIcon,
  MessageSquare,
  Check,
  Send,
  Trash2,
  Smile,
  Paperclip,
  Repeat,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { toast } from "sonner"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import { Calendar } from "@workspace/ui/components/calendar"

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

  const updateDetails = useMutation(api.tasks.updateTaskDetails).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, title: newTitle, description: newDescription, priority, dueDate, completedRequiresApproval } = args

      // 1. Update task details query
      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          {
            ...currentTask,
            ...(newTitle !== undefined && { title: newTitle }),
            ...(newDescription !== undefined && { description: newDescription }),
            ...(priority !== undefined && { priority }),
            ...(dueDate !== undefined && { dueDate }),
            ...(completedRequiresApproval !== undefined && { completedRequiresApproval }),
          }
        )
      }

      // 2. Update task list queries (both showArchived options)
      if (activeOrg?.id) {
        for (const showArchived of [true, false, undefined]) {
          const queryArgs = { organizationId: activeOrg.id, showArchived }
          const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
          if (tasksList) {
            const updatedTasks = tasksList.map((t: any) => {
              if (t._id === targetId) {
                return {
                  ...t,
                  ...(newTitle !== undefined && { title: newTitle }),
                  ...(newDescription !== undefined && { description: newDescription }),
                  ...(priority !== undefined && { priority }),
                  ...(dueDate !== undefined && { dueDate }),
                  ...(completedRequiresApproval !== undefined && { completedRequiresApproval }),
                }
              }
              return t
            })
            localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
          }
        }
      }
    }
  )

  const updateStatus = useMutation(api.tasks.updateTaskStatus).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, status } = args

      // 1. Update task details query
      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, status }
        )
      }

      // 2. Update task list query
      if (activeOrg?.id) {
        const tasksList = localStore.getQuery(api.tasks.getTasks, { organizationId: activeOrg.id })
        if (tasksList) {
          const updatedTasks = tasksList.map((t: any) => {
            if (t._id === targetId) {
              return { ...t, status }
            }
            return t
          })
          localStore.setQuery(api.tasks.getTasks, { organizationId: activeOrg.id }, updatedTasks)
        }
      }
    }
  )

  const invite = useMutation(api.tasks.inviteAssignees).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, assigneeIds } = args

      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, assigneeIds }
        )
      }

      if (activeOrg?.id) {
        const tasksList = localStore.getQuery(api.tasks.getTasks, { organizationId: activeOrg.id })
        if (tasksList) {
          const updatedTasks = tasksList.map((t: any) => {
            if (t._id === targetId) {
              return { ...t, assigneeIds }
            }
            return t
          })
          localStore.setQuery(api.tasks.getTasks, { organizationId: activeOrg.id }, updatedTasks)
        }
      }
    }
  )

  const updateCollabs = useMutation(api.tasks.updateCollaborators).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, collaboratorIds } = args

      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, collaboratorIds }
        )
      }
    }
  )

  const updateSubs = useMutation(api.tasks.updateSubscribers).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, subscriberIds } = args

      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, subscriberIds }
        )
      }
    }
  )
  const addSubtask = useMutation(api.tasks.createSubtask).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, title } = args
      if (!targetId || !currentUserId) return

      const currentSubtasks = localStore.getQuery(api.tasks.getSubtasks, { taskId: targetId })
      if (currentSubtasks) {
        const optimisticSubtask = {
          _id: `temp-subtask-${Date.now()}` as any,
          _creationTime: Date.now(),
          taskId: targetId,
          title,
          isCompleted: false,
          creatorId: currentUserId,
          createdAt: Date.now(),
        }
        localStore.setQuery(
          api.tasks.getSubtasks,
          { taskId: targetId },
          [...currentSubtasks, optimisticSubtask]
        )
      }
    }
  )

  const toggleSub = useMutation(api.tasks.toggleSubtask).withOptimisticUpdate(
    (localStore, args) => {
      const { subtaskId, isCompleted } = args
      if (!taskId) return

      const currentSubtasks = localStore.getQuery(api.tasks.getSubtasks, { taskId })
      if (currentSubtasks) {
        const updated = currentSubtasks.map((s: any) => {
          if (s._id === subtaskId) {
            return { ...s, isCompleted }
          }
          return s
        })
        localStore.setQuery(api.tasks.getSubtasks, { taskId }, updated)
      }
    }
  )
  const registerAttach = useMutation(api.taskAttachments.registerAttachment)
  const deleteAttach = useMutation(api.taskAttachments.deleteAttachment)

  // Reactions & Comments Mutations/Queries
  const toggleReaction = useMutation(api.tasks.toggleReaction).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, emoji } = args
      if (!currentUserId) return

      // 1. Update task details query
      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        const reactions = currentTask.reactions || []
        const existingIndex = reactions.findIndex(
          (r: any) => r.userId === currentUserId && r.emoji === emoji
        )
        let newReactions = [...reactions]
        if (existingIndex > -1) {
          newReactions.splice(existingIndex, 1)
        } else {
          newReactions.push({ userId: currentUserId, emoji })
        }
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, reactions: newReactions }
        )
      }

      // 2. Update task list query
      if (activeOrg?.id) {
        const tasksList = localStore.getQuery(api.tasks.getTasks, { organizationId: activeOrg.id })
        if (tasksList) {
          const updatedTasks = tasksList.map((t: any) => {
            if (t._id === targetId) {
              const reactions = t.reactions || []
              const existingIndex = reactions.findIndex(
                (r: any) => r.userId === currentUserId && r.emoji === emoji
              )
              let newReactions = [...reactions]
              if (existingIndex > -1) {
                newReactions.splice(existingIndex, 1)
              } else {
                newReactions.push({ userId: currentUserId, emoji })
              }
              return { ...t, reactions: newReactions }
            }
            return t
          })
          localStore.setQuery(api.tasks.getTasks, { organizationId: activeOrg.id }, updatedTasks)
        }
      }
    }
  )
  const chats = useQuery(api.taskChats.getChats, taskId ? { taskId } : "skip")
  const addChat = useMutation(api.taskChats.addChat).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, content, attachmentIds, statusChange, completedSubtaskIds } = args
      if (!targetId || !currentUserId) return

      const currentChats = localStore.getQuery(api.taskChats.getChats, { taskId: targetId })
      if (currentChats) {
        const optimisticChat = {
          _id: `temp-chat-${Date.now()}` as any,
          _creationTime: Date.now(),
          taskId: targetId,
          userId: currentUserId,
          content,
          isEdited: false,
          isDeleted: false,
          attachmentIds: attachmentIds || [],
          statusChange,
          completedSubtaskIds,
        }
        localStore.setQuery(
          api.taskChats.getChats,
          { taskId: targetId },
          [...currentChats, optimisticChat]
        )
      }
    }
  )

  const editChat = useMutation(api.taskChats.editChat).withOptimisticUpdate(
    (localStore, args) => {
      const { chatId, newContent } = args
      if (!taskId) return

      const currentChats = localStore.getQuery(api.taskChats.getChats, { taskId })
      if (currentChats) {
        const updated = currentChats.map((c: any) => {
          if (c._id === chatId) {
            return {
              ...c,
              content: newContent,
              isEdited: true,
            }
          }
          return c
        })
        localStore.setQuery(api.taskChats.getChats, { taskId }, updated)
      }
    }
  )

  const deleteChat = useMutation(api.taskChats.deleteChat).withOptimisticUpdate(
    (localStore, args) => {
      const { chatId } = args
      if (!taskId) return

      const currentChats = localStore.getQuery(api.taskChats.getChats, { taskId })
      if (currentChats) {
        const updated = currentChats.map((c: any) => {
          if (c._id === chatId) {
            return {
              ...c,
              isDeleted: true,
              content: "This message was deleted",
            }
          }
          return c
        })
        localStore.setQuery(api.taskChats.getChats, { taskId }, updated)
      }
    }
  )
  const readReceipts = useQuery(api.taskChats.getTaskReadReceipts, taskId ? { taskId } : "skip")
  const markAsRead = useMutation(api.taskChats.markChatsAsRead)
  const archiveTask = useMutation(api.tasks.archiveTask).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, isArchived } = args

      // 1. Update task details query
      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(
          api.tasks.getTask,
          { taskId: targetId },
          { ...currentTask, isArchived }
        )
      }

      // 2. Update task list queries (both showArchived options)
      if (activeOrg?.id) {
        for (const showArchived of [true, false, undefined]) {
          const queryArgs = { organizationId: activeOrg.id, showArchived }
          const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
          if (tasksList) {
            const updatedTasks = tasksList.map((t: any) => {
              if (t._id === targetId) {
                return { ...t, isArchived }
              }
              return t
            })
            localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
          }
        }
      }
    }
  )

  const handleArchiveToggle = async () => {
    if (!task) return
    const nextArchivedState = !task.isArchived
    try {
      await archiveTask({ taskId: task._id, isArchived: nextArchivedState })
      toast.success(nextArchivedState ? "Task archived successfully!" : "Task restored successfully!")
      if (nextArchivedState) {
        onClose()
      }
    } catch (err: any) {
      console.error("Failed to archive task", err)
      toast.error(err.message || "Failed to toggle task archive status")
    }
  }

  const updateTaskRecurrence = useMutation(api.tasks.updateTaskRecurrence).withOptimisticUpdate(
    (localStore, args) => {
      const { taskId: targetId, recurrence } = args

      // 1. Update task details query
      const currentTask = localStore.getQuery(api.tasks.getTask, { taskId: targetId })
      if (currentTask) {
        localStore.setQuery(api.tasks.getTask, { taskId: targetId }, { ...currentTask, recurrence })
      }

      // 2. Update task list queries (both showArchived options)
      if (activeOrg?.id) {
        for (const showArchived of [true, false, undefined]) {
          const queryArgs = { organizationId: activeOrg.id, showArchived }
          const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
          if (tasksList) {
            const updatedTasks = tasksList.map((t: any) => {
              if (t._id === targetId) {
                return { ...t, recurrence }
              }
              return t
            })
            localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
          }
        }
      }
    }
  )

  const handleRecurrenceChange = async (frequency: string) => {
    if (!task) return
    const currentRec = task.recurrence
    const nextRec = {
      startDate: currentRec?.startDate ?? Date.now(),
      frequency,
      isPaused: currentRec?.isPaused ?? false,
      endDate: currentRec?.endDate,
      timeOfDay: currentRec?.timeOfDay,
    }
    try {
      await updateTaskRecurrence({ taskId: task._id, recurrence: nextRec })
      toast.success(`Recurrence updated to ${frequency}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update recurrence")
    }
  }

  const handleTogglePauseRecurrence = async () => {
    if (!task || !task.recurrence) return
    const nextPaused = !task.recurrence.isPaused
    const nextRec = {
      ...task.recurrence,
      isPaused: nextPaused,
    }
    try {
      await updateTaskRecurrence({ taskId: task._id, recurrence: nextRec })
      toast.success(nextPaused ? "Recurrence paused successfully!" : "Recurrence resumed successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle recurrence pause status")
    }
  }

  const handleRemoveRecurrence = async () => {
    if (!task) return
    try {
      await updateTaskRecurrence({ taskId: task._id, recurrence: undefined })
      toast.success("Recurrence removed from task")
    } catch (err: any) {
      toast.error(err.message || "Failed to remove recurrence")
    }
  }

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

  // Reactions & Chats State
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddNewOpen, setIsAddNewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "activity" | "my-work" | "assigned" | "chats"
  >("activity")
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<any | null>(null)

  // Sync details when task updates
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
    }
  }, [task])

  // Mark chats as read when chats tab becomes active or a new chat arrives
  useEffect(() => {
    if (activeTab === "chats" && taskId) {
      markAsRead({ taskId }).catch((err) => console.error("Failed to mark chats as read", err))
    }
  }, [activeTab, taskId, chats, markAsRead])

  if (!isOpen) return null

  const currentUserId = session?.user?.id
  const currentUserMember = currentUserId
    ? activeOrg?.members?.find((m: any) => m.userId === currentUserId)
    : undefined
  const isAdminOrOwner =
    activeMember?.role === "admin" ||
    activeMember?.role === "owner" ||
    currentUserMember?.role === "admin" ||
    currentUserMember?.role === "owner"
  const isCreator = !!currentUserId && !!task?.creatorId && task.creatorId === currentUserId
  const isAssignee = !!currentUserId && !!task?.assigneeIds && task.assigneeIds.includes(currentUserId)
  const isCollaborator = !!currentUserId && !!task?.collaboratorIds && task.collaboratorIds.includes(currentUserId)
  const isSubscriber = !!currentUserId && !!task?.subscriberIds && task.subscriberIds.includes(currentUserId)

  const relation = isCreator
    ? "Creator"
    : isAssignee
    ? "Assignee"
    : isCollaborator
    ? "Collaborator"
    : isSubscriber
    ? "Subscriber"
    : "Other"

  const getRelationStyle = (rel: string) => {
    switch (rel) {
      case "Creator":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30"
      case "Assignee":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/30 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30"
      case "Collaborator":
        return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30"
      case "Subscriber":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400"
    }
  }

  const canArchive = isAdminOrOwner || isCreator
  const canEditTaskDetails = (isAdminOrOwner || isCreator) && !task?.isArchived
  const canUpdateStatus = (isAdminOrOwner || isCreator || isAssignee || isCollaborator) && !task?.isArchived && (task?.status !== "Pending Approval" || isCreator || isAdminOrOwner)
  const canManageSubtasks = (isAdminOrOwner || isCreator || isAssignee || isCollaborator) && !task?.isArchived
  const canManageAssignees = (isAdminOrOwner || isCreator) && !task?.isArchived
  const canManageCollaborators = (isAdminOrOwner || isCreator || isAssignee) && !task?.isArchived
  const canManageSubscribers = (isAdminOrOwner || isCreator || isAssignee || isCollaborator) && !task?.isArchived
  const canAddAttachments = (isAdminOrOwner || isCreator || isAssignee || isCollaborator || isSubscriber) && !task?.isArchived
  const canAddChats = (isAdminOrOwner || isCreator || isAssignee || isCollaborator || isSubscriber) && !task?.isArchived

  const getUserDetails = (userId: string): { name: string; email: string; image?: string } => {
    const member = activeOrg?.members?.find((m: any) => m.userId === userId)
    return member?.user || { name: "Unknown User", email: "", image: undefined }
  }

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

  const reactions = task?.reactions || []
  const groupedReactions = reactions.reduce((acc: Record<string, string[]>, curr) => {
    const list = acc[curr.emoji] || []
    list.push(curr.userId)
    acc[curr.emoji] = list
    return acc
  }, {})

  const handleUpdate = async (fields: {
    title?: string
    description?: string
    priority?: string
    dueDate?: number
    completedRequiresApproval?: boolean
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

  const handleToggleReaction = async (emoji: string) => {
    try {
      await toggleReaction({
        taskId,
        emoji,
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update reaction")
    }
  }

  const handleEditChat = async (chatId: any) => {
    if (!editingContent.trim()) return
    try {
      await editChat({
        chatId,
        newContent: editingContent.trim(),
      })
      setEditingChatId(null)
      setEditingContent("")
      toast.success("Message updated")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update message")
    }
  }

  const handleDeleteChat = (chat: any) => {
    setChatToDelete(chat)
  }

  const handleDeleteChatConfirm = async (deleteAttachments: boolean) => {
    if (!chatToDelete) return
    try {
      await deleteChat({
        chatId: chatToDelete._id,
      })

      if (deleteAttachments && chatToDelete.attachmentIds && chatToDelete.attachmentIds.length > 0) {
        for (const attId of chatToDelete.attachmentIds) {
          await deleteAttach({ attachmentId: attId })
        }
      }

      toast.success(
        deleteAttachments
          ? "Message and attachments deleted"
          : "Message deleted"
      )
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to delete message")
    } finally {
      setChatToDelete(null)
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
        return "bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/30"
      case "Pending Approval":
        return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30"
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30"
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
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                    toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                  }}
                  className="text-[11px] font-medium font-mono text-muted-foreground/50 hover:text-foreground transition-colors select-all cursor-pointer"
                >
                  #{task._id.slice(-4)}
                </span>
                {relation !== "Other" && (
                  <Badge variant="outline" className={`px-1.5 py-0 h-4 text-[9px] font-medium border ${getRelationStyle(relation)}`}>
                    Role: {relation}
                  </Badge>
                )}
              </div>

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

                {canArchive && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleArchiveToggle}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    title={task.isArchived ? "Restore Task" : "Archive Task"}
                  >
                    {task.isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
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
              {task.isArchived && (
                <div className="m-6 mb-0 flex items-center gap-2.5 rounded-xl border border-amber-200/50 bg-amber-500/10 p-4 text-xs text-amber-700 dark:border-amber-800/30 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span>This task is archived. Unarchive it to allow edits, comments, or attachments.</span>
                </div>
              )}

              {/* Task Title & Details */}
              <div className="space-y-6 p-6 pb-4">
                {/* Title */}
                <div>
                  {isEditingDetails && canEditTaskDetails ? (
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                          toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                        }}
                        className="text-muted-foreground/50 font-mono text-xl font-medium select-all shrink-0 select-none cursor-pointer hover:text-foreground transition-colors"
                      >
                        #{task._id.slice(-4)}
                      </span>
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
                        className="-ml-1.5 h-auto flex-1 border-transparent bg-transparent p-1 px-1.5 text-2xl font-bold transition-colors hover:border-input/40 focus-visible:border-input focus-visible:bg-background/50"
                      />
                    </div>
                  ) : (
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(`#${task._id.slice(-4)}`)
                          toast.success(`Copied Task ID #${task._id.slice(-4)} to clipboard!`)
                        }}
                        className="font-mono text-muted-foreground/60 hover:text-foreground transition-colors mr-2 text-xl font-medium select-all cursor-pointer"
                      >
                        #{task._id.slice(-4)}
                      </span>
                      {task.title}
                      {relation !== "Other" && (
                        <Badge variant="outline" className={`px-2 py-0.5 text-xs font-semibold border ${getRelationStyle(relation)}`}>
                          Role: {relation}
                        </Badge>
                      )}
                    </h2>
                  )}
                </div>

                {/* Task Reactions Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {Object.entries(groupedReactions).map(([emoji, userIds]: any) => {
                    const hasReacted = currentUserId ? userIds.includes(currentUserId) : false
                    const reactorNames = userIds
                      .map((id: string) => getUserDetails(id).name)
                      .join(", ")
                    return (
                      <Tooltip key={emoji}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleReaction(emoji)}
                            className={`h-7 gap-1.5 rounded-full px-2.5 text-xs border transition-all ${
                              hasReacted
                                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                                : "bg-muted/10 border-border/10 hover:border-border/30 hover:bg-muted/15"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-semibold text-[10px]">{userIds.length}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border shadow-md p-1.5 px-2 text-[10px] z-50">
                          <span className="font-medium">{reactorNames}</span>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}

                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      className="h-7 w-7 rounded-full border border-border/10 bg-muted/5 hover:bg-muted/15 flex items-center justify-center"
                    >
                      <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    {emojiPickerOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setEmojiPickerOpen(false)}
                        />
                        <div className="absolute top-8 left-0 z-20 flex gap-1 rounded-full border border-border/80 bg-popover p-1.5 shadow-xl backdrop-blur-md">
                          {["👍", "❤️", "🎉", "👀", "🚀"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                handleToggleReaction(emoji)
                                setEmojiPickerOpen(false)
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:bg-muted/20 active:scale-95 transition-all"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
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
                          <SelectItem value="Pending Approval">
                            Pending Approval
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
                    <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Due Date</span>
                  </div>
                  <div>
                    {isEditingDetails && canEditTaskDetails ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 justify-start text-left font-normal text-xs bg-background/50 border-border/80 px-3 py-1",
                              !task.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/80" />
                            {task.dueDate ? (
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span>Pick due date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={task.dueDate ? new Date(task.dueDate) : undefined}
                            onSelect={(date) => {
                              handleUpdate({
                                dueDate: date ? date.getTime() : 0,
                              })
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="font-medium text-foreground/80">
                        {task.dueDate
                          ? `${new Date(task.dueDate).toLocaleDateString(
                              undefined,
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}${task.timeOfDay ? ` (${task.timeOfDay})` : ""}`
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
                      <UserAvatar
                        userId={task.creatorId}
                        showName={true}
                        avatarClassName="h-6 w-6 border border-card shadow-xs"
                      />
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
                        task.assigneeIds.map((userId: string) => (
                          <UserAvatar
                            key={userId}
                            userId={userId}
                            avatarClassName="h-6 w-6 border border-card shadow-xs"
                          />
                        ))
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
                        task.collaboratorIds.map((userId: string) => (
                          <UserAvatar
                            key={userId}
                            userId={userId}
                            avatarClassName="h-6 w-6 border border-card shadow-xs"
                          />
                        ))
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
                        task.subscriberIds.map((userId: string) => (
                          <UserAvatar
                            key={userId}
                            userId={userId}
                            avatarClassName="h-6 w-6 border border-card shadow-xs"
                          />
                        ))
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
                    {/* Completion Sign-off */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="size-3.5 shrink-0 text-muted-foreground/60" />
                      <span>Completion Sign-off</span>
                    </div>
                    <div>
                      {isEditingDetails && canEditTaskDetails ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            id="details-completed-requires-approval"
                            checked={task.completedRequiresApproval ?? false}
                            onCheckedChange={(checked: boolean) =>
                              handleUpdate({ completedRequiresApproval: checked })
                            }
                            className="cursor-pointer scale-75 origin-left"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {task.completedRequiresApproval ? "Creator sign-off required" : "Mark done directly"}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-foreground/80">
                          {task.completedRequiresApproval ? "Requires creator approval" : "No approval required"}
                        </span>
                      )}
                    </div>

                    {/* Recurrence */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Repeat className="size-3.5 shrink-0 text-muted-foreground/60" />
                      <span>Recurrence</span>
                    </div>
                    <div>
                      {isEditingDetails && canEditTaskDetails ? (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Select
                            value={task.recurrence?.frequency || "none"}
                            onValueChange={(val) => {
                              if (val === "none") {
                                handleRemoveRecurrence()
                              } else {
                                handleRecurrenceChange(val)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue placeholder="No Recurrence" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="none">No Recurrence</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>

                          {task.recurrence && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold px-2.5 rounded-md border-border/80"
                                onClick={handleTogglePauseRecurrence}
                              >
                                {task.recurrence.isPaused ? "Resume" : "Pause"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold px-2.5 rounded-md border-destructive/30 hover:bg-destructive/10 text-destructive"
                                onClick={handleRemoveRecurrence}
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      ) : task.recurrence ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground/80 capitalize">
                            Repeats {task.recurrence.frequency}
                          </span>
                          <Badge
                            variant="outline"
                            className={`h-5 text-[9px] font-semibold px-2 rounded-full border ${
                              task.recurrence.isPaused
                                ? "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/30 dark:text-red-300"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/30 dark:text-emerald-300"
                            }`}
                          >
                            {task.recurrence.isPaused ? "Paused" : "Active"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/80 italic">One-off task</span>
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
                      {task.recurrence && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block align-middle mr-1.5">
                              <Repeat className="size-3 text-blue-500 cursor-help" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-[10px] p-1.5 px-2 bg-popover text-popover-foreground border shadow-md rounded">
                            <span>Repeats {task.recurrence.frequency}</span>
                          </TooltipContent>
                        </Tooltip>
                      )}
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
                    <TabsTrigger value="chats">Chats</TabsTrigger>
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
                                      <AvatarHoverCard user={item.actor} userId={item.actorId}>
                                        <Avatar className="h-6 w-6 border border-background">
                                          <AvatarImage
                                            src={getAvatarUrl(item.actor?.image, item.actor?.name)}
                                          />
                                          <AvatarFallback className="bg-accent text-[8px] font-semibold text-accent-foreground">
                                            {(item.actor?.name || "U").charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                      </AvatarHoverCard>
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
                  <TabsContent value="chats" className="mt-0 outline-none flex flex-col min-h-0 flex-1">
                    <div className="flex flex-col flex-1 min-h-[420px] max-h-[550px] border border-border/20 rounded-xl bg-card overflow-hidden">
                      {/* Chat Header */}
                      <div className="border-b border-border/20 bg-muted/20 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Task Discussions</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {chats ? `${chats.length} messages` : "Loading..."}
                        </span>
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {chats === undefined ? (
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : chats.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-center p-6">
                            <MessageSquare className="mb-2 size-8 text-muted-foreground/30 animate-bounce" />
                            <span className="text-xs font-semibold text-foreground">No messages yet</span>
                            <span className="text-[10px] text-muted-foreground max-w-xs mt-1">
                              Be the first to say something or ask a question about this task.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3.5">
                            {chats.map((comm: any, idx: number) => {
                              const isOwn = comm.userId === currentUserId
                              const details = getUserDetails(comm.userId)
                              const formattedTime = new Date(comm._creationTime).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })

                              // Compute read receipts for this message
                              const readers = (readReceipts || [])
                                .filter((receipt: any) => {
                                  if (receipt.userId === currentUserId) return false
                                  const hasReadThis = receipt.lastReadTime >= comm._creationTime
                                  if (!hasReadThis) return false
                                  const isLastChat = idx === chats.length - 1
                                  const nextChat = !isLastChat ? chats[idx + 1] : null
                                  const hasReadNext = nextChat ? receipt.lastReadTime >= nextChat._creationTime : false
                                  return !hasReadNext
                                })
                                .map((receipt: any) => getUserDetails(receipt.userId))

                              // 1. Style System Messages
                              if (comm.isSystem) {
                                return (
                                  <div
                                    key={comm._id}
                                    className="w-full flex flex-col items-center justify-center py-2 px-4"
                                  >
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 italic text-center select-text">
                                      <Avatar className="h-4 w-4 shrink-0">
                                        <AvatarImage src={getAvatarUrl(details.image, details.name)} />
                                        <AvatarFallback className="text-[6px] font-bold">
                                          {details.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-semibold text-muted-foreground">{details.name}</span>
                                      <span>{comm.content}</span>
                                      <span className="text-[9px] opacity-60">({formattedTime})</span>
                                    </div>
                                    
                                    {/* System message inline attachments */}
                                    {comm.attachmentIds && comm.attachmentIds.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2 justify-center w-full max-w-[85%]">
                                        {comm.attachmentIds.map((attId: any) => {
                                          const att = attachments?.find((a: any) => a._id === attId)
                                          if (!att) return null
                                          return (
                                            <div
                                              key={attId}
                                              className="flex items-center gap-2 border border-border/40 bg-card rounded-lg p-2 text-xs text-foreground shadow-sm max-w-[240px] truncate"
                                            >
                                              <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                                              <span className="truncate flex-1 font-medium">{att.fileName}</span>
                                              <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                className="h-6 w-6 shrink-0"
                                                onClick={() => toast.info(`Downloading ${att.fileName}`)}
                                              >
                                                <Download className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              }

                              // 2. Render User Messages
                              return (
                                <div
                                  key={comm._id}
                                  className={`group flex items-start gap-2.5 max-w-[85%] ${
                                    isOwn ? "self-end flex-row-reverse" : "self-start"
                                  }`}
                                >
                                  {/* Avatar */}
                                  {!isOwn && (
                                    <AvatarHoverCard user={details} userId={comm.userId}>
                                      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                                        <AvatarImage src={getAvatarUrl(details.image, details.name)} />
                                        <AvatarFallback className="text-[9px] font-bold">
                                          {details.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                    </AvatarHoverCard>
                                  )}

                                  {/* Message Body */}
                                  <div className="flex flex-col gap-1 min-w-0">
                                    {/* Author Info */}
                                    {!isOwn && (
                                      <span className="text-[10px] font-semibold text-muted-foreground px-1">
                                        {details.name}
                                      </span>
                                    )}

                                    {/* Bubble */}
                                    <div className="relative">
                                      <div
                                        className={`rounded-2xl px-3.5 py-2.5 text-xs relative ${
                                          isOwn
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted/40 border border-border/10 text-foreground rounded-tl-none"
                                        } ${comm.isDeleted ? "italic text-muted-foreground/60" : ""}`}
                                      >
                                        {editingChatId === comm._id ? (
                                          <div className="flex flex-col gap-2 min-w-[200px] py-1">
                                            <Input
                                              value={editingContent}
                                              onChange={(e) => setEditingContent(e.target.value)}
                                              className="h-7 text-xs bg-background/50 border-border/40 text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                                              autoFocus
                                            />
                                            <div className="flex justify-end gap-1.5">
                                              <Button
                                                size="sm"
                                                className="h-6 px-2.5 text-[10px] font-semibold"
                                                onClick={() => handleEditChat(comm._id)}
                                              >
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-[10px] text-muted-foreground hover:bg-muted/10"
                                                onClick={() => {
                                                  setEditingChatId(null)
                                                  setEditingContent("")
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">
                                              {comm.content}
                                            </p>

                                            {/* Status Change Tag */}
                                            {comm.statusChange && (
                                              <div className={`mt-2 flex items-center gap-1 w-fit py-0.5 px-2 rounded-full border text-[9px] ${
                                                isOwn 
                                                  ? "bg-primary-foreground/15 border-primary-foreground/10 text-primary-foreground" 
                                                  : "bg-background/80 border-border/20 text-muted-foreground"
                                              }`}>
                                                <Sparkles className="h-2.5 w-2.5 shrink-0" />
                                                <span>Status: <strong>{comm.statusChange}</strong></span>
                                              </div>
                                            )}

                                            {/* Subtask completed tags */}
                                            {comm.completedSubtaskIds && comm.completedSubtaskIds.length > 0 && (
                                              <div className="mt-2 space-y-1">
                                                {comm.completedSubtaskIds.map((subId: any) => {
                                                  const sub = subtasks?.find((s: any) => s._id === subId)
                                                  return (
                                                    <div
                                                      key={subId}
                                                      className={`flex items-center gap-1.5 text-[9px] py-0.5 px-2 rounded-md ${
                                                        isOwn
                                                          ? "bg-primary-foreground/15 text-primary-foreground"
                                                          : "bg-background/80 border border-border/20 text-muted-foreground"
                                                      }`}
                                                    >
                                                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
                                                      <span className="truncate">Checklist: {sub?.title || "Completed Item"}</span>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}

                                            {/* Attached Documents in Bubble */}
                                            {comm.attachmentIds && comm.attachmentIds.length > 0 && (
                                              <div className="mt-2.5 space-y-1.5 border-t border-border/10 pt-2">
                                                {comm.attachmentIds.map((attId: any) => {
                                                  const att = attachments?.find((a: any) => a._id === attId)
                                                  if (!att) return null
                                                  return (
                                                    <div
                                                      key={attId}
                                                      className={`flex items-center gap-2 border rounded-lg p-2 text-[10px] ${
                                                        isOwn 
                                                          ? "bg-primary-foreground/15 border-primary-foreground/10 text-primary-foreground" 
                                                          : "bg-muted/80 border-border/20 text-foreground"
                                                      }`}
                                                    >
                                                      <File className="h-3 w-3 shrink-0" />
                                                      <span className="truncate flex-1 font-medium">{att.fileName}</span>
                                                      <Button
                                                        size="icon-xs"
                                                        variant="ghost"
                                                        className={`h-5 w-5 shrink-0 ${
                                                          isOwn ? "hover:bg-primary-foreground/10" : "hover:bg-muted"
                                                        }`}
                                                        onClick={() => toast.info(`Downloading ${att.fileName}`)}
                                                      >
                                                        <Download className="h-2.5 w-2.5" />
                                                      </Button>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}

                                            <span className="text-[9px] text-muted-foreground/60 mt-1.5 block text-right select-none">
                                              {formattedTime}
                                              {comm.isEdited && !comm.isDeleted && " (edited)"}
                                            </span>
                                          </>
                                        )}
                                      </div>

                                      {/* Message Hover Actions */}
                                      {!comm.isDeleted && isOwn && editingChatId !== comm._id && (
                                        <div
                                          className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-popover border border-border/60 rounded-md p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                                            isOwn ? "-left-16" : "-right-16"
                                          }`}
                                        >
                                          <Button
                                            size="icon-xs"
                                            variant="ghost"
                                            className="h-5 w-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/20"
                                            onClick={() => {
                                              setEditingChatId(comm._id)
                                              setEditingContent(comm.content)
                                            }}
                                            title="Edit Message"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="icon-xs"
                                            variant="ghost"
                                            className="h-5 w-5 rounded text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteChat(comm)}
                                            title="Delete Message"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Read Receipts Avatars */}
                                    {readers.length > 0 && (
                                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start px-1"}`}>
                                        <div className="flex -space-x-1 overflow-hidden">
                                          {readers.map((reader: any, rIdx: number) => (
                                            <Tooltip key={rIdx}>
                                              <TooltipTrigger asChild>
                                                <Avatar className="h-4.5 w-4.5 border border-background shrink-0 select-none">
                                                  <AvatarImage src={getAvatarUrl(reader.image, reader.name)} />
                                                  <AvatarFallback className="text-[6px] font-bold">
                                                    {reader.name?.charAt(0) || "U"}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-popover text-popover-foreground border shadow-md p-1 px-1.5 text-[9px] z-50">
                                                <span>Seen by {reader.name}</span>
                                              </TooltipContent>
                                            </Tooltip>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </div>

                      {/* Chat Input Bar */}
                      {canAddChats ? (
                        <ChatInputForm
                          taskId={taskId}
                          canAddChats={canAddChats}
                          addChat={addChat}
                          updateStatus={updateStatus}
                          toggleSub={toggleSub}
                          registerAttach={registerAttach}
                          deleteAttach={deleteAttach}
                          subtasks={subtasks}
                        />
                      ) : task.isArchived ? (
                        <div className="border-t border-border/40 p-4 bg-muted/5 text-center text-xs text-muted-foreground italic">
                          New messages cannot be added to archived tasks.
                        </div>
                      ) : null}
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
        <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete message?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message? This action cannot be undone.
                {chatToDelete?.attachmentIds && chatToDelete.attachmentIds.length > 0 && (
                  <span className="mt-2 block font-medium text-foreground">
                    This message has {chatToDelete.attachmentIds.length} file attachment(s). Do you want to delete them from the task as well?
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {chatToDelete?.attachmentIds && chatToDelete.attachmentIds.length > 0 ? (
                <>
                  <AlertDialogAction
                    variant="outline"
                    onClick={() => handleDeleteChatConfirm(false)}
                  >
                    Delete Message Only
                  </AlertDialogAction>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => handleDeleteChatConfirm(true)}
                  >
                    Delete Both
                  </AlertDialogAction>
                </>
              ) : (
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => handleDeleteChatConfirm(false)}
                >
                  Delete Message
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

interface ChatInputFormProps {
  taskId: any
  canAddChats: boolean
  addChat: any
  updateStatus: any
  toggleSub: any
  registerAttach: any
  deleteAttach: any
  subtasks: any[] | undefined
}

function ChatInputForm({
  taskId,
  canAddChats,
  addChat,
  updateStatus,
  toggleSub,
  registerAttach,
  deleteAttach,
  subtasks,
}: ChatInputFormProps) {
  const [newChat, setNewChat] = useState("")
  const [draftAttachmentFiles, setDraftAttachmentFiles] = useState<{ file: File; id?: string }[]>([])
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([])
  const [statusChangeOnSend, setStatusChangeOnSend] = useState<string | null>(null)
  const [isChatSending, setIsChatSending] = useState(false)

  const draftsRef = useRef<{ file: File; id?: string }[]>([])
  const isSendingRef = useRef(false)

  // Sync refs with state
  useEffect(() => {
    draftsRef.current = draftAttachmentFiles
  }, [draftAttachmentFiles])

  useEffect(() => {
    isSendingRef.current = isChatSending
  }, [isChatSending])

  // Reset/Cleanup on taskId change or unmount
  useEffect(() => {
    return () => {
      if (!isSendingRef.current && draftsRef.current.length > 0) {
        draftsRef.current.forEach((draft) => {
          if (draft.id) {
            deleteAttach({ attachmentId: draft.id as any }).catch((err: any) =>
              console.error("Cleanup: failed to delete draft attachment", err)
            )
          }
        })
      }
    }
  }, [taskId, deleteAttach])

  // Clear inputs when task changes
  useEffect(() => {
    setNewChat("")
    setDraftAttachmentFiles([])
    setSelectedSubtaskIds([])
    setStatusChangeOnSend(null)
  }, [taskId])

  const handleAddChat = async (e: React.FormEvent) => {
    e.preventDefault()

    const content = newChat.trim()
    const allUploadingFinished = draftAttachmentFiles.every((d) => d.id !== undefined)

    if (!allUploadingFinished) {
      toast.error("Please wait for all attachments to finish uploading.")
      return
    }

    if (!content && draftAttachmentFiles.length === 0 && !statusChangeOnSend && selectedSubtaskIds.length === 0) {
      return
    }

    if (!taskId || isChatSending) return
    setIsChatSending(true)

    try {
      const attachmentIds = draftAttachmentFiles
        .map((d) => d.id)
        .filter((id): id is any => id !== undefined)

      // Call addChat mutation
      await addChat({
        taskId,
        content: content || (
          statusChangeOnSend 
            ? `updated task status to ${statusChangeOnSend}` 
            : selectedSubtaskIds.length > 0 
              ? `completed ${selectedSubtaskIds.length} checklist item(s)` 
              : ""
        ),
        attachmentIds,
        statusChange: statusChangeOnSend || undefined,
        completedSubtaskIds: selectedSubtaskIds.length > 0 ? (selectedSubtaskIds as any) : undefined,
      })

      // To keep client state in sync optimistically
      if (statusChangeOnSend) {
        await updateStatus({
          taskId,
          status: statusChangeOnSend,
          bypassChatNotification: true,
        })
      }

      if (selectedSubtaskIds.length > 0) {
        for (const subId of selectedSubtaskIds) {
          await toggleSub({
            subtaskId: subId as any,
            isCompleted: true,
            bypassChatNotification: true,
          })
        }
      }

      setNewChat("")
      setDraftAttachmentFiles([])
      setSelectedSubtaskIds([])
      setStatusChangeOnSend(null)
      toast.success("Message sent")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to send message")
    } finally {
      setIsChatSending(false)
    }
  }

  const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !taskId) return

    // Add files to state with loading status
    const newDrafts = Array.from(files).map((file) => ({
      file,
      id: undefined as string | undefined,
    }))

    setDraftAttachmentFiles((prev) => [...prev, ...newDrafts])

    // Upload them one by one
    for (const draft of newDrafts) {
      try {
        // Wait 1.2s delay to simulate upload
        await new Promise((resolve) => setTimeout(resolve, 1200))

        const fileId = await registerAttach({
          taskId,
          fileName: draft.file.name,
          fileSize: draft.file.size,
          mimeType: draft.file.type || "application/octet-stream",
          r2Key: "mock-r2-key-" + Date.now() + "-" + draft.file.name,
          bypassChatNotification: true, // Bypass notification because it's a draft!
        })

        // Mark as uploaded
        setDraftAttachmentFiles((prev) =>
          prev.map((d) => (d.file === draft.file ? { ...d, id: fileId } : d))
        )
      } catch (err: any) {
        console.error(err)
        toast.error(`Failed to upload ${draft.file.name}`)
        // Remove from list
        setDraftAttachmentFiles((prev) => prev.filter((d) => d.file !== draft.file))
      }
    }
    e.target.value = ""
  }

  const handleRemoveDraftAttachment = async (draftToRemove: { file: File; id?: string }) => {
    setDraftAttachmentFiles((prev) => prev.filter((d) => d.file !== draftToRemove.file))
    if (draftToRemove.id) {
      try {
        await deleteAttach({ attachmentId: draftToRemove.id as any })
      } catch (err: any) {
        console.error("Failed to delete draft attachment", err)
      }
    }
  }

  return (
    <div className="border-t border-border/20 bg-muted/20 p-3 flex flex-col gap-2">
      {/* Floating Toolbar above message text input */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 select-none">
        {/* Attach File Button */}
        <div>
          <input
            type="file"
            id="chat-file-upload"
            className="hidden"
            multiple
            onChange={handleChatFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2.5 text-[10px] font-medium rounded-full bg-background/60 hover:bg-muted border-border/30 hover:border-border/60 transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => document.getElementById("chat-file-upload")?.click()}
            title="Attach Document"
          >
            <Paperclip className="h-3 w-3 shrink-0" />
            <span>Add File</span>
          </Button>
        </div>

        {/* Mark Checklist Completed Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-7 px-2.5 text-[10px] font-medium rounded-full bg-background/60 hover:bg-muted border-border/30 hover:border-border/60 transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              title="Mark Checklist Item Completed"
            >
              <ListTodo className="h-3 w-3 shrink-0" />
              <span>Mark Done</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover text-popover-foreground border shadow-md rounded-lg z-50">
            <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider border-b border-border/20 mb-1">
              Complete Checklist Item
            </div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {subtasks === undefined ? (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : subtasks.filter((s: any) => !s.isCompleted).length === 0 ? (
                <div className="text-[10px] text-muted-foreground italic p-2 text-center">
                  No incomplete items
                </div>
              ) : (
                subtasks
                  .filter((s: any) => !s.isCompleted)
                  .map((sub: any) => {
                    const isChecked = selectedSubtaskIds.includes(sub._id)
                    return (
                      <button
                        key={sub._id}
                        type="button"
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-muted text-foreground transition-colors"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedSubtaskIds((prev) => prev.filter((id) => id !== sub._id))
                          } else {
                            setSelectedSubtaskIds((prev) => [...prev, sub._id])
                          }
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className="truncate flex-1">{sub.title}</span>
                      </button>
                    )
                  })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Change Status Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-7 px-2.5 text-[10px] font-medium rounded-full bg-background/60 hover:bg-muted border-border/30 hover:border-border/60 transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              title="Change Task Status"
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>Change Status</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 p-1 bg-popover text-popover-foreground border shadow-md rounded-lg z-50">
            <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider border-b border-border/20 mb-1">
              Change Status
            </div>
            {["Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((status) => (
              <DropdownMenuItem
                key={status}
                className="text-xs px-2 py-1.5 rounded-md focus:bg-muted cursor-pointer font-medium text-foreground flex items-center justify-between"
                onClick={() => setStatusChangeOnSend(status)}
              >
                <span>{status}</span>
                {statusChangeOnSend === status && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Draft Previews */}
      {(draftAttachmentFiles.length > 0 || statusChangeOnSend || selectedSubtaskIds.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pb-1 select-none">
          {/* Status Change draft tag */}
          {statusChangeOnSend && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 text-[10px] pl-2 pr-1 h-6"
            >
              <Sparkles className="h-2.5 w-2.5 shrink-0" />
              <span>
                Update Status: <strong>{statusChangeOnSend}</strong>
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
                onClick={() => setStatusChangeOnSend(null)}
              >
                <X className="h-2.5 w-2.5 text-primary" />
              </Button>
            </Badge>
          )}

          {/* Subtasks complete tags */}
          {selectedSubtaskIds.map((subId) => {
            const sub = subtasks?.find((s: any) => s._id === subId)
            return (
              <Badge
                key={subId}
                variant="outline"
                className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] pl-2 pr-1 h-6 dark:text-emerald-400"
              >
                <Check className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate max-w-[120px]">Checklist: {sub?.title || "Item"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-emerald-500/20 rounded-full"
                  onClick={() => setSelectedSubtaskIds((prev) => prev.filter((id) => id !== subId))}
                >
                  <X className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </Badge>
            )
          })}

          {/* Draft files tags */}
          {draftAttachmentFiles.map((draft, dIdx) => {
            const isUploading = draft.id === undefined
            return (
              <Badge
                key={dIdx}
                variant="outline"
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] pl-2 pr-1 h-6 dark:text-blue-400"
              >
                {isUploading ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <File className="h-2.5 w-2.5 shrink-0" />
                )}
                <span className="truncate max-w-[120px]">{draft.file.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-blue-500/20 rounded-full"
                  onClick={() => handleRemoveDraftAttachment(draft)}
                >
                  <X className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Text input area */}
      <form onSubmit={handleAddChat} className="flex gap-2 items-center">
        <Input
          placeholder="Write a message..."
          value={newChat}
          onChange={(e) => setNewChat(e.target.value)}
          disabled={isChatSending}
          className="flex-1 h-9 text-xs bg-background/50 border-border/40 focus-visible:border-primary"
        />

        <Button
          type="submit"
          size="sm"
          disabled={
            isChatSending ||
            (!newChat.trim() &&
              draftAttachmentFiles.length === 0 &&
              !statusChangeOnSend &&
              selectedSubtaskIds.length === 0)
          }
          className="h-9 w-9 p-0 flex items-center justify-center shrink-0 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground"
        >
          {isChatSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </div>
  )
}
