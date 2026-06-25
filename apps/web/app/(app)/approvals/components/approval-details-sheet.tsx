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
import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/ui/components/tooltip"
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
  AlertCircle,
  FileText,
  User,
  Clock,
  X,
  Pencil,
  MoreHorizontal,
  File,
  Download,
  Calendar,
  MessageSquare,
  Check,
  Send,
  Trash2,
  Paperclip,
} from "lucide-react"
import { toast } from "sonner"
import { getAvatarUrl } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"

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

  const approval = useQuery(api.approvals.getApproval, approvalId ? { approvalId } : "skip")
  const auditLogs = useQuery(api.approvals.getApprovalAuditLogs, approvalId ? { approvalId } : "skip")
  const attachments = useQuery(api.approvalAttachments.getAttachments, approvalId ? { approvalId } : "skip")
  const chats = useQuery(api.approvalChats.getChats, approvalId ? { approvalId } : "skip")

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

  const [activeTab, setActiveTab] = useState<"discussion" | "activity">("discussion")
  const [newChat, setNewChat] = useState("")
  const [isChatSending, setIsChatSending] = useState(false)
  const [draftAttachmentFiles, setDraftAttachmentFiles] = useState<{ file: File; id?: string }[]>([])
  
  // Status change comments & confirm dialogs
  const [statusToChange, setStatusToChange] = useState<string | null>(null)
  const [statusComment, setStatusComment] = useState("")
  const [isStatusChanging, setIsStatusChanging] = useState(false)

  // Message delete dialog
  const [chatToDelete, setChatToDelete] = useState<any>(null)
  const [deleteAttachmentWithMsg, setDeleteAttachmentWithMsg] = useState(false)

  // Title / Desc edits
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedDesc, setEditedDesc] = useState("")

  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentUserId = session?.user?.id

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

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim() || editedTitle === approval?.title) {
      setIsEditingTitle(false)
      return
    }
    try {
      await updateDetails({ approvalId, title: editedTitle.trim() })
      toast.success("Title updated")
      setIsEditingTitle(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update title")
    }
  }

  const handleUpdateDesc = async () => {
    if (editedDesc === approval?.description) {
      setIsEditingDesc(false)
      return
    }
    try {
      await updateDetails({ approvalId, description: editedDesc.trim() || undefined })
      toast.success("Description updated")
      setIsEditingDesc(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update description")
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
        setDraftAttachmentFiles((prev) => prev.filter((d) => d.file !== draft.file))
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
    const startOfToday = new Date().setHours(0,0,0,0)

    if (app.dueDate) {
      const isOverdue = app.dueDate < startOfToday && app.status !== "Approved" && app.status !== "Declined"
      if (isOverdue) {
        const diffTime = now - app.dueDate
        const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
          isOverdue: true,
          label: `Delayed by ${delayDays} ${delayDays === 1 ? "day" : "days"}`,
          style: "bg-red-500/10 text-red-500 border-red-500/20"
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
          style: "bg-muted text-muted-foreground border-border/40"
        }
      }
      return {
        isOverdue: false,
        label: `${ageDays} ${ageDays === 1 ? "day" : "days"} old`,
        style: "bg-muted text-muted-foreground border-border/40"
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!fixed !top-4 !right-4 !bottom-4 z-50 flex !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 p-0 shadow-2xl backdrop-blur-md bg-background/95 duration-300 outline-none sm:!max-w-xl"
      >
        <SheetTitle className="sr-only">Approval Request Details</SheetTitle>
        <SheetDescription className="sr-only">
          Details drawer for approval requests
        </SheetDescription>

        {approval === undefined ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading request details...</p>
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
                <span className="text-[11px] font-medium font-mono text-muted-foreground/50">
                  #{approval._id.slice(-4)}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {(() => {
                  const info = getDelayOrAgeInfo(approval)
                  return info ? (
                    <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${info.style}`}>
                      {info.label}
                    </Badge>
                  ) : null
                })()}
                <Badge variant="outline" className={`px-2.5 py-0.5 text-[10px] font-bold border ${getStatusColor(approval.status)}`}>
                  {approval.status}
                </Badge>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-6">
                {/* Title Section */}
                <div className="space-y-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="h-8 text-sm font-bold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateTitle()
                          if (e.key === "Escape") setIsEditingTitle(false)
                        }}
                      />
                      <Button size="sm" onClick={handleUpdateTitle} className="h-8 text-[10px]">
                        Save
                      </Button>
                    </div>
                  ) : (
                    <h3
                      className="text-base font-bold text-foreground cursor-pointer hover:bg-muted/10 p-1 rounded transition-all flex items-center gap-2"
                      onClick={() => {
                        if (currentUserId === approval.creatorId || activeMember?.role === "admin") {
                          setEditedTitle(approval.title)
                          setIsEditingTitle(true)
                        }
                      }}
                    >
                      {approval.title}
                      {(currentUserId === approval.creatorId || activeMember?.role === "admin") && (
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 hover:opacity-100 group-hover:opacity-100" />
                      )}
                    </h3>
                  )}
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-xs rounded-xl border border-border/40 bg-muted/5 p-4">
                  {/* Creator */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-[10px] uppercase">Creator</span>
                    <div className="flex items-center gap-2">
                      <UserAvatar userId={approval.creatorId} avatarClassName="h-6 w-6" />
                    </div>
                  </div>

                  {/* Created Time */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-[10px] uppercase flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Created
                    </span>
                    <div className="font-semibold text-foreground/80 mt-1">
                      {new Date(approval._creationTime).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <span className="text-muted-foreground font-medium text-[10px] uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Due Date
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {(currentUserId === approval.creatorId || activeMember?.role === "admin") ? (
                        <input
                          type="date"
                          value={
                            approval.dueDate
                              ? new Date(approval.dueDate).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={async (e) => {
                            const dateVal = e.target.value
                            try {
                              await updateDetails({
                                approvalId,
                                dueDate: dateVal ? new Date(dateVal).getTime() : 0,
                              })
                              toast.success("Due date updated")
                            } catch (err: any) {
                              toast.error(err.message || "Failed to update due date")
                            }
                          }}
                          className="h-7 w-[130px] border border-input/60 rounded bg-background px-1.5 py-0.5 text-xs text-foreground focus-visible:outline-none"
                        />
                      ) : (
                        <span className="font-semibold text-foreground/80">
                          {approval.dueDate
                            ? new Date(approval.dueDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "No due date"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Approvers */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-muted-foreground font-medium text-[10px] uppercase">Approvers</span>
                      {(currentUserId === approval.creatorId || activeMember?.role === "admin") && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon-sm" variant="ghost" className="h-5 w-5 text-muted-foreground">
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 z-50">
                            <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase">Manage Approvers</span>
                            <div className="space-y-0.5 max-h-40 overflow-y-auto mt-1">
                              {activeOrg.members?.map((m: any) => {
                                const isApprover = approval.approverIds.includes(m.userId)
                                return (
                                  <button
                                    type="button"
                                    key={m.id}
                                    onClick={async () => {
                                      const newApprovers = isApprover
                                        ? approval.approverIds.filter((id) => id !== m.userId)
                                        : [...approval.approverIds, m.userId]
                                      if (newApprovers.length === 0) {
                                        toast.error("At least one approver required")
                                        return
                                      }
                                      await inviteApprvs({ approvalId, approverIds: newApprovers })
                                    }}
                                    className="flex items-center justify-between w-full text-xs p-1.5 hover:bg-accent rounded text-left"
                                  >
                                    <span>{m.user?.name}</span>
                                    {isApprover && <Check className="h-3.5 w-3.5 text-primary" />}
                                  </button>
                                )
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <div className="flex -space-x-1.5 overflow-hidden items-center">
                      {approval.approverIds.map((userId) => (
                        <UserAvatar key={userId} userId={userId} avatarClassName="h-6 w-6 border border-background" />
                      ))}
                    </div>
                  </div>

                  {/* Subscribers */}
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-muted-foreground font-medium text-[10px] uppercase">Subscribers</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="icon-sm" variant="ghost" className="h-5 w-5 text-muted-foreground">
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 z-50">
                          <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase">Manage Subscribers</span>
                          <div className="space-y-0.5 max-h-40 overflow-y-auto mt-1">
                            {activeOrg.members?.map((m: any) => {
                              const isSub = (approval.subscriberIds || []).includes(m.userId)
                              const isApprv = approval.approverIds.includes(m.userId)
                              if (isApprv) return null
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={async () => {
                                    const currentSubs = approval.subscriberIds || []
                                    const newSubs = isSub
                                      ? currentSubs.filter((id) => id !== m.userId)
                                      : [...currentSubs, m.userId]
                                    await inviteSubs({ approvalId, subscriberIds: newSubs })
                                  }}
                                  className="flex items-center justify-between w-full text-xs p-1.5 hover:bg-accent rounded text-left"
                                >
                                  <span>{m.user?.name}</span>
                                  {isSub && <Check className="h-3.5 w-3.5 text-primary" />}
                                </button>
                              )
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {approval.subscriberIds && approval.subscriberIds.length > 0 ? (
                        approval.subscriberIds.map((userId) => (
                          <div key={userId} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-[10px]">
                            <UserAvatar userId={userId} avatarClassName="h-4 w-4" />
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No subscribers</span>
                      )}
                    </div>
                  </div>

                  {/* Delay or Age Info */}
                  {(() => {
                    const info = getDelayOrAgeInfo(approval)
                    if (!info) return null
                    return (
                      <div className="col-span-2 pt-3 border-t border-dashed border-border/50 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-semibold uppercase">Request Timing</span>
                        <Badge variant="outline" className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${info.style}`}>
                          {info.label}
                        </Badge>
                      </div>
                    )
                  })()}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</h4>
                  {isEditingDesc ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editedDesc}
                        onChange={(e) => setEditedDesc(e.target.value)}
                        className="flex w-full min-h-[80px] rounded-md border border-input bg-input/20 px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="xs" variant="outline" onClick={() => setIsEditingDesc(false)} className="text-[10px]">
                          Cancel
                        </Button>
                        <Button size="xs" onClick={handleUpdateDesc} className="text-[10px]">
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-muted-foreground hover:bg-muted/10 p-2 rounded transition-all cursor-pointer leading-relaxed"
                      onClick={() => {
                        if (currentUserId === approval.creatorId || activeMember?.role === "admin") {
                          setEditedDesc(approval.description || "")
                          setIsEditingDesc(true)
                        }
                      }}
                    >
                      {approval.description || <span className="italic">Click to add description...</span>}
                    </div>
                  )}
                </div>

                {/* Tab layout: Discussion & Activity logs */}
                <Tabs defaultValue="discussion" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="discussion" onClick={() => setActiveTab("discussion")} className="text-xs font-semibold flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Discussion
                    </TabsTrigger>
                    <TabsTrigger value="activity" onClick={() => setActiveTab("activity")} className="text-xs font-semibold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Activity Log
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="discussion" className="pt-4 space-y-4">
                    {/* Chat comments */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {chats === undefined ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : chats.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground italic py-6">
                          No messages yet. Start alignment comments below.
                        </div>
                      ) : (
                        chats.map((chat: any) => (
                          <div key={chat._id} className={`flex gap-3 text-xs ${chat.isSystem ? "bg-muted/30 border border-border/20 rounded-lg p-2 items-center justify-between" : ""}`}>
                            {!chat.isSystem && (
                              <UserAvatar userId={chat.userId} avatarClassName="h-6 w-6 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              {!chat.isSystem && (
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <AvatarHoverCard userId={chat.userId}>
                                    <span className="font-semibold text-foreground cursor-pointer hover:underline">
                                      {chat.userId === currentUserId ? "You" : "User"}
                                    </span>
                                  </AvatarHoverCard>
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(chat._creationTime).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                              <p className={`leading-relaxed text-foreground/90 ${chat.isSystem ? "text-[10px] text-muted-foreground/80 italic font-medium" : ""}`}>
                                {chat.content}
                              </p>
                              
                              {/* Attachment preview if any */}
                              {chat.attachmentIds && chat.attachmentIds.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {attachments
                                    ?.filter((a) => chat.attachmentIds?.includes(a._id))
                                    .map((attach) => (
                                      <div key={attach._id} className="flex items-center justify-between border rounded-lg bg-card p-2 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <File className="h-4 w-4 text-primary shrink-0" />
                                          <div className="flex flex-col min-w-0">
                                            <span className="font-medium truncate">{attach.fileName}</span>
                                            <span className="text-[9px] text-muted-foreground">{formatFileSize(attach.fileSize)}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button size="icon-sm" variant="ghost" className="h-6 w-6">
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                          {(attach.uploaderId === currentUserId || approval.creatorId === currentUserId) && (
                                            <Button
                                              size="icon-sm"
                                              variant="ghost"
                                              className="h-6 w-6 text-destructive"
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
                                  <Button size="icon-sm" variant="ghost" className="h-6 w-6 text-muted-foreground self-start shrink-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-xs text-destructive flex items-center gap-1.5 cursor-pointer"
                                    onClick={() => setChatToDelete(chat)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="pt-4 space-y-3">
                    {auditLogs === undefined ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6">
                        No activity logged yet.
                      </div>
                    ) : (
                      <div className="relative border-l border-border/50 ml-3 pl-4 space-y-4 py-2">
                        {auditLogs.map((log) => (
                          <div key={log._id} className="relative flex flex-col gap-0.5 text-xs">
                            <span className="absolute -left-[21px] top-0.5 flex h-2 w-2 rounded-full bg-primary" />
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                              <span>Action: {log.action}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-foreground/80 text-[11px] leading-relaxed">
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

            {/* Chat Send Input Box / Toolbar */}
            {activeTab === "discussion" && (
              <div className="border-t border-border/20 bg-muted/20 p-3 flex flex-col gap-2 shrink-0">
                {/* File drafts */}
                {draftAttachmentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-1">
                    {draftAttachmentFiles.map((draft, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-[10px]">
                        <span className="max-w-[100px] truncate">{draft.file.name}</span>
                        {!draft.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : (
                          <button
                            onClick={() => {
                              handleDeleteAttachment(draft.id)
                              setDraftAttachmentFiles((prev) => prev.filter((d) => d.file !== draft.file))
                            }}
                            className="text-destructive hover:scale-110 ml-0.5"
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
                      className="h-7 px-2.5 text-[10px] font-medium rounded-full bg-background/60 hover:bg-muted border-border/30 hover:border-border/60 transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => document.getElementById("approval-file-upload")?.click()}
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span>Add File</span>
                    </Button>
                  </div>

                  {/* Status update selector triggers */}
                  {(approval.approverIds.includes(currentUserId!) || approval.creatorId === currentUserId || activeMember?.role === "admin") && (
                    <div className="flex items-center gap-1">
                      {["Approved", "Declined", "Rework"].map((st) => {
                        if (st === approval.status) return null
                        return (
                          <Button
                            key={st}
                            type="button"
                            variant="outline"
                            className="h-7 px-2.5 text-[10px] font-semibold rounded-full bg-background/60 border-border/30 hover:bg-muted transition-all hover:text-foreground"
                            onClick={() => {
                              setStatusToChange(st)
                            }}
                          >
                            <span>Set {st}</span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Input Text Form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center">
                  <Input
                    placeholder="Ask a question or add a status update comment..."
                    value={newChat}
                    onChange={(e) => setNewChat(e.target.value)}
                    disabled={isChatSending}
                    className="h-9 text-xs flex-1"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isChatSending}>
                    {isChatSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Status Change Dialog with Comment */}
            <AlertDialog open={statusToChange !== null} onOpenChange={(open) => !open && setStatusToChange(null)}>
              <AlertDialogContent className="sm:max-w-[400px]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5">
                    Confirm Transition to {statusToChange}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
                    Please provide an additional status transition comment. {statusToChange === "Rework" && "This will automatically generate a task for the creator to rework on the files by EOD."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Input
                    placeholder="Enter transition comment (optional)..."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="text-xs h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStatusTransitionSubmit()
                    }}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="text-xs h-8"
                    onClick={handleStatusTransitionSubmit}
                    disabled={isStatusChanging}
                  >
                    Confirm Change
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Message Delete Alert Dialog */}
            <AlertDialog open={chatToDelete !== null} onOpenChange={(open) => !open && setChatToDelete(null)}>
              <AlertDialogContent className="sm:max-w-[400px]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                    Delete Chat Message?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-muted-foreground">
                    This action is permanent. Do you want to delete this message?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {chatToDelete?.attachmentIds && chatToDelete.attachmentIds.length > 0 && (
                  <div className="flex items-center gap-2 py-2 border rounded-lg p-2.5 bg-muted/10 my-1">
                    <input
                      type="checkbox"
                      id="delete-attachments-chk"
                      checked={deleteAttachmentWithMsg}
                      onChange={(e) => setDeleteAttachmentWithMsg(e.target.checked)}
                      className="cursor-pointer rounded border-border"
                    />
                    <label htmlFor="delete-attachments-chk" className="text-[11px] font-semibold text-foreground/80 cursor-pointer select-none">
                      Also delete all file attachments loaded in this message.
                    </label>
                  </div>
                )}

                <AlertDialogFooter className="mt-2">
                  <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/95" onClick={handleDeleteMessage}>
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
