"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "sonner"
import {
  AlarmClock,
  AlertTriangle,
  Clock,
  Shield,
  Moon,
  Sparkles,
  Loader2,
  CheckCircle2,
  Users,
  BellRing,
  Info,
  Calendar,
  Flame,
  ArrowRight,
} from "lucide-react"

const NOTICE_WINDOW_OPTIONS = [
  { value: 1, label: "1 hour before" },
  { value: 2, label: "2 hours before" },
  { value: 4, label: "4 hours before" },
  { value: 12, label: "12 hours before" },
  { value: 24, label: "24 hours (1 day) before" },
  { value: 48, label: "48 hours (2 days) before" },
  { value: 72, label: "72 hours (3 days) before" },
]

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US / Canada - New York)" },
  { value: "America/Chicago", label: "Central Time (US / Canada - Chicago)" },
  { value: "America/Denver", label: "Mountain Time (US / Canada - Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US / Canada - LA)" },
  { value: "Europe/London", label: "London / GMT (UK)" },
  { value: "Europe/Paris", label: "Central European Time (Paris / Berlin)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST - New Delhi)" },
  { value: "Asia/Singapore", label: "Singapore / Hong Kong" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
]

export default function RemindersSettings() {
  const { data: activeOrg, isPending: isOrgPending } =
    authClient.useActiveOrganization()
  const { data: activeMember, isPending: isMemberPending } =
    authClient.useActiveMember()

  const orgId = activeOrg?.id || ""
  const isOwnerOrAdmin =
    activeMember?.role === "owner" || activeMember?.role === "admin"

  const settings = useQuery(
    api.taskReminders.getOrganizationReminderSettings,
    orgId ? { organizationId: orgId } : "skip"
  )

  const updateSettings = useMutation(
    api.taskReminders.updateOrganizationReminderSettings
  )

  const [isSaving, setIsSaving] = useState(false)

  // Due Soon State
  const [dueSoonEnabled, setDueSoonEnabled] = useState(true)
  const [dueSoonNoticeHours, setDueSoonNoticeHours] = useState<number[]>([24])
  const [dueSoonAssignees, setDueSoonAssignees] = useState(true)
  const [dueSoonCreator, setDueSoonCreator] = useState(false)
  const [dueSoonCollaborators, setDueSoonCollaborators] = useState(false)
  const [dueSoonMinPriority, setDueSoonMinPriority] = useState("all")

  // Overdue State
  const [overdueEnabled, setOverdueEnabled] = useState(true)
  const [overdueGraceMinutes, setOverdueGraceMinutes] = useState(0)
  const [overdueRepeatIntervalHours, setOverdueRepeatIntervalHours] =
    useState(24)
  const [overdueMaxRepetitions, setOverdueMaxRepetitions] = useState<
    number | null
  >(null)
  const [overdueAssignees, setOverdueAssignees] = useState(true)
  const [overdueCreator, setOverdueCreator] = useState(true)
  const [overdueAdminsOnEscalation, setOverdueAdminsOnEscalation] =
    useState(true)
  const [overdueEscalationThresholdDays, setOverdueEscalationThresholdDays] =
    useState(3)

  // Quiet Hours State
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [timezone, setTimezone] = useState("UTC")
  const [quietHoursStart, setQuietHoursStart] = useState("22:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00")

  // Custom Message
  const [customReminderMessage, setCustomReminderMessage] = useState("")

  // Sync state when query returns
  useEffect(() => {
    if (settings) {
      setDueSoonEnabled(settings.dueSoonEnabled)
      setDueSoonNoticeHours(settings.dueSoonNoticeHours || [24])
      setDueSoonAssignees(settings.dueSoonRecipients?.assignees ?? true)
      setDueSoonCreator(settings.dueSoonRecipients?.creator ?? false)
      setDueSoonCollaborators(
        settings.dueSoonRecipients?.collaborators ?? false
      )
      setDueSoonMinPriority(settings.dueSoonMinPriority || "all")

      setOverdueEnabled(settings.overdueEnabled)
      setOverdueGraceMinutes(settings.overdueGraceMinutes || 0)
      setOverdueRepeatIntervalHours(
        settings.overdueRepeatIntervalHours !== undefined
          ? settings.overdueRepeatIntervalHours
          : 24
      )
      setOverdueMaxRepetitions(
        settings.overdueMaxRepetitions !== undefined
          ? settings.overdueMaxRepetitions
          : null
      )
      setOverdueAssignees(settings.overdueRecipients?.assignees ?? true)
      setOverdueCreator(settings.overdueRecipients?.creator ?? true)
      setOverdueAdminsOnEscalation(
        settings.overdueRecipients?.adminsOnEscalation ?? true
      )
      setOverdueEscalationThresholdDays(
        settings.overdueEscalationThresholdDays || 3
      )

      setQuietHoursEnabled(Boolean(settings.quietHoursEnabled))
      setTimezone(settings.timezone || "UTC")
      setQuietHoursStart(settings.quietHoursStart || "22:00")
      setQuietHoursEnd(settings.quietHoursEnd || "08:00")
      setCustomReminderMessage(settings.customReminderMessage || "")
    }
  }, [settings])

  const toggleNoticeWindow = (hours: number) => {
    if (!isOwnerOrAdmin) return
    setDueSoonNoticeHours((prev) => {
      if (prev.includes(hours)) {
        // Prevent deselecting all
        if (prev.length === 1) {
          toast.error("At least one advance notice window must remain selected.")
          return prev
        }
        return prev.filter((h) => h !== hours)
      } else {
        return [...prev, hours].sort((a, b) => a - b)
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !isOwnerOrAdmin) return

    setIsSaving(true)
    try {
      await updateSettings({
        organizationId: orgId,
        dueSoonEnabled,
        dueSoonNoticeHours,
        dueSoonRecipients: {
          assignees: dueSoonAssignees,
          creator: dueSoonCreator,
          collaborators: dueSoonCollaborators,
        },
        dueSoonMinPriority,
        overdueEnabled,
        overdueGraceMinutes,
        overdueRepeatIntervalHours,
        overdueMaxRepetitions:
          overdueMaxRepetitions !== null ? overdueMaxRepetitions : undefined,
        overdueRecipients: {
          assignees: overdueAssignees,
          creator: overdueCreator,
          adminsOnEscalation: overdueAdminsOnEscalation,
        },
        overdueEscalationThresholdDays,
        quietHoursEnabled,
        timezone,
        quietHoursStart,
        quietHoursEnd,
        customReminderMessage: customReminderMessage.trim() || undefined,
      })

      toast.success("Organization task reminder policy updated successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update reminder settings.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isOrgPending || isMemberPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info Banner */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlarmClock className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Task Reminder & Escalation Policies
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure organization-wide rules for pre-deadline notices, overdue alerts, and quiet hours.
                </CardDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                isOwnerOrAdmin
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }
            >
              {isOwnerOrAdmin
                ? "Admin Policy Editor"
                : "Read-Only (Requires Admin Role)"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: PRE-DEADLINE (DUE SOON) REMINDERS */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-500" />
                <CardTitle className="text-sm font-semibold">
                  Pre-Deadline Advance Reminders
                </CardTitle>
              </div>
              <Switch
                checked={dueSoonEnabled}
                onCheckedChange={setDueSoonEnabled}
                disabled={!isOwnerOrAdmin}
              />
            </div>
            <CardDescription className="text-xs">
              Automatically remind team members before tasks reach their scheduled deadline.
            </CardDescription>
          </CardHeader>

          {dueSoonEnabled && (
            <CardContent className="space-y-5 pt-0">
              {/* Notice Windows */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Advance Notice Windows (Select all that apply)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Ground Control dispatches a reminder at each selected milestone without duplicate alerts.
                </p>
                <ToggleGroup
                  type="multiple"
                  value={dueSoonNoticeHours.map(String)}
                  onValueChange={(vals) =>
                    setDueSoonNoticeHours(vals.map((v) => parseInt(v, 10)))
                  }
                  variant="outline"
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {NOTICE_WINDOW_OPTIONS.map((opt) => (
                    <ToggleGroupItem
                      key={opt.value}
                      value={String(opt.value)}
                      disabled={!isOwnerOrAdmin}
                      className="font-mono text-xs"
                    >
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <Separator />

              {/* Recipient Targeting */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-foreground">
                  Advance Reminder Recipients
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">Assignees</span>
                      <p className="text-[10px] text-muted-foreground">Direct task owners</p>
                    </div>
                    <Switch
                      checked={dueSoonAssignees}
                      onCheckedChange={setDueSoonAssignees}
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">Task Creator</span>
                      <p className="text-[10px] text-muted-foreground">Original author</p>
                    </div>
                    <Switch
                      checked={dueSoonCreator}
                      onCheckedChange={setDueSoonCreator}
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">Collaborators</span>
                      <p className="text-[10px] text-muted-foreground">Supporting members</p>
                    </div>
                    <Switch
                      checked={dueSoonCollaborators}
                      onCheckedChange={setDueSoonCollaborators}
                      disabled={!isOwnerOrAdmin}
                    />
                  </div>
                </div>
              </div>

              {/* Priority Filter */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueSoonPriority" className="text-xs font-semibold">
                  Minimum Priority Filter
                </Label>
                <Select
                  value={dueSoonMinPriority}
                  onValueChange={setDueSoonMinPriority}
                  disabled={!isOwnerOrAdmin}
                >
                  <SelectTrigger id="dueSoonPriority" className="w-full sm:w-72">
                    <SelectValue placeholder="Select minimum priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">
                        Remind on all tasks (Low, Medium, High, Urgent)
                      </SelectItem>
                      <SelectItem value="medium_and_above">
                        Medium & Above (Skip Low priority)
                      </SelectItem>
                      <SelectItem value="high_and_urgent">
                        High & Urgent Only
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* SECTION 2: OVERDUE ALERTS & ESCALATION */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-sm font-semibold">
                  Overdue Warnings & Escalation Cadence
                </CardTitle>
              </div>
              <Switch
                checked={overdueEnabled}
                onCheckedChange={setOverdueEnabled}
                disabled={!isOwnerOrAdmin}
              />
            </div>
            <CardDescription className="text-xs">
              Automate repeat notifications and administrative escalations when tasks pass their due date.
            </CardDescription>
          </CardHeader>

          {overdueEnabled && (
            <CardContent className="flex flex-col gap-5 pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Grace Period */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="graceMinutes" className="text-xs font-semibold">
                    Grace Period Before First Alert
                  </Label>
                  <Select
                    value={String(overdueGraceMinutes)}
                    onValueChange={(v) => setOverdueGraceMinutes(parseInt(v, 10))}
                    disabled={!isOwnerOrAdmin}
                  >
                    <SelectTrigger id="graceMinutes" className="w-full">
                      <SelectValue placeholder="Select grace period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="0">Immediately (0 minutes after due date)</SelectItem>
                        <SelectItem value="15">15 minutes grace</SelectItem>
                        <SelectItem value="30">30 minutes grace</SelectItem>
                        <SelectItem value="60">1 hour grace</SelectItem>
                        <SelectItem value="120">2 hours grace</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repeat Cadence */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="repeatInterval" className="text-xs font-semibold">
                    Repeat Cadence
                  </Label>
                  <Select
                    value={String(overdueRepeatIntervalHours)}
                    onValueChange={(v) =>
                      setOverdueRepeatIntervalHours(parseInt(v, 10))
                    }
                    disabled={!isOwnerOrAdmin}
                  >
                    <SelectTrigger id="repeatInterval" className="w-full">
                      <SelectValue placeholder="Select repeat cadence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="0">Once only (Do not repeat)</SelectItem>
                        <SelectItem value="6">Every 6 hours</SelectItem>
                        <SelectItem value="12">Every 12 hours</SelectItem>
                        <SelectItem value="24">Daily (Every 24 hours - Recommended)</SelectItem>
                        <SelectItem value="48">Every 2 days (48 hours)</SelectItem>
                        <SelectItem value="168">Weekly (Every 7 days)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Repetition Limit */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxRepetitions" className="text-xs font-semibold">
                  Maximum Repeat Limit
                </Label>
                <Select
                  value={
                    overdueMaxRepetitions === null
                      ? "unlimited"
                      : String(overdueMaxRepetitions)
                  }
                  onValueChange={(v) =>
                    setOverdueMaxRepetitions(
                      v === "unlimited" ? null : parseInt(v, 10)
                    )
                  }
                  disabled={!isOwnerOrAdmin}
                >
                  <SelectTrigger id="maxRepetitions" className="w-full sm:w-72">
                    <SelectValue placeholder="Select repeat limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="unlimited">Repeat indefinitely until task resolves</SelectItem>
                      <SelectItem value="1">Stop after 1 repeat (2 total notices)</SelectItem>
                      <SelectItem value="3">Stop after 3 repeats (4 total notices)</SelectItem>
                      <SelectItem value="5">Stop after 5 repeats (6 total notices)</SelectItem>
                      <SelectItem value="10">Stop after 10 repeats</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Admin Escalation */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="size-3.5 text-amber-500" />
                      Escalate to Workspace Admins & Owners
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Send urgent escalation notifications to organization administrators if a task remains unresolved.
                    </p>
                  </div>
                  <Switch
                    checked={overdueAdminsOnEscalation}
                    onCheckedChange={setOverdueAdminsOnEscalation}
                    disabled={!isOwnerOrAdmin}
                  />
                </div>

                {overdueAdminsOnEscalation && (
                  <div className="flex items-center gap-3 pl-1">
                    <Label htmlFor="escalationDays" className="text-xs text-muted-foreground whitespace-nowrap">
                      Escalate after:
                    </Label>
                    <Select
                      value={String(overdueEscalationThresholdDays)}
                      onValueChange={(v) =>
                        setOverdueEscalationThresholdDays(parseInt(v, 10))
                      }
                      disabled={!isOwnerOrAdmin}
                    >
                      <SelectTrigger id="escalationDays" className="w-48">
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="1">1 day overdue</SelectItem>
                          <SelectItem value="2">2 days overdue</SelectItem>
                          <SelectItem value="3">3 days overdue (Default)</SelectItem>
                          <SelectItem value="5">5 days overdue</SelectItem>
                          <SelectItem value="7">7 days (1 week) overdue</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* SECTION 3: QUIET HOURS & TIMEZONE */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="size-4 text-violet-500" />
                <CardTitle className="text-sm font-semibold">
                  Quiet Hours & Delivery Window
                </CardTitle>
              </div>
              <Switch
                checked={quietHoursEnabled}
                onCheckedChange={setQuietHoursEnabled}
                disabled={!isOwnerOrAdmin}
              />
            </div>
            <CardDescription className="text-xs">
              Suppress external Push, WhatsApp, and SMS alerts during night hours based on your organization timezone.
            </CardDescription>
          </CardHeader>

          {quietHoursEnabled && (
            <CardContent className="flex flex-col gap-4 pt-0">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone" className="text-xs font-semibold">
                  Organization Timezone
                </Label>
                <Select
                  value={timezone}
                  onValueChange={setTimezone}
                  disabled={!isOwnerOrAdmin}
                >
                  <SelectTrigger id="timezone" className="w-full sm:w-96">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:w-72">
                <div className="space-y-1">
                  <Label htmlFor="quietStart" className="text-xs">
                    Start Quiet (Sleep)
                  </Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quietEnd" className="text-xs">
                    End Quiet (Wake)
                  </Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* SECTION 4: CUSTOM REMINDER NOTE */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Organization Reminder Policy Note
            </CardTitle>
            <CardDescription className="text-xs">
              Optional message or company policy appended to automated reminder notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={customReminderMessage}
              onChange={(e) => setCustomReminderMessage(e.target.value)}
              placeholder="e.g. Flight Deck rule: All tasks must be logged prior to end-of-shift."
              disabled={!isOwnerOrAdmin}
              className="text-xs"
            />
          </CardContent>
        </Card>

        {/* SECTION 5: LIVE OPERATIONAL POLICY SUMMARY */}
        <Card className="border-border bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Active Policy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-muted-foreground flex flex-col gap-1">
            <p>
              • <strong>Advance notices:</strong>{" "}
              {dueSoonEnabled
                ? `Dispatched at ${dueSoonNoticeHours.map((h) => `${h}h`).join(", ")} before deadline for ${dueSoonMinPriority === "all" ? "all priorities" : dueSoonMinPriority.replace("_", " ")}.`
                : "Disabled."}
            </p>
            <p>
              • <strong>Overdue notices:</strong>{" "}
              {overdueEnabled
                ? `Dispatched after ${overdueGraceMinutes}m grace, repeated ${overdueRepeatIntervalHours === 0 ? "once only" : `every ${overdueRepeatIntervalHours}h`}${overdueMaxRepetitions ? ` (up to ${overdueMaxRepetitions} times)` : ""}.${overdueAdminsOnEscalation ? ` Escalates to admins after ${overdueEscalationThresholdDays} days.` : ""}`
                : "Disabled."}
            </p>
            <p>
              • <strong>Quiet hours:</strong>{" "}
              {quietHoursEnabled
                ? `Active from ${quietHoursStart} to ${quietHoursEnd} (${timezone}).`
                : "Inactive (alerts deliver 24/7)."}
            </p>
          </CardContent>
        </Card>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-between pt-2">
          {!isOwnerOrAdmin && (
            <span className="text-xs text-destructive">
              Only organization owners and administrators have permission to save reminder policies.
            </span>
          )}

          <div className="ml-auto">
            <Button
              type="submit"
              disabled={isSaving || !isOwnerOrAdmin}
              className="min-w-32 font-semibold"
            >
              {isSaving && <Spinner data-icon="inline-start" />}
              {isSaving ? "Saving Policy..." : "Save Reminder Policy"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
