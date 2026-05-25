"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  Sheet,
  SheetContent,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  ListTodo
} from "lucide-react"
import { toast } from "sonner"

interface TaskDetailsSheetProps {
  taskId: any
  isOpen: boolean
  onClose: () => void
}

export default function TaskDetailsSheet({ taskId, isOpen, onClose }: TaskDetailsSheetProps) {
  const { data: session } = authClient.useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const task = useQuery(api.tasks.getTask, taskId ? { taskId } : "skip")
  const subtasks = useQuery(api.tasks.getSubtasks, taskId ? { taskId } : "skip")

  const updateDetails = useMutation(api.tasks.updateTaskDetails)
  const updateStatus = useMutation(api.tasks.updateTaskStatus)
  const invite = useMutation(api.tasks.inviteAssignees)
  const addSubtask = useMutation(api.tasks.createSubtask)
  const toggleSub = useMutation(api.tasks.toggleSubtask)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSubtaskLoading, setIsSubtaskLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "subtasks">("details")

  // Sync details when task updates
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
    }
  }, [task])

  if (!isOpen) return null

  const currentUserId = session?.user?.id
  const isAssignee = task?.assigneeIds?.includes(currentUserId || "")
  const isCreator = task?.creatorId === currentUserId
  const canEdit = isAssignee || isCreator

  const handleUpdate = async (fields: { title?: string; description?: string; priority?: string; dueDate?: number }) => {
    if (!taskId || !canEdit) return
    setIsSaving(true)
    try {
      await updateDetails({
        taskId,
        ...fields
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
    if (!taskId) return
    try {
      const res = await updateStatus({
        taskId,
        status: newStatus
      })
      toast.success(`Task status updated to ${res.newStatus}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtask.trim() || !taskId || !canEdit) return
    setIsSubtaskLoading(true)
    try {
      await addSubtask({
        taskId,
        title: newSubtask.trim()
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
    if (!canEdit) {
      toast.error("Only assignees or the task creator can complete subtasks")
      return
    }
    try {
      await toggleSub({
        subtaskId,
        isCompleted
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update subtask")
    }
  }

  const handleInviteMember = async (memberUserId: string) => {
    if (!taskId || !canEdit) return
    try {
      await invite({
        taskId,
        assigneeIds: [memberUserId]
      })
      toast.success("Assignees updated")
      setInviteOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to invite member")
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
    if (num <= 3) return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300"
    if (num <= 7) return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300"
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
  const nonAssignees = activeOrg?.members?.filter(
    (m: any) => m.userId && !task?.assigneeIds?.includes(m.userId)
  ) || []

  const getMemberUser = (userId: string) => {
    return activeOrg?.members?.find((m: any) => m.userId === userId)?.user
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!fixed !top-4 !right-4 !bottom-4 !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] sm:!max-w-md overflow-hidden bg-card/95 border border-border/80 shadow-2xl rounded-2xl flex flex-col p-0 z-50 backdrop-blur-md outline-none duration-300"
      >
        {task === undefined ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading task details...</p>
          </div>
        ) : !task ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h4 className="font-semibold text-sm">Task Not Found</h4>
            <p className="text-xs text-muted-foreground text-center">
              The task you are looking for does not exist or has been deleted.
            </p>
            <Button size="sm" onClick={onClose} className="mt-2 text-xs">
              Close Panel
            </Button>
          </div>
        ) : (
          <>
            {/* Header/Title details */}
            <div className="p-6 pb-4 border-b border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span>Task Details</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate max-w-[120px] font-medium text-foreground">
                    #{task._id.substring(0, 6)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  <Select
                    value={task.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger
                      className={`h-7 px-3 text-[10px] font-medium rounded-full cursor-pointer transition-all hover:brightness-95 border ${getStatusStyle(
                        task.status
                      )}`}
                    >
                      <SelectValue placeholder={task.status} />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button size="icon-sm" variant="ghost" onClick={onClose} className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                {canEdit ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => title.trim() !== task.title && handleUpdate({ title: title.trim() })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur()
                      }
                    }}
                    className="text-lg font-bold bg-transparent border-transparent hover:border-input/40 focus-visible:border-input h-auto p-1 px-1.5 -ml-1.5 focus-visible:bg-background/50 transition-colors"
                  />
                ) : (
                  <h3 className="text-lg font-bold px-0.5">{task.title}</h3>
                )}
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-border/40 px-6 bg-muted/20">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                  activeTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Details
              </button>
              <button
                onClick={() => setActiveTab("subtasks")}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                  activeTab === "subtasks"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListTodo className="h-3.5 w-3.5" />
                Subtasks
                {subtasks && subtasks.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
                    {subtasks.filter((s) => s.isCompleted).length}/{subtasks.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === "details" ? (
                <>
                  {/* Metadata fields */}
                  <div className="space-y-4 rounded-xl bg-muted/25 border border-border/20 p-4">
                    {/* Priority Selector */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Priority
                      </span>
                      <div className="w-[140px]">
                        <Select
                          disabled={!canEdit}
                          value={task.priority}
                          onValueChange={(val) => handleUpdate({ priority: val })}
                        >
                          <SelectTrigger className={`h-8 text-xs border ${getPriorityStyle(task.priority)}`}>
                            <SelectValue placeholder={`Priority: ${task.priority}`} />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            {/* Option 1 to 10 */}
                            {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((val) => (
                              <SelectItem key={val} value={val}>
                                {val} - {val === "1" ? "Lowest" : val === "10" ? "Highest" : `Level ${val}`}
                              </SelectItem>
                            ))}
                            {/* Gracefully support legacy values in list if task has them */}
                            {!Array.from({ length: 10 }, (_, i) => String(i + 1)).includes(task.priority) && (
                              <SelectItem value={task.priority}>{task.priority} (Legacy)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Due Date Selector */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Due Date
                      </span>
                      <div className="relative w-[140px]">
                        <Input
                          type="date"
                          disabled={!canEdit}
                          value={
                            task.dueDate
                              ? new Date(task.dueDate).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            handleUpdate({
                              dueDate: dateVal ? new Date(dateVal).getTime() : 0,
                            });
                          }}
                          className="h-8 text-[11px] bg-background/50 border-border/80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Description
                    </span>
                    {canEdit ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => description.trim() !== (task.description || "") && handleUpdate({ description: description.trim() })}
                        placeholder="Add a detailed description for this task..."
                        rows={5}
                        className="flex w-full min-h-[120px] rounded-lg border border-input/60 bg-transparent px-3 py-2 text-xs transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 dark:bg-background/20"
                      />
                    ) : (
                      <p className="text-xs text-foreground/80 bg-muted/10 p-3 rounded-lg border border-border/20 min-h-[100px] whitespace-pre-wrap">
                        {task.description || "No description provided."}
                      </p>
                    )}
                  </div>

                  {/* Assignees Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        Assignees
                      </span>
                      {canEdit && nonAssignees.length > 0 && (
                        <div className="relative">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setInviteOpen(!inviteOpen)}
                            className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>

                          {inviteOpen && (
                            <div className="absolute right-0 top-7 w-64 bg-popover text-popover-foreground border border-border/80 rounded-xl shadow-xl z-20 overflow-hidden backdrop-blur-md">
                              <div className="p-2 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground">Assign Member</span>
                                <button onClick={() => setInviteOpen(false)} className="text-muted-foreground hover:text-foreground">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
                                {nonAssignees.map((member: any) => (
                                  <button
                                    key={member.id}
                                    onClick={() => handleInviteMember(member.userId)}
                                    className="w-full flex items-center gap-2 p-1.5 hover:bg-accent rounded-lg text-left transition-colors font-sans"
                                  >
                                    <Avatar className="h-5 w-5 shrink-0">
                                      <AvatarImage src={member.user?.image} />
                                      <AvatarFallback className="text-[9px]">
                                        {member.user?.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-medium truncate text-left">{member.user?.name}</span>
                                      <span className="text-[8px] text-muted-foreground truncate text-left">{member.user?.email}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                        task.assigneeIds.map((userId: string) => {
                          const userObj = getMemberUser(userId)
                          return (
                            <div
                              key={userId}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/15 border border-border/10 hover:border-border/30 transition-colors"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={userObj?.image || undefined} />
                                <AvatarFallback className="text-[10px] font-semibold">
                                  {userObj?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-medium truncate">
                                  {userObj?.name || "Unknown User"}
                                </span>
                                <span className="text-[8px] text-muted-foreground truncate">
                                  {userObj?.email || ""}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="col-span-2 py-4 text-center rounded-lg border border-dashed border-border/40">
                          <p className="text-[10px] text-muted-foreground italic">No members assigned to this task.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Subtasks Tab */
                <div className="space-y-4">
                  {/* Checklist Summary */}
                  {subtasks && subtasks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Checklist progress</span>
                        <span>
                          {Math.round(
                            (subtasks.filter((s) => s.isCompleted).length / subtasks.length) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${
                              (subtasks.filter((s) => s.isCompleted).length / subtasks.length) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtask Input Form */}
                  {canEdit && (
                    <form onSubmit={handleAddSubtask} className="flex gap-2">
                      <Input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add a new checklist item..."
                        disabled={isSubtaskLoading}
                        className="h-8 text-xs bg-background/50"
                      />
                      <Button type="submit" size="sm" disabled={isSubtaskLoading || !newSubtask.trim()} className="h-8 text-xs px-3">
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
                          onClick={() => canEdit && handleToggleSubtask(sub._id, !sub.isCompleted)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all text-xs select-none ${
                            canEdit ? "cursor-pointer" : "cursor-default"
                          } ${
                            sub.isCompleted
                              ? "bg-muted/10 border-border/20 text-muted-foreground line-through"
                              : "hover:bg-muted/15 border-border/10 hover:border-border/30"
                          }`}
                        >
                          <div className="shrink-0 text-muted-foreground/80">
                            {sub.isCompleted ? (
                              <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </div>
                          <span className="flex-1 font-medium">{sub.title}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center rounded-lg border border-dashed border-border/30">
                        <p className="text-[11px] text-muted-foreground italic">
                          No subtasks added yet.
                        </p>
                        {canEdit && (
                          <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                            Create subtasks above to break down this task.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer close button */}
            <div className="p-4 border-t border-border/40 bg-muted/10 flex justify-end">
              <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs font-semibold">
                Close Panel
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
