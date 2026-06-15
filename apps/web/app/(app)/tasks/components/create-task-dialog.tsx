"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { toast } from "sonner"
import { Loader2, Plus, Calendar, AlertTriangle } from "lucide-react"
import { getAvatarUrl } from "@workspace/ui/lib/utils"

interface CreateTaskDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function CreateTaskDialog({ isOpen, setIsOpen }: CreateTaskDialogProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const createTask = useMutation(api.tasks.createTask)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<string>("5")
  const [dueDateStr, setDueDateStr] = useState("")
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([])
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!activeOrg) return null

  const handleToggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) => {
      const exists = prev.includes(memberId)
      if (exists) {
        return prev.filter((id) => id !== memberId)
      } else {
        // Enforce role exclusivity: remove from collaborators and subscribers
        setSelectedCollaborators((c) => c.filter((id) => id !== memberId))
        setSelectedSubscribers((s) => s.filter((id) => id !== memberId))
        return [...prev, memberId]
      }
    })
  }

  const handleToggleCollaborator = (memberId: string) => {
    setSelectedCollaborators((prev) => {
      const exists = prev.includes(memberId)
      if (exists) {
        return prev.filter((id) => id !== memberId)
      } else {
        // Enforce role exclusivity: remove from assignees and subscribers
        setSelectedAssignees((a) => a.filter((id) => id !== memberId))
        setSelectedSubscribers((s) => s.filter((id) => id !== memberId))
        return [...prev, memberId]
      }
    })
  }

  const handleToggleSubscriber = (memberId: string) => {
    setSelectedSubscribers((prev) => {
      const exists = prev.includes(memberId)
      if (exists) {
        return prev.filter((id) => id !== memberId)
      } else {
        // Enforce role exclusivity: remove from assignees and collaborators
        setSelectedAssignees((a) => a.filter((id) => id !== memberId))
        setSelectedCollaborators((c) => c.filter((id) => id !== memberId))
        return [...prev, memberId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }

    setIsSubmitting(true)
    try {
      const parsedDueDate = dueDateStr ? new Date(dueDateStr).getTime() : undefined

      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: parsedDueDate,
        organizationId: activeOrg.id,
        assigneeIds: selectedAssignees,
        collaboratorIds: selectedCollaborators,
        subscriberIds: selectedSubscribers,
      })

      toast.success("Task created successfully")
      
      // Reset form fields
      setTitle("")
      setDescription("")
      setPriority("5")
      setDueDateStr("")
      setSelectedAssignees([])
      setSelectedCollaborators([])
      setSelectedSubscribers([])
      setIsOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to create task")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Fill in the details to add a new task to your organization dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="task-title" className="text-xs font-semibold text-foreground">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g. Implement user dashboard widgets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="task-desc" className="text-xs font-semibold text-foreground">
              Description
            </Label>
            <textarea
              id="task-desc"
              placeholder="Provide a detailed description of the task requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="flex w-full min-h-[80px] rounded-md border border-input bg-input/20 px-3 py-2 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1">
              <Label htmlFor="task-priority" className="text-xs font-semibold text-foreground">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={isSubmitting}
              >
                <SelectTrigger id="task-priority" className="w-full h-9 bg-input/20 dark:bg-input/30">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((val) => (
                    <SelectItem key={val} value={val}>
                      {val} - {val === "1" ? "Lowest" : val === "10" ? "Highest" : `Level ${val}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <Label htmlFor="task-duedate" className="text-xs font-semibold text-foreground">
                Due Date
              </Label>
              <div className="relative">
                <Input
                  id="task-duedate"
                  type="date"
                  value={dueDateStr}
                  onChange={(e) => setDueDateStr(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 pr-8 text-xs bg-input/20 dark:bg-input/30"
                />
              </div>
            </div>
          </div>

          {/* Members Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Members & Roles</Label>
            <Tabs defaultValue="assignees" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assignees" className="text-xs py-1.5">Assignees</TabsTrigger>
                <TabsTrigger value="collaborators" className="text-xs py-1.5">Collaborators</TabsTrigger>
                <TabsTrigger value="subscribers" className="text-xs py-1.5">Subscribers</TabsTrigger>
              </TabsList>

              <TabsContent value="assignees" className="mt-2">
                <div className="max-h-[140px] overflow-y-auto border rounded-md p-2 space-y-1 bg-input/10 dark:bg-input/20">
                  {activeOrg.members && activeOrg.members.length > 0 ? (
                    activeOrg.members.map((member: any) => {
                      const isChecked = selectedAssignees.includes(member.userId)
                      return (
                        <button
                          type="button"
                          key={member.id}
                          onClick={() => handleToggleAssignee(member.userId)}
                          disabled={isSubmitting}
                          className={`flex items-center justify-between w-full p-1.5 rounded-md text-left transition-colors text-xs ${
                            isChecked
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-accent border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                              <AvatarFallback className="text-[10px]">
                                {member.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{member.user?.name}</span>
                              <span className="text-[9px] text-muted-foreground">{member.user?.email}</span>
                            </div>
                          </div>
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            }`}
                          >
                            {isChecked && (
                              <svg className="h-3 w-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No members found.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="collaborators" className="mt-2">
                <div className="max-h-[140px] overflow-y-auto border rounded-md p-2 space-y-1 bg-input/10 dark:bg-input/20">
                  {activeOrg.members && activeOrg.members.length > 0 ? (
                    activeOrg.members.map((member: any) => {
                      const isChecked = selectedCollaborators.includes(member.userId)
                      return (
                        <button
                          type="button"
                          key={member.id}
                          onClick={() => handleToggleCollaborator(member.userId)}
                          disabled={isSubmitting}
                          className={`flex items-center justify-between w-full p-1.5 rounded-md text-left transition-colors text-xs ${
                            isChecked
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-accent border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                              <AvatarFallback className="text-[10px]">
                                {member.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{member.user?.name}</span>
                              <span className="text-[9px] text-muted-foreground">{member.user?.email}</span>
                            </div>
                          </div>
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            }`}
                          >
                            {isChecked && (
                              <svg className="h-3 w-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No members found.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="subscribers" className="mt-2">
                <div className="max-h-[140px] overflow-y-auto border rounded-md p-2 space-y-1 bg-input/10 dark:bg-input/20">
                  {activeOrg.members && activeOrg.members.length > 0 ? (
                    activeOrg.members.map((member: any) => {
                      const isChecked = selectedSubscribers.includes(member.userId)
                      return (
                        <button
                          type="button"
                          key={member.id}
                          onClick={() => handleToggleSubscriber(member.userId)}
                          disabled={isSubmitting}
                          className={`flex items-center justify-between w-full p-1.5 rounded-md text-left transition-colors text-xs ${
                            isChecked
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-accent border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={getAvatarUrl(member.user?.image, member.user?.name)} />
                              <AvatarFallback className="text-[10px]">
                                {member.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{member.user?.name}</span>
                              <span className="text-[9px] text-muted-foreground">{member.user?.email}</span>
                            </div>
                          </div>
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                            }`}
                          >
                            {isChecked && (
                              <svg className="h-3 w-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No members found.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-9 text-xs">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
