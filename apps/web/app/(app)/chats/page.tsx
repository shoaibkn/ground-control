"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import { toast } from "sonner"
import {
  Search,
  MessageSquare,
  CircleCheckBig,
  Signature,
  Send,
  Paperclip,
  X,
  Loader2,
  Trash2,
  MoreHorizontal,
  Download,
  Check,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  File,
  ChevronRight,
  Eye,
  MessageSquareOff,
} from "lucide-react"

import TaskDetailsSheet from "../tasks/components/task-details-sheet"
import ApprovalDetailsSheet from "../approvals/components/approval-details-sheet"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

export default function ChatsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: session } = authClient.useSession()

  const currentUserId = session?.user?.id

  // 1. Inbox Threads List Query
  const threads = useQuery(
    api.inbox.getInboxThreads,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // 2. State management
  const [activeThreadId, setActiveThreadId] = useState<any>(null)
  const [activeThreadType, setActiveThreadType] = useState<"task" | "approval" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "tasks" | "approvals">("all")
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [newChat, setNewChat] = useState("")
  const [draftAttachmentFiles, setDraftAttachmentFiles] = useState<
    { file: File; id: string | undefined }[]
  >([])
  const [isChatSending, setIsChatSending] = useState(false)

  // Dialog/Alert States
  const [statusToChange, setStatusToChange] = useState<string | null>(null)
  const [statusComment, setStatusComment] = useState("")
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<any>(null)
  const [deleteAttachmentWithMsg, setDeleteAttachmentWithMsg] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // 3. Thread-specific queries & mutations
  const taskChats = useQuery(
    api.taskChats.getChats,
    activeThreadType === "task" && activeThreadId ? { taskId: activeThreadId } : "skip"
  )
  const approvalChats = useQuery(
    api.approvalChats.getChats,
    activeThreadType === "approval" && activeThreadId ? { approvalId: activeThreadId } : "skip"
  )
  const activeChats = activeThreadType === "task" ? taskChats : approvalChats

  const taskAttachments = useQuery(
    api.taskAttachments.getAttachments,
    activeThreadType === "task" && activeThreadId ? { taskId: activeThreadId } : "skip"
  )
  const approvalAttachments = useQuery(
    api.approvalAttachments.getAttachments,
    activeThreadType === "approval" && activeThreadId ? { approvalId: activeThreadId } : "skip"
  )
  const activeAttachments = activeThreadType === "task" ? taskAttachments : approvalAttachments

  // Task Mutations
  const addTaskChat = useMutation(api.taskChats.addChat)
  const editTaskChat = useMutation(api.taskChats.editChat)
  const deleteTaskChat = useMutation(api.taskChats.deleteChat)
  const markTaskChatsAsRead = useMutation(api.taskChats.markChatsAsRead)
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus)
  const registerTaskAttach = useMutation(api.taskAttachments.registerAttachment)
  const deleteTaskAttach = useMutation(api.taskAttachments.deleteAttachment)

  // Approval Mutations
  const addApprovalChat = useMutation(api.approvalChats.addChat)
  const editApprovalChat = useMutation(api.approvalChats.editChat)
  const deleteApprovalChat = useMutation(api.approvalChats.deleteChat)
  const markApprovalChatsAsRead = useMutation(api.approvalChats.markChatsAsRead)
  const updateApprovalStatus = useMutation(api.approvals.updateApprovalStatus)
  const registerApprovalAttach = useMutation(api.approvalAttachments.registerAttachment)
  const deleteApprovalAttach = useMutation(api.approvalAttachments.deleteAttachment)

  // Find currently active thread metadata from queries
  const activeThread = threads?.find((t: any) => t.id === activeThreadId)

  // 4. Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeChats?.length, activeThreadId])

  // 5. Auto-read messages when a thread is active
  useEffect(() => {
    if (!activeThreadId) return

    const markThreadAsRead = async () => {
      try {
        if (activeThreadType === "task") {
          await markTaskChatsAsRead({ taskId: activeThreadId })
        } else if (activeThreadType === "approval") {
          await markApprovalChatsAsRead({ approvalId: activeThreadId })
        }
      } catch (err) {
        console.error("Failed to mark chats as read", err)
      }
    }

    markThreadAsRead()
  }, [activeThreadId, activeThreadType, activeChats?.length])

  // 6. Handle sending message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChat.trim() && draftAttachmentFiles.length === 0) return
    if (!activeThreadId) return

    setIsChatSending(true)
    try {
      const attachmentIds = draftAttachmentFiles
        .filter((d) => d.id !== undefined)
        .map((d) => d.id as any)

      if (activeThreadType === "task") {
        await addTaskChat({
          taskId: activeThreadId,
          content: newChat.trim(),
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
        })
      } else {
        await addApprovalChat({
          approvalId: activeThreadId,
          content: newChat.trim(),
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
        })
      }

      setNewChat("")
      setDraftAttachmentFiles([])
      toast.success("Comment posted")
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
    } finally {
      setIsChatSending(false)
    }
  }

  // 7. Handle file selection & upload simulation
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !activeThreadId) return

    const newDrafts = Array.from(files).map((file) => ({
      file,
      id: undefined as string | undefined,
    }))

    setDraftAttachmentFiles((prev) => [...prev, ...newDrafts])

    for (const draft of newDrafts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulation delay
        let fileId
        if (activeThreadType === "task") {
          fileId = await registerTaskAttach({
            taskId: activeThreadId,
            fileName: draft.file.name,
            fileSize: draft.file.size,
            mimeType: draft.file.type || "application/octet-stream",
            r2Key: "mock-r2-key-" + Date.now() + "-" + draft.file.name,
            bypassChatNotification: true,
          })
        } else {
          fileId = await registerApprovalAttach({
            approvalId: activeThreadId,
            fileName: draft.file.name,
            fileSize: draft.file.size,
            mimeType: draft.file.type || "application/octet-stream",
            r2Key: "mock-r2-key-" + Date.now() + "-" + draft.file.name,
            bypassChatNotification: true,
          })
        }

        setDraftAttachmentFiles((prev) =>
          prev.map((d) => (d.file === draft.file ? { ...d, id: fileId } : d))
        )
      } catch (err: any) {
        toast.error(`Failed to upload ${draft.file.name}`)
        setDraftAttachmentFiles((prev) => prev.filter((d) => d.file !== draft.file))
      }
    }
  }

  // 8. Delete message attachment
  const handleDeleteAttachment = async (attachId: any) => {
    try {
      if (activeThreadType === "task") {
        await deleteTaskAttach({ attachmentId: attachId })
      } else {
        await deleteApprovalAttach({ attachmentId: attachId })
      }
      toast.success("Attachment deleted")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete attachment")
    }
  }

  // 9. Delete comment confirmation
  const handleDeleteMessage = async () => {
    if (!chatToDelete) return
    try {
      if (deleteAttachmentWithMsg && chatToDelete.attachmentIds?.length > 0) {
        for (const attachId of chatToDelete.attachmentIds) {
          await handleDeleteAttachment(attachId)
        }
      }

      if (activeThreadType === "task") {
        await deleteTaskChat({ chatId: chatToDelete._id })
      } else {
        await deleteApprovalChat({ chatId: chatToDelete._id })
      }

      toast.success("Comment deleted")
      setChatToDelete(null)
      setDeleteAttachmentWithMsg(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message")
    }
  }

  // 10. Status Transitions
  const handleStatusTransitionSubmit = async () => {
    if (!statusToChange || !activeThreadId) return
    setIsStatusChanging(true)
    try {
      if (activeThreadType === "task") {
        await updateTaskStatus({
          taskId: activeThreadId,
          status: statusToChange,
        })
        // Post transition chat log
        await addTaskChat({
          taskId: activeThreadId,
          content: `updated status to ${statusToChange}`,
          statusChange: statusToChange,
        })
      } else {
        await updateApprovalStatus({
          approvalId: activeThreadId,
          status: statusToChange,
          comment: statusComment,
        })
        // Post transition chat log
        await addApprovalChat({
          approvalId: activeThreadId,
          content: `changed status to ${statusToChange}. Comment: ${statusComment || "No comment provided."}`,
          statusChange: statusToChange,
        })
      }
      toast.success(`Status updated to ${statusToChange}`)
      setStatusToChange(null)
      setStatusComment("")
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setIsStatusChanging(false)
    }
  }

  // Date and File Size helpers
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  // Status Colors styling helpers
  const getTaskStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      case "In Progress":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      case "Under Review":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
      case "Completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "Cancelled":
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const getApprovalStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "Declined":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      case "Rework":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      default:
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
    }
  }

  const getPriorityStyle = (priority: string) => {
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

  // 11. Filtering thread list based on search and selected tab
  const filteredThreads = threads?.filter((thread: any) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    const titleMatch = thread.title.toLowerCase().includes(query)
    const descMatch = thread.description?.toLowerCase().includes(query) || false
    const msgMatch = thread.latestMessage?.content?.toLowerCase().includes(query) || false
    const idMatch = `#${thread.id.slice(-4)}`.toLowerCase().includes(query) || thread.id.toLowerCase().includes(query)

    return titleMatch || descMatch || msgMatch || idMatch
  })

  const displayedThreads = filteredThreads?.filter((thread: any) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return thread.unreadChatCount > 0
    if (activeTab === "tasks") return thread.type === "task"
    if (activeTab === "approvals") return thread.type === "approval"
    return true
  })

  // If active organization is not loaded
  if (!activeOrg) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Please select or create an organization first.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-w-0 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Inbox Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Review notifications, coordinate reviews, and collaborate across tasks and approvals.
          </p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="flex h-[calc(100vh-12rem)] w-full rounded-xl border border-border/80 bg-card/45 shadow-xs backdrop-blur-xs overflow-hidden">
        
        {/* Left Side: Message List */}
        <div className="w-[360px] flex flex-col border-r border-border/40 bg-muted/5 shrink-0">
          
          {/* Search bar inside list */}
          <div className="p-3 border-b border-border/40 space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/75" />
              <Input
                placeholder="Search inbox comments, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8.5 text-xs bg-background/50 border-input/60 focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>

            {/* Tab categories */}
            <div className="flex p-0.5 rounded-lg bg-muted/50 border border-border/20 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "tasks", label: "Tasks" },
                { id: "approvals", label: "Approvals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30 scrollbar-thin">
            {threads === undefined ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-[10px] text-muted-foreground">Loading inbox...</p>
              </div>
            ) : displayedThreads && displayedThreads.length > 0 ? (
              displayedThreads.map((thread: any) => {
                const isSelected = thread.id === activeThreadId
                const shortId = thread.id.slice(-4)
                const isTask = thread.type === "task"

                return (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id)
                      setActiveThreadType(thread.type)
                    }}
                    className={cn(
                      "w-full p-4 flex flex-col gap-1.5 text-left border-l-2 transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/5 border-l-primary border-r border-r-primary/10 shadow-inner"
                        : "border-l-transparent hover:bg-muted/30 hover:border-l-muted-foreground/30"
                    )}
                  >
                    {/* Top Row: Type and ID, status, and time */}
                    <div className="flex items-center justify-between w-full text-[10px]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {isTask ? (
                          <CircleCheckBig className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <Signature className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span className="text-muted-foreground uppercase font-mono">
                          {isTask ? "Task" : "Approval"} #{shortId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0.5 text-[8.5px] font-bold rounded-full border",
                            isTask
                              ? getTaskStatusStyle(thread.status)
                              : getApprovalStatusStyle(thread.status)
                          )}
                        >
                          {thread.status}
                        </Badge>
                        <span className="text-muted-foreground/80 font-medium">
                          {formatTimeAgo(thread.lastActivityTimestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Thread Title */}
                    <span className="font-semibold text-xs text-foreground truncate max-w-full">
                      {thread.title}
                    </span>

                    {/* Latest Comment Content Preview */}
                    <div className="flex items-start gap-1 justify-between w-full">
                      <p className="text-[11px] text-muted-foreground/90 leading-relaxed truncate flex-1 pr-2">
                        {thread.latestMessage ? (
                          <>
                            <span className="font-semibold text-foreground/80">
                              {thread.latestMessage.senderName === "You" ? "You" : thread.latestMessage.senderName}:
                            </span>{" "}
                            {thread.latestMessage.content}
                          </>
                        ) : (
                          <span className="italic text-muted-foreground/60">No comments yet</span>
                        )}
                      </p>

                      {/* Unread badge */}
                      {thread.unreadChatCount > 0 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-emerald-foreground text-[8px] font-bold flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                          {thread.unreadChatCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquareOff className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-foreground/80">No conversations</p>
                <p className="text-[10px] max-w-[200px] mt-0.5">
                  Try adjusting your filters or search keywords.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Conversation Area */}
        <div className="flex-1 flex flex-col bg-background/30 min-w-0">
          {activeThreadId && activeThread ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-border/40 bg-card/45 flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted border border-border/30 rounded px-1.5 py-0.5 select-all cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(`#${activeThread.id.slice(-4)}`)
                            toast.success(`Copied ID #${activeThread.id.slice(-4)}`)
                          }}
                          title="Click to copy ID"
                    >
                      {activeThread.type === "task" ? "TASK" : "APPROVAL"} #{activeThread.id.slice(-4)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 text-[9px] font-bold rounded-full",
                        activeThread.type === "task"
                          ? getTaskStatusStyle(activeThread.status)
                          : getApprovalStatusStyle(activeThread.status)
                      )}
                    >
                      {activeThread.status}
                    </Badge>

                    {/* Extra context (due dates / priorities) */}
                    {activeThread.type === "task" && activeThread.priority && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 text-[9px] font-bold rounded-full",
                          getPriorityStyle(activeThread.priority)
                        )}
                      >
                        {activeThread.priority}
                      </Badge>
                    )}

                    {activeThread.dueDate && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Due {new Date(activeThread.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground truncate mt-1.5 flex items-center gap-1.5">
                    {activeThread.title}
                  </h3>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Dropdowns/Triggers */}
                  {activeThread.type === "task" ? (
                    <Select
                      value={activeThread.status}
                      onValueChange={(val) => setStatusToChange(val)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs font-semibold bg-background/50 border-input/60">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    // Approvals: approve/decline/rework buttons if user is involved
                    <div className="flex items-center gap-1">
                      {["Approved", "Declined", "Rework"].map((st) => {
                        if (st === activeThread.status) return null
                        return (
                          <Button
                            key={st}
                            size="sm"
                            variant="outline"
                            className={cn(
                              "h-8 text-[10px] px-2.5 font-semibold bg-background/50 border-input/60 hover:bg-muted",
                              st === "Approved" && "hover:text-emerald-500 hover:border-emerald-500/20",
                              st === "Declined" && "hover:text-rose-500 hover:border-rose-500/20",
                              st === "Rework" && "hover:text-amber-500 hover:border-amber-500/20"
                            )}
                            onClick={() => {
                              setStatusToChange(st)
                            }}
                          >
                            {st}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {/* View Details drawer button */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10.5px] font-semibold flex items-center gap-1 border border-border/40 hover:scale-[1.01] transition-transform"
                    onClick={() => setIsDetailsSheetOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span>View Details</span>
                  </Button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {activeChats === undefined ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : activeChats.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6">
                    <MessageSquare className="mb-2 size-8 text-muted-foreground/30 animate-bounce" />
                    <span className="text-xs font-semibold text-foreground">No discussions yet</span>
                    <span className="text-[10px] text-muted-foreground max-w-xs mt-1">
                      Post a comment or update to start the discussion on this thread.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {activeChats.map((chat: any) => (
                      <div
                        key={chat._id}
                        className={cn(
                          "flex gap-3 text-xs",
                          chat.isSystem
                            ? "bg-muted/20 border border-border/20 rounded-xl p-3 items-center justify-between"
                            : ""
                        )}
                      >
                        {!chat.isSystem && (
                          <UserAvatar
                            userId={chat.userId}
                            avatarClassName="h-7 w-7 mt-0.5 shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          {!chat.isSystem && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <AvatarHoverCard userId={chat.userId}>
                                <span className="font-semibold text-foreground hover:underline cursor-pointer">
                                  {chat.userId === currentUserId ? "You" : "Team Member"}
                                </span>
                              </AvatarHoverCard>
                              <span className="text-[9px] text-muted-foreground/80">
                                {new Date(chat._creationTime).toLocaleString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          <p
                            className={cn(
                              "leading-relaxed text-foreground/90 whitespace-pre-wrap",
                              chat.isSystem
                                ? "text-[10px] text-muted-foreground/80 italic font-medium"
                                : "text-[11.5px]"
                            )}
                          >
                            {chat.content}
                          </p>

                          {/* Chat attachment preview if any */}
                          {chat.attachmentIds && chat.attachmentIds.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 max-w-md">
                              {activeAttachments
                                ?.filter((a) => chat.attachmentIds?.includes(a._id))
                                .map((attach) => (
                                  <div
                                    key={attach._id}
                                    className="flex items-center justify-between border border-border/40 rounded-lg bg-card p-2 text-[10.5px]"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <File className="h-4 w-4 text-primary shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-medium truncate leading-tight text-foreground/90">
                                          {attach.fileName}
                                        </span>
                                        <span className="text-[8.5px] text-muted-foreground leading-normal mt-0.5">
                                          {formatFileSize(attach.fileSize)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button size="icon-sm" variant="ghost" className="h-6 w-6">
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                      {(attach.uploaderId === currentUserId ||
                                        activeThread.creatorId === currentUserId) && (
                                        <Button
                                          size="icon-sm"
                                          variant="ghost"
                                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                          onClick={() => handleDeleteAttachment(attach._id)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Options dropdown for message sender */}
                        {!chat.isSystem && chat.userId === currentUserId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground self-start shrink-0 hover:bg-muted"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-1.5 cursor-pointer"
                                onClick={() => setChatToDelete(chat)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input & Toolbar */}
              <div className="border-t border-border/40 bg-card/25 p-4 flex flex-col gap-2.5 shrink-0">
                {/* Selected File Previews */}
                {draftAttachmentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pb-1.5">
                    {draftAttachmentFiles.map((draft, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-background/50 border border-border/60 rounded-md text-[10px]"
                      >
                        <File className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="max-w-[120px] truncate">{draft.file.name}</span>
                        {!draft.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : (
                          <button
                            onClick={() => {
                              handleDeleteAttachment(draft.id)
                              setDraftAttachmentFiles((prev) =>
                                prev.filter((d) => d.file !== draft.file)
                              )
                            }}
                            className="text-destructive hover:scale-110 ml-1.5 focus:outline-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 select-none">
                  <div>
                    <input
                      type="file"
                      id="inbox-file-upload"
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 px-3 text-[10px] font-medium rounded-full bg-background/50 border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                      onClick={() => document.getElementById("inbox-file-upload")?.click()}
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span>Attach File</span>
                    </Button>
                  </div>
                </div>

                {/* Input Text Form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Reply to this ${activeThreadType}...`}
                    value={newChat}
                    onChange={(e) => setNewChat(e.target.value)}
                    disabled={isChatSending}
                    className="h-9.5 text-xs flex-1 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9.5 w-9.5 shrink-0 shadow-sm"
                    disabled={isChatSending}
                  >
                    {isChatSending ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4.5 w-4.5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            // Premium Workspace Inbox Empty State
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/5">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl transform scale-150 animate-pulse" />
                <div className="relative p-5 bg-card/65 border border-border/50 rounded-2xl shadow-sm text-primary">
                  <Sparkles className="size-10" />
                </div>
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">
                Your Workspace Inbox
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                Select a task or approval thread from the left pane to review conversation updates, respond to comments, or approve requests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 12. Mount details sheet drawer dynamically */}
      {activeThreadId && activeThreadType === "task" && (
        <TaskDetailsSheet
          taskId={activeThreadId}
          isOpen={isDetailsSheetOpen}
          onClose={() => setIsDetailsSheetOpen(false)}
        />
      )}

      {activeThreadId && activeThreadType === "approval" && (
        <ApprovalDetailsSheet
          approvalId={activeThreadId}
          isOpen={isDetailsSheetOpen}
          onClose={() => setIsDetailsSheetOpen(false)}
        />
      )}

      {/* Status Transition Dialog with Comment */}
      <AlertDialog
        open={statusToChange !== null}
        onOpenChange={(open) => !open && setStatusToChange(null)}
      >
        <AlertDialogContent className="sm:max-w-[420px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              Confirm Status Transition to {statusToChange}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              {activeThreadType === "approval"
                ? `Please provide a comment for transitioning this approval to "${statusToChange}".`
                : `Are you sure you want to transition this task status to "${statusToChange}"?`}
              {statusToChange === "Rework" &&
                " This will automatically generate a rework task for the request creator by EOD."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeThreadType === "approval" && (
            <div className="py-3">
              <Input
                placeholder="Enter transition comment (optional)..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                className="text-xs h-9.5 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStatusTransitionSubmit()
                }}
              />
            </div>
          )}

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="text-xs h-8.5 rounded-lg border-border/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-xs h-8.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
              onClick={handleStatusTransitionSubmit}
              disabled={isStatusChanging}
            >
              {isStatusChanging ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Confirm Transition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment Delete Confirmation Dialog */}
      <AlertDialog
        open={chatToDelete !== null}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[400px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4.5 w-4.5" />
              Delete Comment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              This action is permanent and cannot be undone. Do you want to delete this message?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {chatToDelete?.attachmentIds && chatToDelete.attachmentIds.length > 0 && (
            <div className="flex items-center gap-2.5 py-2.5 px-3 border border-border/60 rounded-xl bg-muted/10 my-2 select-none">
              <input
                type="checkbox"
                id="inbox-delete-attachments-chk"
                checked={deleteAttachmentWithMsg}
                onChange={(e) => setDeleteAttachmentWithMsg(e.target.checked)}
                className="cursor-pointer rounded border-border"
              />
              <label
                htmlFor="inbox-delete-attachments-chk"
                className="text-[10.5px] font-semibold text-foreground/80 cursor-pointer select-none"
              >
                Also delete all file attachments in this message.
              </label>
            </div>
          )}

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="text-xs h-8.5 rounded-lg border-border/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="text-xs h-8.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/95 font-semibold"
              onClick={handleDeleteMessage}
            >
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
