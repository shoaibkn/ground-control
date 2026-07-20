"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { toast } from "sonner"
import { Loader2, Plus, Calendar as CalendarIcon } from "lucide-react"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { format } from "date-fns"

interface CreateApprovalDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function CreateApprovalDialog({ isOpen, setIsOpen }: CreateApprovalDialogProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const createApproval = useMutation(api.approvals.createApproval)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formId, setFormId] = useState<string>("none")

  // Fetch active forms
  const forms = useQuery(
    api.forms.getForms,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  if (!activeOrg) return null

  const handleToggleApprover = (userId: string) => {
    setSelectedApprovers((prev) => {
      const exists = prev.includes(userId)
      if (exists) {
        return prev.filter((id) => id !== userId)
      } else {
        // Enforce role exclusivity: remove from subscribers
        setSelectedSubscribers((s) => s.filter((id) => id !== userId))
        return [...prev, userId]
      }
    })
  }

  const handleToggleSubscriber = (userId: string) => {
    setSelectedSubscribers((prev) => {
      const exists = prev.includes(userId)
      if (exists) {
        return prev.filter((id) => id !== userId)
      } else {
        // Enforce role exclusivity: remove from approvers
        setSelectedApprovers((a) => a.filter((id) => id !== userId))
        return [...prev, userId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Approval request title is required")
      return
    }

    if (selectedApprovers.length === 0) {
      toast.error("At least one approver must be selected")
      return
    }

    setIsSubmitting(true)
    try {
      await createApproval({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? dueDate.getTime() : undefined,
        organizationId: activeOrg.id,
        approverIds: selectedApprovers,
        subscriberIds: selectedSubscribers,
        formId: formId === "none" ? undefined : (formId as any),
      })

      toast.success("Approval request created successfully")
      
      // Reset form fields
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setSelectedApprovers([])
      setSelectedSubscribers([])
      setFormId("none")

      setIsOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to create approval request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">New Approval Request</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Fill in the details to submit a new approval request to your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="approval-title" className="text-xs font-semibold text-foreground">
              Request Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="approval-title"
              placeholder="e.g. Design assets approval for Client project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="approval-desc" className="text-xs font-semibold text-foreground">
              Description
            </Label>
            <textarea
              id="approval-desc"
              placeholder="Provide a detailed description of what needs to be reviewed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="flex w-full min-h-[80px] rounded-md border border-input bg-input/20 px-3 py-2 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <Label htmlFor="approval-duedate" className="text-xs font-semibold text-foreground">
              Due Date
            </Label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="approval-duedate"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal text-xs bg-input/20 dark:bg-input/30 border-input/40",
                      !dueDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/85" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a due date (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Required Completion Form Dropdown */}
          <div className="space-y-1">
            <Label htmlFor="required-form" className="text-xs font-semibold text-foreground">
              Require Completion Form
            </Label>
            <select
              id="required-form"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              disabled={isSubmitting}
              className="text-xs border border-border/75 rounded-md px-2 py-1.5 bg-background hover:bg-muted/30 outline-none text-foreground cursor-pointer font-medium w-full h-9"
            >
              <option value="none">None (No form required)</option>
              {forms?.map((f: any) => (
                <option key={f._id} value={f._id}>{f.title}</option>
              ))}
            </select>
          </div>

          {/* Members Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Participants</Label>
            <Tabs defaultValue="approvers" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approvers" className="text-xs py-1.5 font-semibold">Approvers *</TabsTrigger>
                <TabsTrigger value="subscribers" className="text-xs py-1.5 font-semibold">Subscribers</TabsTrigger>
              </TabsList>

              <TabsContent value="approvers" className="mt-2">
                <div className="max-h-[140px] overflow-y-auto border rounded-md p-2 space-y-1 bg-input/10 dark:bg-input/20">
                  {activeOrg.members && activeOrg.members.length > 0 ? (
                    activeOrg.members.map((member: any) => {
                      const isChecked = selectedApprovers.includes(member.userId)
                      return (
                        <button
                          type="button"
                          key={member.id}
                          onClick={() => handleToggleApprover(member.userId)}
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
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
