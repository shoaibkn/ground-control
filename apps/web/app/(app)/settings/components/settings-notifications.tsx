"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
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
import { toast } from "sonner"
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Radio,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react"

export default function NotificationSettings() {
  const { data: activeOrg, isPending: isOrgPending } = authClient.useActiveOrganization()
  const orgId = activeOrg?.id || ""

  const profile = useQuery(
    api.memberProfiles.getMyProfile,
    orgId ? { organizationId: orgId } : "skip"
  )
  const updatePreferences = useMutation(api.memberProfiles.updateMyPreferences)
  const triggerTestAction = useAction(api.notifications.sendTestNotification)

  const [isSaving, setIsSaving] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  // Delivery Channel Integrations
  const [integrations, setIntegrations] = useState({
    inApp: true,
    push: true,
    email: true,
    whatsapp: false,
    sms: false,
    rcs: false,
  })

  // Granular Event Subscriptions
  const [eventPreferences, setEventPreferences] = useState({
    taskAssigned: true,
    taskStatusChanged: true,
    taskDueReminder: true,
    taskComments: true,
    approvalRequested: true,
    approvalDecided: true,
    approvalComments: true,
    formResponses: true,
  })

  // Test notification state
  const [testChannel, setTestChannel] = useState<string>("in_app")
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any> | null>(null)

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || "")
      setIntegrations({
        inApp: profile.integrations?.inApp !== undefined ? profile.integrations.inApp : true,
        push: profile.integrations?.push !== undefined ? profile.integrations.push : true,
        email: profile.integrations?.email !== undefined ? profile.integrations.email : true,
        whatsapp: profile.integrations?.whatsapp || false,
        sms: profile.integrations?.sms || false,
        rcs: profile.integrations?.rcs || false,
      })
      setEventPreferences({
        taskAssigned: profile.notificationPreferences?.taskAssigned !== undefined ? profile.notificationPreferences.taskAssigned : true,
        taskStatusChanged: profile.notificationPreferences?.taskStatusChanged !== undefined ? profile.notificationPreferences.taskStatusChanged : true,
        taskDueReminder: profile.notificationPreferences?.taskDueReminder !== undefined ? profile.notificationPreferences.taskDueReminder : true,
        taskComments: profile.notificationPreferences?.taskComments !== undefined ? profile.notificationPreferences.taskComments : true,
        approvalRequested: profile.notificationPreferences?.approvalRequested !== undefined ? profile.notificationPreferences.approvalRequested : true,
        approvalDecided: profile.notificationPreferences?.approvalDecided !== undefined ? profile.notificationPreferences.approvalDecided : true,
        approvalComments: profile.notificationPreferences?.approvalComments !== undefined ? profile.notificationPreferences.approvalComments : true,
        formResponses: profile.notificationPreferences?.formResponses !== undefined ? profile.notificationPreferences.formResponses : true,
      })
    }
  }, [profile])

  const handleSavePreferences = async () => {
    if (!orgId) return
    setIsSaving(true)
    try {
      await updatePreferences({
        organizationId: orgId,
        phoneNumber,
        integrations,
        notificationPreferences: eventPreferences,
      })
      toast.success("Notification preferences saved successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunTest = async () => {
    if (!orgId) {
      toast.error("No active organization found.")
      return
    }

    setIsTesting(true)
    setTestResults(null)

    try {
      const response = await triggerTestAction({
        organizationId: orgId,
        channel: testChannel,
      })

      setTestResults(response.results)
      toast.success("Test notification dispatched!")
    } catch (err: any) {
      toast.error(err.message || "Test dispatch failed.")
    } finally {
      setIsTesting(false)
    }
  }

  if (isOrgPending || profile === undefined) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-card via-card/80 to-muted/20 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold tracking-tight">Notification Center</h3>
              <Badge variant="outline" className="text-xs font-mono">
                Multi-Channel Router
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure how and where you receive alerts for tasks, approvals, comments, and reminders.
            </p>
          </div>
          <Button
            onClick={handleSavePreferences}
            disabled={isSaving}
            size="sm"
            className="shadow-sm"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </div>

      {/* 1. Delivery Channels Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Delivery Channels
          </CardTitle>
          <CardDescription>
            Choose the endpoints Ground Control uses to deliver real-time notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* In-App */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">In-App Feed</p>
                <p className="text-xs text-muted-foreground">Reactive badge & top header menu</p>
              </div>
            </div>
            <Switch
              checked={integrations.inApp}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, inApp: checked }))}
            />
          </div>

          {/* Mobile Push */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Mobile Push</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Expo Push
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Instant banners on mobile app</p>
              </div>
            </div>
            <Switch
              checked={integrations.push}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, push: checked }))}
            />
          </div>

          {/* Email (Resend) */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Email Notifications</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Resend
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sent to <span className="font-mono text-foreground">{profile?.email}</span>
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.email}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, email: checked }))}
            />
          </div>

          {/* WhatsApp (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10 text-green-500 border border-green-500/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Sent.dm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Direct template messages</p>
              </div>
            </div>
            <Switch
              checked={integrations.whatsapp}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, whatsapp: checked }))}
            />
          </div>

          {/* SMS (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">SMS Messages</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Sent.dm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Standard carrier cellular text</p>
              </div>
            </div>
            <Switch
              checked={integrations.sms}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, sms: checked }))}
            />
          </div>

          {/* RCS (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">RCS Business Messaging</p>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    Sent.dm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Rich cards with verified sender ID</p>
              </div>
            </div>
            <Switch
              checked={integrations.rcs}
              onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, rcs: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Phone Contact Routing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Phone Contact Routing (Sent.dm)
          </CardTitle>
          <CardDescription>
            Specify your international mobile number to receive SMS, WhatsApp, and RCS notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile Phone Number (E.164 format)</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="font-mono text-sm max-w-md"
              />
              <Button variant="outline" size="sm" onClick={handleSavePreferences} disabled={isSaving}>
                Save Phone
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include country code with a <span className="font-mono">+</span> sign (e.g. <span className="font-mono">+14155552671</span> or <span className="font-mono">+919876543210</span>).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Granular Event Subscriptions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Subscriptions</CardTitle>
          <CardDescription>
            Fine-tune which workflow actions generate notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border rounded-lg border">
            {/* Task Assigned */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Task Assigned / Reassigned</p>
                <p className="text-xs text-muted-foreground">Receive an alert when you are assigned to a task</p>
              </div>
              <Switch
                checked={eventPreferences.taskAssigned}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, taskAssigned: checked }))}
              />
            </div>

            {/* Task Status Changed */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Task Status Transitions</p>
                <p className="text-xs text-muted-foreground">Alerts when tasks you participate in are marked Under Review or Completed</p>
              </div>
              <Switch
                checked={eventPreferences.taskStatusChanged}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, taskStatusChanged: checked }))}
              />
            </div>

            {/* Due Date & Overdue Reminders */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Due Date & Overdue Alerts</p>
                <p className="text-xs text-muted-foreground">Automatic 24-hour advance reminder and overdue warning notices</p>
              </div>
              <Switch
                checked={eventPreferences.taskDueReminder}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, taskDueReminder: checked }))}
              />
            </div>

            {/* Task Comments */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Task Comments & Chat Messages</p>
                <p className="text-xs text-muted-foreground">When team members comment on your tasks</p>
              </div>
              <Switch
                checked={eventPreferences.taskComments}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, taskComments: checked }))}
              />
            </div>

            {/* Approval Requests */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Approval Requests</p>
                <p className="text-xs text-muted-foreground">When your sign-off or approval is requested</p>
              </div>
              <Switch
                checked={eventPreferences.approvalRequested}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, approvalRequested: checked }))}
              />
            </div>

            {/* Approval Decided */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Approval Decisions</p>
                <p className="text-xs text-muted-foreground">When your requested approval is Approved, Declined, or sent for Rework</p>
              </div>
              <Switch
                checked={eventPreferences.approvalDecided}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, approvalDecided: checked }))}
              />
            </div>

            {/* Approval Comments */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Approval Discussion Comments</p>
                <p className="text-xs text-muted-foreground">Discussion and audit comments on approval requests</p>
              </div>
              <Switch
                checked={eventPreferences.approvalComments}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, approvalComments: checked }))}
              />
            </div>

            {/* Form Responses */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Form Submissions</p>
                <p className="text-xs text-muted-foreground">When responses are submitted for tasks or standalone forms</p>
              </div>
              <Switch
                checked={eventPreferences.formResponses}
                onCheckedChange={(checked) => setEventPreferences((prev) => ({ ...prev, formResponses: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Interactive Live Test Center */}
      <Card className="border-primary/20 bg-gradient-to-b from-card to-primary/5 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Notification Dispatcher
              </CardTitle>
              <CardDescription>
                Test your notification routing live across all configured channels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={testChannel === "in_app" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("in_app")}
            >
              In-App Feed
            </Button>
            <Button
              type="button"
              variant={testChannel === "push" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("push")}
            >
              Mobile Push
            </Button>
            <Button
              type="button"
              variant={testChannel === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("email")}
            >
              Email (Resend)
            </Button>
            <Button
              type="button"
              variant={testChannel === "whatsapp" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("whatsapp")}
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              variant={testChannel === "sms" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("sms")}
            >
              SMS
            </Button>
            <Button
              type="button"
              variant={testChannel === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestChannel("all")}
            >
              All Channels
            </Button>

            <Button
              onClick={handleRunTest}
              disabled={isTesting}
              size="sm"
              className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Notification
                </>
              )}
            </Button>
          </div>

          {/* Test Results Output */}
          {testResults && (
            <div className="rounded-lg border bg-background/80 p-4 space-y-2 text-xs font-mono animate-in fade-in duration-200">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Dispatch Results Summary:
              </p>
              <div className="space-y-1 text-muted-foreground">
                {Object.entries(testResults).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between border-b border-border/50 py-1 last:border-0">
                    <span className="uppercase text-foreground font-semibold">{key}:</span>
                    <span
                      className={
                        val.status === "success"
                          ? "text-emerald-500 font-medium"
                          : val.status === "warning"
                          ? "text-amber-500 font-medium"
                          : "text-rose-500 font-medium"
                      }
                    >
                      {val.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
