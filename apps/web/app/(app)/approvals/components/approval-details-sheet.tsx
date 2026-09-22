"use client"

import React, { useState, useEffect, useRef } from "react"
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  AlertCircle,
  FileText,
  User,
  Clock,
  X,
  Pencil,
  MoreHorizontal,
  File,
  Download,
  Calendar as CalendarIcon,
  MessageSquare,
  Check,
  Send,
  Trash2,
  Paperclip,
  Sparkles,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ImageIcon,
  FileIcon,
} from "lucide-react"
import { toast } from "sonner"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import { Calendar } from "@workspace/ui/components/calendar"

interface ApprovalDetailsSheetProps {
  approvalId: any
  isOpen: boolean
  onClose: () => void
}

export default function ApprovalDetailsSheet({
  approvalId,
  isOpen,
  onClose,
}: ApprovalDetailsSheetProps) {
  const { data: session } = authClient.useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()

  const approval = useQuery(
    api.approvals.getApproval,
    approvalId ? { approvalId } : "skip"
  )
  const auditLogs = useQuery(
    api.approvals.getApprovalAuditLogs,
    approvalId ? { approvalId } : "skip"
  )
  const attachments = useQuery(
    api.approvalAttachments.getAttachments,
    approvalId ? { approvalId } : "skip"
  )
  const chats = useQuery(
    api.approvalChats.getChats,
    approvalId ? { approvalId } : "skip"
  )

  const updateDetails = useMutation(api.approvals.updateApprovalDetails)
  const updateStatus = useMutation(api.approvals.updateApprovalStatus)
  const inviteApprvs = useMutation(api.approvals.inviteApprovers)
  const inviteSubs = useMutation(api.approvals.inviteSubscribers)
  const registerAttach = useMutation(api.approvalAttachments.registerAttachment)
  const deleteAttach = useMutation(api.approvalAttachments.deleteAttachment)
  const addChat = useMutation(api.approvalChats.addChat)
  const deleteChatMsg = useMutation(api.approvalChats.deleteChat)
  const editChatMsg = useMutation(api.approvalChats.editChat)
  const markAsRead = useMutation(api.approvalChats.markChatsAsRead)
  const archiveApproval = useMutation(
    api.approvals.archiveApproval
  ).withOptimisticUpdate((localStore, args) => {
    const { approvalId: targetId, isArchived } = args

    // 1. Update approval details query
    const currentApproval = localStore.getQuery(api.approvals.getApproval, {
      approvalId: targetId,
    })
    if (currentApproval) {
      localStore.setQuery(
        api.approvals.getApproval,
        { approvalId: targetId },
        { ...currentApproval, isArchived }
      )
    }

    // 2. Update approvals list queries
    if (activeOrg?.id) {
      for (const showArchived of [true, false, undefined]) {
        const queryArgs = { organizationId: activeOrg.id, showArchived }
        const approvalsList = localStore.getQuery(
          api.approvals.getApprovals,
          queryArgs
        )
        if (approvalsList) {
          const updatedApprovals = approvalsList.map((a: any) => {
            if (a._id === targetId) {
              return { ...a, isArchived }
            }
            return a
          })
          localStore.setQuery(
            api.approvals.getApprovals,
            queryArgs,
            updatedApprovals
          )
        }
      }
    }
  })

  const handleArchiveToggle = async () => {
    if (!approval) return
    const nextArchivedState = !approval.isArchived
    try {
      await archiveApproval({
        approvalId: approval._id,
        isArchived: nextArchivedState,
      })
      toast.success(
        nextArchivedState
          ? "Approval request archived successfully!"
          : "Approval request restored successfully!"
      )
      if (nextArchivedState) {
        onClose()
      }
    } catch (err: any) {
      console.error("Failed to archive approval", err)
      toast.error(err.message || "Failed to toggle approval archive status")
    }
  }

  const [activeTab, setActiveTab] = useState<"discussion" | "activity">(
    "discussion"
  )
  const [newChat, setNewChat] = useState("")
  const [isChatSending, setIsChatSending] = useState(false)
  const [draftAttachmentFiles, setDraftAttachmentFiles] = useState<
    { file: File; id?: string }[]
  >([])

  // Status change comments & confirm dialogs
  const [statusToChange, setStatusToChange] = useState<string | null>(null)
  const [statusComment, setStatusComment] = useState("")
  const [isStatusChanging, setIsStatusChanging] = useState(false)

  // Message delete dialog
  const [chatToDelete, setChatToDelete] = useState<any>(null)
  const [deleteAttachmentWithMsg, setDeleteAttachmentWithMsg] = useState(false)

  // Title / Desc edits
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDesc, setEditedDesc] = useState("")

  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentUserId = session?.user?.id
  const isAdminOrOwner =
    activeMember?.role === "admin" || activeMember?.role === "owner"
  const isCreator =
    !!currentUserId &&
    !!approval?.creatorId &&
    approval.creatorId === currentUserId
  const canArchive = isAdminOrOwner || isCreator
  const canEditApprovalDetails =
    (isAdminOrOwner || isCreator) && !approval?.isArchived
  const canUpdateStatus =
    !!currentUserId &&
    !!approval &&
    !approval.isArchived &&
    (approval.approverIds.includes(currentUserId) ||
      approval.creatorId === currentUserId ||
      isAdminOrOwner)

  // Sync title and description when approval changes
  useEffect(() => {
    if (approval) {
      setEditedTitle(approval.title)
      setEditedDesc(approval.description || "")
    }
  }, [approval])

  // Mark chats as read when details open
  useEffect(() => {
    if (isOpen && approvalId) {
      markAsRead({ approvalId })
    }
  }, [isOpen, approvalId, chats?.length])

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeTab === "discussion") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chats, activeTab])

  if (!approvalId || !isOpen || !activeOrg) return null

  const getStatusColor = (status: string) => {
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

  const handleUpdateDetails = async (fields: {
    title?: string
    description?: string
    dueDate?: number
  }) => {
    if (!approvalId || !canEditApprovalDetails) return
    try {
      await updateDetails({
        approvalId,
        ...fields,
      })
      toast.success("Details updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update details")
      if (approval) {
        setEditedTitle(approval.title)
        setEditedDesc(approval.description || "")
      }
    }
  }

  const handleStatusTransitionSubmit = async () => {
    if (!statusToChange) return
    setIsStatusChanging(true)
    try {
      await updateStatus({
        approvalId,
        status: statusToChange,
        comment: statusComment.trim() || undefined,
      })

      // Send status change into chat
      await addChat({
        approvalId,
        content: `changed status to ${statusToChange}. Comment: ${statusComment.trim() || "No comment provided."}`,
        statusChange: statusToChange,
      })

      toast.success(`Status updated to ${statusToChange}`)
      setStatusToChange(null)
      setStatusComment("")
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setIsStatusChanging(false)
    }
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChat.trim() && draftAttachmentFiles.length === 0) return

    setIsChatSending(true)
    try {
      const attachmentIds = draftAttachmentFiles
        .filter((d) => d.id !== undefined)
        .map((d) => d.id as any)

      await addChat({
        approvalId,
        content: newChat.trim(),
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      })

      setNewChat("")
      setDraftAttachmentFiles([])
      toast.success("Message sent")
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
    } finally {
      setIsChatSending(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newDrafts = Array.from(files).map((file) => ({
      file,
      id: undefined as string | undefined,
    }))

    setDraftAttachmentFiles((prev) => [...prev, ...newDrafts])

    for (const draft of newDrafts) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulation delay
        const fileId = await registerAttach({
          approvalId,
          fileName: draft.file.name,
          fileSize: draft.file.size,
          mimeType: draft.file.type || "application/octet-stream",
          r2Key: "mock-r2-key-" + Date.now() + "-" + draft.file.name,
          bypassChatNotification: true,
        })

        setDraftAttachmentFiles((prev) =>
          prev.map((d) => (d.file === draft.file ? { ...d, id: fileId } : d))
        )
      } catch (err: any) {
        toast.error(`Failed to upload ${draft.file.name}`)
        setDraftAttachmentFiles((prev) =>
          prev.filter((d) => d.file !== draft.file)
        )
      }
    }
  }

  const handleDeleteAttachment = async (attachId: any) => {
    try {
      await deleteAttach({ attachmentId: attachId })
      toast.success("Attachment deleted")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete attachment")
    }
  }

  const handleDeleteMessage = async () => {
    if (!chatToDelete) return
    try {
      // If requested, delete attachments related to this chat message
      if (deleteAttachmentWithMsg && chatToDelete.attachmentIds?.length > 0) {
        for (const attachId of chatToDelete.attachmentIds) {
          await deleteAttach({ attachmentId: attachId })
        }
      }

      await deleteChatMsg({ chatId: chatToDelete._id })
      toast.success("Message deleted")
      setChatToDelete(null)
      setDeleteAttachmentWithMsg(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getDelayOrAgeInfo = (app: any) => {
    const now = Date.now()
    const startOfToday = new Date().setHours(0, 0, 0, 0)

    if (app.dueDate) {
      const isOverdue =
        app.dueDate < startOfToday &&
        app.status !== "Approved" &&
        app.status !== "Declined"
      if (isOverdue) {
        const diffTime = now - app.dueDate
        const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
          isOverdue: true,
          label: `Delayed by ${delayDays} ${delayDays === 1 ? "day" : "days"}`,
          style: "bg-red-500/10 text-red-500 border-red-500/20",
        }
      } else {
        return null // Not overdue
      }
    } else {
      // Show how old the request is
      const diffTime = now - app._creationTime
      const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (ageDays === 0) {
        return {
          isOverdue: false,
          label: "Created today",
          style: "bg-muted text-muted-foreground border-border/40",
        }
      }
      return {
        isOverdue: false,
        label: `${ageDays} ${ageDays === 1 ? "day" : "days"} old`,
        style: "bg-muted text-muted-foreground border-border/40",
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!fixed !top-4 !right-4 !bottom-4 z-50 flex !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-md duration-300 outline-none sm:!max-w-xl"
      >
        <SheetTitle className="sr-only">Approval Request Details</SheetTitle>
        <SheetDescription className="sr-only">
          Details drawer for approval requests
        </SheetDescription>

        {approval === undefined ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading request details...
            </p>
          </div>
        ) : !approval ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h4 className="text-sm font-semibold">Request Not Found</h4>
            <p className="text-center text-xs text-muted-foreground">
              The approval request does not exist or has been deleted.
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
                    navigator.clipboard.writeText(`#${approval._id.slice(-4)}`)
                    toast.success(
                      `Copied Approval ID #${approval._id.slice(-4)} to clipboard!`
                    )
                  }}
                  className="cursor-pointer font-mono text-[11px] font-medium text-muted-foreground/50 transition-colors select-all hover:text-foreground"
                >
                  #{approval._id.slice(-4)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {canEditApprovalDetails && (
                  <Button
                    size="icon-sm"
                    variant={isEditingDetails ? "secondary" : "ghost"}
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                    className={`h-8 w-8 rounded-full transition-colors ${
                      isEditingDetails
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Edit Approval Details"
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
                    title={
                      approval.isArchived
                        ? "Restore Request"
                        : "Archive Request"
                    }
                  >
                    {approval.isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {approval.isArchived && (
                <div className="m-6 mb-0 flex items-center gap-2.5 rounded-xl border border-amber-200/50 bg-amber-500/10 p-4 text-xs text-amber-700 dark:border-amber-800/30 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span>
                    This approval request is archived. Unarchive it to allow
                    status changes, comments, or attachments.
                  </span>
                </div>
              )}
              <div className="space-y-6 p-6">
                {/* Title Section */}
                <div>
                  {isEditingDetails && canEditApprovalDetails ? (
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(
                            `#${approval._id.slice(-4)}`
                          )
                          toast.success(
                            `Copied Approval ID #${approval._id.slice(-4)} to clipboard!`
                          )
                        }}
                        className="shrink-0 cursor-pointer font-mono text-xl font-medium text-muted-foreground/50 transition-colors select-all select-none hover:text-foreground"
                      >
                        #{approval._id.slice(-4)}
                      </span>
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={() =>
                          editedTitle.trim() !== approval.title &&
                          handleUpdateDetails({ title: editedTitle.trim() })
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
                    <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(
                            `#${approval._id.slice(-4)}`
                          )
                          toast.success(
                            `Copied Approval ID #${approval._id.slice(-4)} to clipboard!`
                          )
                        }}
                        className="mr-2 cursor-pointer font-mono text-xl font-medium text-muted-foreground/60 transition-colors select-all hover:text-foreground"
                      >
                        #{approval._id.slice(-4)}
                      </span>
                      {approval.title}
                    </h2>
                  )}
                </div>

                {/* Metadata Properties Table Grid */}
                <div className="grid grid-cols-[130px_1fr] items-center gap-y-4 border-b border-border/10 pb-6 text-xs">
                  {/* Creator */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Creator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={approval.creatorId}
                      showName={true}
                      avatarClassName="h-6 w-6 border border-card shadow-xs"
                    />
                  </div>

                  {/* Created Time */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Created time</span>
                  </div>
                  <div className="font-medium text-foreground/80">
                    {new Date(approval._creationTime).toLocaleString(
                      undefined,
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Status</span>
                  </div>
                  <div>
                    {isEditingDetails && canUpdateStatus ? (
                      <Select
                        value={approval.status}
                        onValueChange={(val) => setStatusToChange(val)}
                      >
                        <SelectTrigger
                          className={`h-8 w-[150px] rounded-full border px-2.5 text-xs font-semibold ${getStatusColor(approval.status)}`}
                        >
                          <SelectValue placeholder={approval.status} />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem
                            value="Approved"
                            disabled={
                              !!approval.formId && !approval.formResponseId
                            }
                          >
                            Approved
                          </SelectItem>
                          <SelectItem value="Declined">Declined</SelectItem>
                          <SelectItem value="Rework">Rework</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`flex h-6 w-fit items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold ${getStatusColor(approval.status)}`}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        {approval.status}
                      </Badge>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Due Date</span>
                  </div>
                  <div>
                    {isEditingDetails && canEditApprovalDetails ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 justify-start border-border/80 bg-background/50 px-3 py-1 text-left text-xs font-normal",
                              !approval.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/80" />
                            {approval.dueDate ? (
                              <span>
                                {new Date(approval.dueDate).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            ) : (
                              <span>Pick due date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              approval.dueDate
                                ? new Date(approval.dueDate)
                                : undefined
                            }
                            onSelect={(date) => {
                              handleUpdateDetails({
                                dueDate: date ? date.getTime() : 0,
                              })
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="font-medium text-foreground/80">
                        {approval.dueDate
                          ? new Date(approval.dueDate).toLocaleDateString(
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

                  {/* Approvers */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPlus className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Approvers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {approval.approverIds.map((userId) => (
                        <UserAvatar
                          key={userId}
                          userId={userId}
                          avatarClassName="h-6 w-6 border border-card shadow-xs"
                        />
                      ))}
                    </div>
                    {canEditApprovalDetails && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="h-6 w-6 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="z-50 w-56 p-2">
                          <span className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                            Manage Approvers
                          </span>
                          <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
                            {activeOrg.members?.map((m: any) => {
                              const isApprover = approval.approverIds.includes(
                                m.userId
                              )
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={async () => {
                                    const newApprovers = isApprover
                                      ? approval.approverIds.filter(
                                          (id) => id !== m.userId
                                        )
                                      : [...approval.approverIds, m.userId]
                                    if (newApprovers.length === 0) {
                                      toast.error(
                                        "At least one approver required"
                                      )
                                      return
                                    }
                                    await inviteApprvs({
                                      approvalId,
                                      approverIds: newApprovers,
                                    })
                                  }}
                                  className="flex w-full items-center justify-between rounded p-1.5 text-left text-xs hover:bg-accent"
                                >
                                  <span>{m.user?.name}</span>
                                  {isApprover && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Subscribers */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Subscribers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {approval.subscriberIds &&
                      approval.subscriberIds.length > 0 ? (
                        approval.subscriberIds.map((userId) => (
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-6 w-6 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="z-50 w-56 p-2">
                        <span className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          Manage Subscribers
                        </span>
                        <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
                          {activeOrg.members?.map((m: any) => {
                            const isSub = (
                              approval.subscriberIds || []
                            ).includes(m.userId)
                            const isApprv = approval.approverIds.includes(
                              m.userId
                            )
                            if (isApprv) return null
                            return (
                              <button
                                type="button"
                                key={m.id}
                                onClick={async () => {
                                  const currentSubs =
                                    approval.subscriberIds || []
                                  const newSubs = isSub
                                    ? currentSubs.filter(
                                        (id) => id !== m.userId
                                      )
                                    : [...currentSubs, m.userId]
                                  await inviteSubs({
                                    approvalId,
                                    subscriberIds: newSubs,
                                  })
                                }}
                                className="flex w-full items-center justify-between rounded p-1.5 text-left text-xs hover:bg-accent"
                              >
                                <span>{m.user?.name}</span>
                                {isSub && (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Request Timing */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span>Request Timing</span>
                  </div>
                  <div>
                    {(() => {
                      const info = getDelayOrAgeInfo(approval)
                      if (!info)
                        return (
                          <span className="text-muted-foreground italic">
                            -
                          </span>
                        )
                      return (
                        <Badge
                          variant="outline"
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${info.style}`}
                        >
                          {info.label}
                        </Badge>
                      )
                    })()}
                  </div>

                  {/* Required Custom Form Section */}
                  {approval.formId && (
                    <div className="col-span-2 mt-2">
                      <ApprovalCompletionForm
                        approvalId={approval._id}
                        formId={approval.formId}
                        formResponseId={approval.formResponseId}
                        organizationId={approval.organizationId}
                        isApproverOrCreator={
                          approval.approverIds.includes(currentUserId!) ||
                          isCreator ||
                          isAdminOrOwner
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Request Description Card */}
                <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4">
                  <h4 className="text-xs font-bold text-foreground">
                    Request Description
                  </h4>
                  {isEditingDetails && canEditApprovalDetails ? (
                    <textarea
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      onBlur={() =>
                        editedDesc.trim() !== (approval.description || "") &&
                        handleUpdateDetails({ description: editedDesc.trim() })
                      }
                      placeholder="Add a detailed description for this request..."
                      rows={4}
                      className="flex min-h-[100px] w-full rounded-lg border border-input/60 bg-transparent px-3 py-2 text-xs transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 dark:bg-background/20"
                    />
                  ) : (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/90">
                      {approval.description || "No description provided."}
                    </p>
                  )}
                </div>

                {/* Tab layout: Discussion & Activity logs */}
                <Tabs
                  defaultValue="discussion"
                  className="flex min-h-0 w-full flex-1 flex-col"
                >
                  <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger
                      value="discussion"
                      onClick={() => setActiveTab("discussion")}
                      className="flex items-center gap-1 text-xs font-semibold"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Discussion
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      onClick={() => setActiveTab("activity")}
                      className="flex items-center gap-1 text-xs font-semibold"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Activity Log
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="discussion"
                    className="mt-0 flex min-h-0 flex-1 flex-col pt-0 outline-none"
                  >
                    <div className="flex max-h-[550px] min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-border/20 bg-card">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between border-b border-border/20 bg-muted/20 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">
                            Approval Discussions
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {chats ? `${chats.length} messages` : "Loading..."}
                        </span>
                      </div>

                      {/* Messages Stream */}
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                        {chats === undefined ? (
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : chats.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <MessageSquare className="mb-2 size-8 animate-bounce text-muted-foreground/30" />
                            <span className="text-xs font-semibold text-foreground">
                              No messages yet
                            </span>
                            <span className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                              Be the first to say something or ask a question
                              about this request.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3.5">
                            {chats.map((chat: any) => (
                              <div
                                key={chat._id}
                                className={`flex gap-3 text-xs ${chat.isSystem ? "items-center justify-between rounded-lg border border-border/20 bg-muted/30 p-2" : ""}`}
                              >
                                {!chat.isSystem && (
                                  <UserAvatar
                                    userId={chat.userId}
                                    avatarClassName="h-6 w-6 mt-0.5 shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  {!chat.isSystem && (
                                    <div className="mb-0.5 flex items-center gap-1.5">
                                      <AvatarHoverCard userId={chat.userId}>
                                        <span className="cursor-pointer font-semibold text-foreground hover:underline">
                                          {chat.userId === currentUserId
                                            ? "You"
                                            : "User"}
                                        </span>
                                      </AvatarHoverCard>
                                      <span className="text-[9px] text-muted-foreground">
                                        {new Date(
                                          chat._creationTime
                                        ).toLocaleTimeString(undefined, {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  <p
                                    className={`leading-relaxed text-foreground/90 ${chat.isSystem ? "text-[10px] font-medium text-muted-foreground/80 italic" : ""}`}
                                  >
                                    {chat.content}
                                  </p>

                                  {/* Attachment preview if any */}
                                  {chat.attachmentIds &&
                                    chat.attachmentIds.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {attachments
                                          ?.filter((a) =>
                                            chat.attachmentIds?.includes(a._id)
                                          )
                                          .map((attach) => (
                                            <div
                                              key={attach._id}
                                              className="flex items-center justify-between rounded-lg border bg-card p-2 text-xs"
                                            >
                                              <div className="flex min-w-0 items-center gap-2">
                                                <File className="h-4 w-4 shrink-0 text-primary" />
                                                <div className="flex min-w-0 flex-col">
                                                  <span className="truncate font-medium">
                                                    {attach.fileName}
                                                  </span>
                                                  <span className="text-[9px] text-muted-foreground">
                                                    {formatFileSize(
                                                      attach.fileSize
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  size="icon-sm"
                                                  variant="ghost"
                                                  className="h-6 w-6"
                                                >
                                                  <Download className="h-3.5 w-3.5" />
                                                </Button>
                                                {(attach.uploaderId ===
                                                  currentUserId ||
                                                  approval.creatorId ===
                                                    currentUserId) && (
                                                  <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-destructive"
                                                    onClick={() =>
                                                      handleDeleteAttachment(
                                                        attach._id
                                                      )
                                                    }
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
                                {!chat.isSystem &&
                                  chat.userId === currentUserId && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          size="icon-sm"
                                          variant="ghost"
                                          className="h-6 w-6 shrink-0 self-start text-muted-foreground"
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="flex cursor-pointer items-center gap-1.5 text-xs text-destructive"
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

                      {/* Chat Input Bar & Toolbar */}
                      {approval.isArchived ? (
                        <div className="shrink-0 border-t border-border/20 bg-muted/5 p-4 text-center text-xs text-muted-foreground italic">
                          New messages cannot be added to archived approval
                          requests.
                        </div>
                      ) : (
                        <div className="flex shrink-0 flex-col gap-2 border-t border-border/20 bg-muted/20 p-3">
                          {/* File drafts */}
                          {draftAttachmentFiles.length > 0 && (
                            <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pb-1">
                              {draftAttachmentFiles.map((draft, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[10px]"
                                >
                                  <span className="max-w-[100px] truncate">
                                    {draft.file.name}
                                  </span>
                                  {!draft.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handleDeleteAttachment(draft.id)
                                        setDraftAttachmentFiles((prev) =>
                                          prev.filter(
                                            (d) => d.file !== draft.file
                                          )
                                        )
                                      }}
                                      className="ml-0.5 text-destructive hover:scale-110"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Toolbar buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 pb-1 select-none">
                            {/* File Upload Input */}
                            <div>
                              <input
                                type="file"
                                id="approval-file-upload"
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="flex h-7 items-center gap-1.5 rounded-full border-border/30 bg-background/60 px-2.5 text-[10px] font-medium text-muted-foreground transition-all hover:border-border/60 hover:bg-muted hover:text-foreground"
                                onClick={() =>
                                  document
                                    .getElementById("approval-file-upload")
                                    ?.click()
                                }
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span>Add File</span>
                              </Button>
                            </div>

                            {/* Status update selector triggers */}
                            {(approval.approverIds.includes(currentUserId!) ||
                              approval.creatorId === currentUserId ||
                              activeMember?.role === "admin") && (
                              <div className="flex items-center gap-1">
                                {["Approved", "Declined", "Rework"].map(
                                  (st) => {
                                    if (st === approval.status) return null
                                    const isApproveBlocked =
                                      st === "Approved" &&
                                      !!approval.formId &&
                                      !approval.formResponseId
                                    return (
                                      <Button
                                        key={st}
                                        type="button"
                                        variant="outline"
                                        disabled={isApproveBlocked}
                                        className="h-7 rounded-full border-border/30 bg-background/60 px-2.5 text-[10px] font-semibold transition-all hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                                        onClick={() => {
                                          setStatusToChange(st)
                                        }}
                                      >
                                        <span>Set {st}</span>
                                      </Button>
                                    )
                                  }
                                )}
                              </div>
                            )}
                          </div>

                          {/* Input Text Form */}
                          <form
                            onSubmit={handleSendChatMessage}
                            className="flex items-center gap-2"
                          >
                            <Input
                              placeholder="Ask a question or add a status update comment..."
                              value={newChat}
                              onChange={(e) => setNewChat(e.target.value)}
                              disabled={isChatSending}
                              className="h-9 flex-1 text-xs"
                            />
                            <Button
                              type="submit"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              disabled={isChatSending}
                            >
                              {isChatSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-3 pt-4">
                    {auditLogs === undefined ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No activity logged yet.
                      </div>
                    ) : (
                      <div className="relative ml-3 space-y-4 border-l border-border/50 py-2 pl-4">
                        {auditLogs.map((log) => (
                          <div
                            key={log._id}
                            className="relative flex flex-col gap-0.5 text-xs"
                          >
                            <span className="absolute top-0.5 -left-[21px] flex h-2 w-2 rounded-full bg-primary" />
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                              <span>Action: {log.action}</span>
                              <span>•</span>
                              <span>
                                {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-foreground/80">
                              Performed by actor ID {log.actorId.slice(-4)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
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

            {/* Status Change Dialog with Comment */}
            <AlertDialog
              open={statusToChange !== null}
              onOpenChange={(open) => !open && setStatusToChange(null)}
            >
              <AlertDialogContent className="sm:max-w-[400px]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-1.5 text-sm font-bold">
                    Confirm Transition to {statusToChange}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mt-1 text-xs text-muted-foreground">
                    Please provide an additional status transition comment.{" "}
                    {statusToChange === "Rework" &&
                      "This will automatically generate a task for the creator to rework on the files by EOD."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Input
                    placeholder="Enter transition comment (optional)..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="h-9 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStatusTransitionSubmit()
                    }}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-8 text-xs">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="h-8 text-xs"
                    onClick={handleStatusTransitionSubmit}
                    disabled={isStatusChanging}
                  >
                    Confirm Change
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Message Delete Alert Dialog */}
            <AlertDialog
              open={chatToDelete !== null}
              onOpenChange={(open) => !open && setChatToDelete(null)}
            >
              <AlertDialogContent className="sm:max-w-[400px]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
                    Delete Chat Message?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground">
                    This action is permanent. Do you want to delete this
                    message?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {chatToDelete?.attachmentIds &&
                  chatToDelete.attachmentIds.length > 0 && (
                    <div className="my-1 flex items-center gap-2 rounded-lg border bg-muted/10 p-2.5 py-2">
                      <input
                        type="checkbox"
                        id="delete-attachments-chk"
                        checked={deleteAttachmentWithMsg}
                        onChange={(e) =>
                          setDeleteAttachmentWithMsg(e.target.checked)
                        }
                        className="cursor-pointer rounded border-border"
                      />
                      <label
                        htmlFor="delete-attachments-chk"
                        className="cursor-pointer text-[11px] font-semibold text-foreground/80 select-none"
                      >
                        Also delete all file attachments loaded in this message.
                      </label>
                    </div>
                  )}

                <AlertDialogFooter className="mt-2">
                  <AlertDialogCancel className="h-8 text-xs">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="text-destructive-foreground h-8 bg-destructive text-xs hover:bg-destructive/95"
                    onClick={handleDeleteMessage}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ApprovalCompletionForm({
  approvalId,
  formId,
  formResponseId,
  organizationId,
  isApproverOrCreator,
}: {
  approvalId: any
  formId: any
  formResponseId?: any
  organizationId: string
  isApproverOrCreator: boolean
}) {
  const form = useQuery(api.forms.getForm, { formId })
  const response = useQuery(
    api.forms.getFormResponse,
    formResponseId ? { formResponseId } : "skip"
  )
  const submitFormResponse = useMutation(api.forms.submitFormResponse)
  const { data: activeOrg } = authClient.useActiveOrganization()

  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize answers
  useEffect(() => {
    if (form) {
      const initial: Record<string, any> = {}
      form.fields.forEach((f: any) => {
        if (f.type === "checkbox") {
          initial[f.id] = []
        } else {
          initial[f.id] = ""
        }
      })
      setAnswers(initial)
    }
  }, [form])

  if (form === undefined) {
    return (
      <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Loading form questions...</span>
      </div>
    )
  }

  if (form === null) return null

  const handleTextChange = (fieldId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }))
  }

  const handleCheckboxChange = (
    fieldId: string,
    option: string,
    checked: boolean
  ) => {
    const current = answers[fieldId] || []
    const updated = checked
      ? [...current, option]
      : current.filter((o: string) => o !== option)
    setAnswers((prev) => ({ ...prev, [fieldId]: updated }))
  }

  const handleFileUpload = (
    fieldId: string,
    type: "file" | "image",
    file: File | null
  ) => {
    if (!file) {
      setAnswers((prev) => ({ ...prev, [fieldId]: "" }))
      return
    }

    if (type === "image") {
      setAnswers((prev) => ({
        ...prev,
        [fieldId]: `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`,
      }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        [fieldId]: `https://ground-control.mock/attachments/${Date.now()}-${file.name}`,
      }))
    }
    toast.success(`${file.name} uploaded successfully (mock)`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    for (const f of form.fields) {
      const val = answers[f.id]
      if (f.required) {
        if (f.type === "checkbox" && (!val || val.length === 0)) {
          toast.error(`"${f.label}" is required.`)
          return
        }
        if (f.type !== "checkbox" && (!val || String(val).trim() === "")) {
          toast.error(`"${f.label}" is required.`)
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      const payloadAnswers = Object.entries(answers).map(
        ([fieldId, value]) => ({
          fieldId,
          value,
        })
      )

      await submitFormResponse({
        formId: form._id,
        answers: payloadAnswers,
        approvalId,
        organizationId,
      })

      toast.success("Required form submitted successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (formResponseId) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2 select-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Completion Form Submitted</span>
          </div>
          {response && (
            <Badge
              variant="outline"
              className="border-emerald-500/15 bg-emerald-500/5 text-[9px] font-semibold text-emerald-600"
            >
              Verified Response
            </Badge>
          )}
        </div>

        {response ? (
          <div className="space-y-2.5 text-xs">
            {form.fields.map((f: any) => {
              const ans = response.answers.find((a: any) => a.fieldId === f.id)
              const val = ans ? ans.value : undefined

              return (
                <div key={f.id} className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground/80">
                    {f.label}
                  </span>
                  <div className="border-l border-border/80 py-0.5 pl-2 text-[11px] leading-relaxed font-medium text-muted-foreground">
                    {val === undefined || val === "" ? (
                      <span className="text-[10px] text-muted-foreground/50 italic">
                        No answer provided
                      </span>
                    ) : Array.isArray(val) ? (
                      val.join(", ")
                    ) : f.type === "file" || f.type === "image" ? (
                      <a
                        href={val}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        {f.type === "image" ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <FileIcon className="h-3 w-3" />
                        )}
                        <span className="max-w-[180px] truncate">
                          {val.split("/").pop() || "Attachment Link"}
                        </span>
                      </a>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between border-t border-emerald-500/10 pt-2 text-[10px] font-semibold text-muted-foreground/75">
              <span>
                Submitted by:{" "}
                {activeOrg?.members?.find(
                  (m: any) => m.userId === response.submitterId
                )?.user?.name || "Member"}
              </span>
              <span>{new Date(response.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">
            Loading submitted responses...
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
      <div className="border-b border-border/40 pb-2">
        <h4 className="flex animate-pulse items-center gap-1.5 text-xs font-bold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span>Required Completion Form: {form.title}</span>
        </h4>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          You must fill out this form to complete this approval request.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {form.fields.map((f: any) => {
          const val = answers[f.id]

          return (
            <div key={f.id} className="flex flex-col gap-1.5 text-xs">
              <label className="flex items-center gap-1 font-semibold text-foreground/80">
                <span>{f.label}</span>
                {f.required && (
                  <span className="font-bold text-red-500">*</span>
                )}
              </label>

              {/* Text Field */}
              {f.type === "text" && (
                <Input
                  placeholder={f.placeholder || "Enter answer..."}
                  value={val || ""}
                  onChange={(e) => handleTextChange(f.id, e.target.value)}
                  required={f.required}
                  disabled={isSubmitting || !isApproverOrCreator}
                  className="h-8.5 border-input/60 bg-muted/5 text-xs"
                />
              )}

              {/* Paragraph Textarea */}
              {f.type === "textarea" && (
                <textarea
                  placeholder={f.placeholder || "Enter detailed answer..."}
                  value={val || ""}
                  onChange={(e) => handleTextChange(f.id, e.target.value)}
                  required={f.required}
                  disabled={isSubmitting || !isApproverOrCreator}
                  rows={3}
                  className="flex w-full rounded-md border border-input/60 bg-muted/5 px-3 py-1.5 text-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}

              {/* Radio Selection */}
              {f.type === "radio" && (
                <div className="flex flex-col gap-1.5 pl-1.5">
                  {f.options?.map((opt: string, oIdx: number) => (
                    <label
                      key={oIdx}
                      className="flex cursor-pointer items-center gap-2 font-medium text-muted-foreground select-none hover:text-foreground"
                    >
                      <input
                        type="radio"
                        name={f.id}
                        checked={val === opt}
                        onChange={() => handleTextChange(f.id, opt)}
                        required={f.required && !val}
                        disabled={isSubmitting || !isApproverOrCreator}
                        className="size-3 cursor-pointer border-input accent-primary"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Checkbox List */}
              {f.type === "checkbox" && (
                <div className="flex flex-col gap-1.5 pl-1.5">
                  {f.options?.map((opt: string, oIdx: number) => {
                    const isChecked = (val || []).includes(opt)
                    return (
                      <label
                        key={oIdx}
                        className="flex cursor-pointer items-center gap-2 font-medium text-muted-foreground select-none hover:text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleCheckboxChange(f.id, opt, e.target.checked)
                          }
                          disabled={isSubmitting || !isApproverOrCreator}
                          className="size-3 cursor-pointer rounded-sm border-input accent-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Dropdown Select */}
              {f.type === "select" && (
                <Select
                  value={val || ""}
                  onValueChange={(value) => handleTextChange(f.id, value)}
                >
                  <SelectTrigger className="h-8.5 w-full border-border/60 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Select option..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover text-xs">
                    {f.options?.map((opt: string, oIdx: number) => (
                      <SelectItem key={oIdx} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Date Input */}
              {f.type === "date" && (
                <Input
                  type="date"
                  value={val || ""}
                  onChange={(e) => handleTextChange(f.id, e.target.value)}
                  required={f.required}
                  disabled={isSubmitting || !isApproverOrCreator}
                  className="h-8.5 border-input/60 bg-muted/5 text-xs"
                />
              )}

              {/* Number Input */}
              {f.type === "number" && (
                <Input
                  type="number"
                  placeholder={f.placeholder || "Enter number..."}
                  value={val || ""}
                  onChange={(e) => handleTextChange(f.id, e.target.value)}
                  required={f.required}
                  disabled={isSubmitting || !isApproverOrCreator}
                  className="h-8.5 border-input/60 bg-muted/5 text-xs"
                />
              )}

              {/* File Upload Component */}
              {f.type === "file" && (
                <div className="flex flex-col gap-1.5">
                  <Input
                    type="file"
                    onChange={(e) =>
                      handleFileUpload(
                        f.id,
                        "file",
                        e.target.files?.[0] || null
                      )
                    }
                    required={f.required && !val}
                    disabled={isSubmitting || !isApproverOrCreator}
                    className="h-8.5 cursor-pointer border-input/60 bg-background text-xs"
                  />
                  {val && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <FileIcon className="h-3 w-3" />
                      <span>Uploaded File Mock</span>
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload Component */}
              {f.type === "image" && (
                <div className="flex flex-col gap-1.5">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileUpload(
                        f.id,
                        "image",
                        e.target.files?.[0] || null
                      )
                    }
                    required={f.required && !val}
                    disabled={isSubmitting || !isApproverOrCreator}
                    className="h-8.5 cursor-pointer border-input/60 bg-background text-xs"
                  />
                  {val && (
                    <div className="mt-1 flex flex-col items-start gap-1">
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-primary">
                        <ImageIcon className="h-3 w-3" />
                        <span>Image uploaded</span>
                      </div>
                      <img
                        src={val}
                        alt="Uploaded mockup"
                        className="h-16 w-16 rounded-lg border border-border object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {isApproverOrCreator ? (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex h-8.5 w-full cursor-pointer items-center justify-center gap-1 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Submitting Response...</span>
              </>
            ) : (
              <span>Submit Form & Approve Request</span>
            )}
          </Button>
        ) : (
          <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-center text-[10px] font-semibold text-muted-foreground/75 select-none">
            Only approvers or the creator can submit this completion form.
          </div>
        )}
      </form>
    </div>
  )
}
