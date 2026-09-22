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
  Key,
  ExternalLink,
  Coins,
  Check,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
} from "lucide-react"

export default function NotificationSettings() {
  const { data: activeOrg, isPending: isOrgPending } =
    authClient.useActiveOrganization()
  const orgId = activeOrg?.id || ""

  const profile = useQuery(
    api.memberProfiles.getMyProfile,
    orgId ? { organizationId: orgId } : "skip"
  )
  const orgApiKeys = useQuery(
    api.notifications.getOrganizationApiKeys,
    orgId ? { organizationId: orgId } : "skip"
  )

  const updatePreferences = useMutation(api.memberProfiles.updateMyPreferences)
  const updateOrgKeys = useMutation(api.notifications.updateOrganizationApiKeys)
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

  // BYOK (Bring Your Own Key) States
  const [resendApiKeyInput, setResendApiKeyInput] = useState("")
  const [resendFromEmailInput, setResendFromEmailInput] = useState("")
  const [sentDmApiKeyInput, setSentDmApiKeyInput] = useState("")
  const [templateIds, setTemplateIds] = useState({
    task_assigned: "",
    task_status_changed: "",
    task_due_soon: "",
    task_overdue: "",
    task_comment: "",
    approval_requested: "",
    approval_status_changed: "",
    approval_comment: "",
    form_response_submitted: "",
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isSavingOrgKeys, setIsSavingOrgKeys] = useState(false)

  const TEMPLATE_CONFIGS = [
    {
      key: "task_assigned" as const,
      label: "Task Assigned",
      description: "Dispatched to users when they are assigned to a task",
      parameters: ["taskTitle", "assignerName", "dueDate"],
      recommendedCopy:
        'Ground Control: You have been assigned to "{{taskTitle}}" by {{assignerName}}. Due date: {{dueDate}}. Check your dashboard for details.',
    },
    {
      key: "task_status_changed" as const,
      label: "Task Status Changed",
      description: "Dispatched when a task's status is updated",
      parameters: ["taskTitle", "updaterName", "newStatus"],
      recommendedCopy:
        'Ground Control Task Update: "{{taskTitle}}" status changed to {{newStatus}} by {{updaterName}}. View updates in Ground Control.',
    },
    {
      key: "task_due_soon" as const,
      label: "Task Due Soon (<24h)",
      description: "Automated reminder for tasks approaching deadline",
      parameters: ["taskTitle", "dueDate"],
      recommendedCopy:
        'Ground Control Reminder: Your assigned task "{{taskTitle}}" is due soon on {{dueDate}}. Please review on your dashboard.',
    },
    {
      key: "task_overdue" as const,
      label: "Task Overdue Alert",
      description: "Automated alert for tasks past their due date",
      parameters: ["taskTitle", "dueDate"],
      recommendedCopy:
        'Ground Control URGENT: Your assigned task "{{taskTitle}}" was due on {{dueDate}} and is now overdue. Please take action immediately.',
    },
    {
      key: "task_comment" as const,
      label: "Task Comment",
      description: "Dispatched when someone comments on a task discussion",
      parameters: ["taskTitle", "authorName", "commentPreview"],
      recommendedCopy:
        'Ground Control: {{authorName}} commented on "{{taskTitle}}": "{{commentPreview}}". Reply on Ground Control.',
    },
    {
      key: "approval_requested" as const,
      label: "Approval Requested",
      description: "Dispatched to designated approvers for a new approval",
      parameters: ["approvalTitle", "requesterName", "dueDate"],
      recommendedCopy:
        'Ground Control: {{requesterName}} requested your approval for "{{approvalTitle}}". Due date: {{dueDate}}. Review and decide on Ground Control.',
    },
    {
      key: "approval_status_changed" as const,
      label: "Approval Decision Made",
      description:
        "Dispatched when an approval is approved, declined, or reworked",
      parameters: ["approvalTitle", "updaterName", "newStatus", "comment"],
      recommendedCopy:
        'Ground Control: Approval request "{{approvalTitle}}" was marked as {{newStatus}} by {{updaterName}}. Note: {{comment}}.',
    },
    {
      key: "approval_comment" as const,
      label: "Approval Comment",
      description: "Dispatched when someone comments on an approval discussion",
      parameters: ["approvalTitle", "authorName", "commentPreview"],
      recommendedCopy:
        'Ground Control: {{authorName}} commented on approval "{{approvalTitle}}": "{{commentPreview}}". View conversation on Ground Control.',
    },
    {
      key: "form_response_submitted" as const,
      label: "Form Response Submitted",
      description: "Dispatched to form creator upon new submission",
      parameters: ["formTitle", "submitterName"],
      recommendedCopy:
        'Ground Control: {{submitterName}} submitted a response for form "{{formTitle}}". Review submissions on Ground Control.',
    },
  ]

  // Test notification state
  const [testChannel, setTestChannel] = useState<string>("in_app")
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any> | null>(
    null
  )

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || "")
      setIntegrations({
        inApp:
          profile.integrations?.inApp !== undefined
            ? profile.integrations.inApp
            : true,
        push:
          profile.integrations?.push !== undefined
            ? profile.integrations.push
            : true,
        email:
          profile.integrations?.email !== undefined
            ? profile.integrations.email
            : true,
        whatsapp: profile.integrations?.whatsapp || false,
        sms: profile.integrations?.sms || false,
        rcs: profile.integrations?.rcs || false,
      })
      setEventPreferences({
        taskAssigned:
          profile.notificationPreferences?.taskAssigned !== undefined
            ? profile.notificationPreferences.taskAssigned
            : true,
        taskStatusChanged:
          profile.notificationPreferences?.taskStatusChanged !== undefined
            ? profile.notificationPreferences.taskStatusChanged
            : true,
        taskDueReminder:
          profile.notificationPreferences?.taskDueReminder !== undefined
            ? profile.notificationPreferences.taskDueReminder
            : true,
        taskComments:
          profile.notificationPreferences?.taskComments !== undefined
            ? profile.notificationPreferences.taskComments
            : true,
        approvalRequested:
          profile.notificationPreferences?.approvalRequested !== undefined
            ? profile.notificationPreferences.approvalRequested
            : true,
        approvalDecided:
          profile.notificationPreferences?.approvalDecided !== undefined
            ? profile.notificationPreferences.approvalDecided
            : true,
        approvalComments:
          profile.notificationPreferences?.approvalComments !== undefined
            ? profile.notificationPreferences.approvalComments
            : true,
        formResponses:
          profile.notificationPreferences?.formResponses !== undefined
            ? profile.notificationPreferences.formResponses
            : true,
      })
    }
  }, [profile])

  // Sync custom sender address and template IDs when orgApiKeys load
  useEffect(() => {
    if (orgApiKeys?.resendFromEmail) {
      setResendFromEmailInput(orgApiKeys.resendFromEmail)
    }
    if (orgApiKeys?.sentDmTemplateIds) {
      setTemplateIds({
        task_assigned: orgApiKeys.sentDmTemplateIds.task_assigned || "",
        task_status_changed:
          orgApiKeys.sentDmTemplateIds.task_status_changed || "",
        task_due_soon: orgApiKeys.sentDmTemplateIds.task_due_soon || "",
        task_overdue: orgApiKeys.sentDmTemplateIds.task_overdue || "",
        task_comment: orgApiKeys.sentDmTemplateIds.task_comment || "",
        approval_requested:
          orgApiKeys.sentDmTemplateIds.approval_requested || "",
        approval_status_changed:
          orgApiKeys.sentDmTemplateIds.approval_status_changed || "",
        approval_comment: orgApiKeys.sentDmTemplateIds.approval_comment || "",
        form_response_submitted:
          orgApiKeys.sentDmTemplateIds.form_response_submitted || "",
      })
    }
  }, [orgApiKeys])

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

  const handleSaveResendKeys = async () => {
    if (!orgId) return
    setIsSavingOrgKeys(true)
    try {
      await updateOrgKeys({
        organizationId: orgId,
        resendApiKey: resendApiKeyInput || undefined,
        resendFromEmail: resendFromEmailInput || undefined,
      })
      setResendApiKeyInput("")
      toast.success("Resend configuration updated successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update Resend credentials.")
    } finally {
      setIsSavingOrgKeys(false)
    }
  }

  const handleClearResendKey = async () => {
    if (!orgId) return
    setIsSavingOrgKeys(true)
    try {
      await updateOrgKeys({
        organizationId: orgId,
        clearResendKey: true,
      })
      setResendApiKeyInput("")
      toast.success(
        "Custom Resend key removed. Organization now uses platform credentials."
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to clear Resend key.")
    } finally {
      setIsSavingOrgKeys(false)
    }
  }

  const handleSaveSentDmKeys = async () => {
    if (!orgId) return
    setIsSavingOrgKeys(true)
    try {
      await updateOrgKeys({
        organizationId: orgId,
        sentDmApiKey: sentDmApiKeyInput || undefined,
      })
      setSentDmApiKeyInput("")
      toast.success("Sent.dm credentials updated successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update Sent.dm credentials.")
    } finally {
      setIsSavingOrgKeys(false)
    }
  }

  const handleClearSentDmKey = async () => {
    if (!orgId) return
    setIsSavingOrgKeys(true)
    try {
      await updateOrgKeys({
        organizationId: orgId,
        clearSentDmKey: true,
      })
      setSentDmApiKeyInput("")
      toast.success(
        "Custom Sent.dm key removed. Organization now uses platform credentials."
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to clear Sent.dm key.")
    } finally {
      setIsSavingOrgKeys(false)
    }
  }

  const handleSaveTemplateIds = async () => {
    if (!orgId) return
    setIsSavingOrgKeys(true)
    try {
      await updateOrgKeys({
        organizationId: orgId,
        sentDmTemplateIds: {
          task_assigned: templateIds.task_assigned.trim() || undefined,
          task_status_changed:
            templateIds.task_status_changed.trim() || undefined,
          task_due_soon: templateIds.task_due_soon.trim() || undefined,
          task_overdue: templateIds.task_overdue.trim() || undefined,
          task_comment: templateIds.task_comment.trim() || undefined,
          approval_requested:
            templateIds.approval_requested.trim() || undefined,
          approval_status_changed:
            templateIds.approval_status_changed.trim() || undefined,
          approval_comment: templateIds.approval_comment.trim() || undefined,
          form_response_submitted:
            templateIds.form_response_submitted.trim() || undefined,
        },
      })
      toast.success("Sent.dm Template IDs saved successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to save Sent.dm Template IDs.")
    } finally {
      setIsSavingOrgKeys(false)
    }
  }

  const handleCopyTemplate = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success("Template text copied to clipboard.")
    setTimeout(() => setCopiedKey(null), 2500)
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
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-card via-card/80 to-muted/20 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold tracking-tight">
                Notification Center
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                Multi-Channel Router
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure how and where you receive alerts for tasks, approvals,
              comments, and reminders.
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

      {/* 1. External API Keys & Provider Billing (BYOK) - Only visible to Owners & Admins */}
      {orgApiKeys?.canManage && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4 text-primary" />
                  External API Setup & Provider Billing
                </CardTitle>
                <CardDescription>
                  Choose whether to use Ground Control managed credentials or
                  Bring Your Own Keys (BYOK) for direct provider billing.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                Owner / Admin Settings
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Transparent Pricing Disclosure Banner */}
            <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4 shrink-0" />
                <span>Transparent Usage & Pricing Notice</span>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-1 text-muted-foreground md:grid-cols-2">
                <div className="space-y-1 rounded-md border border-amber-500/20 bg-background/50 p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Platform Managed Keys (Default)
                  </p>
                  <p>
                    Emails and SMS/WhatsApp messages are sent using Ground
                    Control's shared provider accounts. Standard carrier &
                    message usage rates will be added directly to your monthly
                    organization bill.
                  </p>
                </div>
                <div className="space-y-1 rounded-md border border-emerald-500/20 bg-background/50 p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Bring Your Own Key (BYOK)
                  </p>
                  <p>
                    Provide your own Resend or Sent.dm API keys to enjoy{" "}
                    <strong>0% platform markup</strong> and pay your provider
                    directly. You can also use your own verified custom sender
                    domains (e.g.{" "}
                    <span className="font-mono text-foreground">
                      alerts@yourcompany.com
                    </span>
                    ).
                  </p>
                </div>
              </div>
            </div>

            {/* Resend BYOK Card */}
            <div className="space-y-3 rounded-lg border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold">Resend Email API</p>
                    <p className="text-xs text-muted-foreground">
                      Transactional email delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {orgApiKeys.hasCustomResendKey ? (
                    <Badge
                      variant="default"
                      className="border-emerald-500/30 bg-emerald-500/15 text-[11px] text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      Custom Key Active (BYOK)
                    </Badge>
                  ) : orgApiKeys.isPlatformResendAvailable ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Platform Managed (Usage Fees Apply)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px]">
                      No Key Configured
                    </Badge>
                  )}
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Resend Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="resendApiKey" className="text-xs">
                    Resend API Key{" "}
                    {orgApiKeys.hasCustomResendKey &&
                      `(${orgApiKeys.resendApiKeyMasked})`}
                  </Label>
                  <Input
                    id="resendApiKey"
                    type="password"
                    value={resendApiKeyInput}
                    onChange={(e) => setResendApiKeyInput(e.target.value)}
                    placeholder={
                      orgApiKeys.hasCustomResendKey
                        ? "Enter new key to replace..."
                        : "re_123456789..."
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="resendFromEmail" className="text-xs">
                    Custom Sender Address / "From" Header
                  </Label>
                  <Input
                    id="resendFromEmail"
                    value={resendFromEmailInput}
                    onChange={(e) => setResendFromEmailInput(e.target.value)}
                    placeholder={
                      orgApiKeys.platformFromEmail ||
                      "Acme <notifications@acme.com>"
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Default sender fallback:{" "}
                  <span className="font-mono text-foreground">
                    {orgApiKeys.platformFromEmail}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {orgApiKeys.hasCustomResendKey && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearResendKey}
                      disabled={isSavingOrgKeys}
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Reset to Platform
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveResendKeys}
                    disabled={
                      isSavingOrgKeys ||
                      (!resendApiKeyInput &&
                        resendFromEmailInput ===
                          (orgApiKeys.resendFromEmail || ""))
                    }
                    className="h-8 text-xs"
                  >
                    {isSavingOrgKeys && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    Save Resend Config
                  </Button>
                </div>
              </div>
            </div>

            {/* Sent.dm BYOK Card */}
            <div className="space-y-3 rounded-lg border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold">Sent.dm API</p>
                    <p className="text-xs text-muted-foreground">
                      WhatsApp, SMS, and RCS multi-channel messaging
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {orgApiKeys.hasCustomSentDmKey ? (
                    <Badge
                      variant="default"
                      className="border-emerald-500/30 bg-emerald-500/15 text-[11px] text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      Custom Key Active (BYOK)
                    </Badge>
                  ) : orgApiKeys.isPlatformSentDmAvailable ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Platform Managed (Usage Fees Apply)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px]">
                      No Key Configured
                    </Badge>
                  )}
                  <a
                    href="https://sent.dm"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Sent.dm Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label htmlFor="sentDmApiKey" className="text-xs">
                  Sent.dm API Key{" "}
                  {orgApiKeys.hasCustomSentDmKey &&
                    `(${orgApiKeys.sentDmApiKeyMasked})`}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="sentDmApiKey"
                    type="password"
                    value={sentDmApiKeyInput}
                    onChange={(e) => setSentDmApiKeyInput(e.target.value)}
                    placeholder={
                      orgApiKeys.hasCustomSentDmKey
                        ? "Enter new key to replace..."
                        : "sent_123456789..."
                    }
                    className="max-w-md font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveSentDmKeys}
                    disabled={isSavingOrgKeys || !sentDmApiKeyInput}
                    className="h-8 text-xs"
                  >
                    {isSavingOrgKeys && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    Save Sent.dm Key
                  </Button>
                  {orgApiKeys.hasCustomSentDmKey && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSentDmKey}
                      disabled={isSavingOrgKeys}
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Reset to Platform
                    </Button>
                  )}
                </div>
              </div>

              {/* Sent.dm Template IDs Sub-section */}
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-500" />
                    <div>
                      <h4 className="text-xs font-semibold">
                        Sent.dm Message Templates
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Configure template IDs for WhatsApp, RCS, and SMS
                        delivery.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="h-7 gap-1 text-xs"
                  >
                    {showTemplates
                      ? "Hide Templates"
                      : "Configure Templates (9)"}
                    {showTemplates ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {showTemplates && (
                  <div className="space-y-3 border-t pt-2">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Enter the corresponding Template ID from your Sent.dm
                      console for each event. Ensure the template in Sent.dm
                      uses the exact placeholder variable names shown.
                    </p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {TEMPLATE_CONFIGS.map((tmpl) => (
                        <div
                          key={tmpl.key}
                          className="space-y-2 rounded-md border bg-card p-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="font-semibold text-foreground">
                                {tmpl.label}
                              </span>
                              <code className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                {tmpl.key}
                              </code>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopyTemplate(
                                  tmpl.key,
                                  tmpl.recommendedCopy
                                )
                              }
                              title="Copy recommended template text"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            >
                              {copiedKey === tmpl.key ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            {tmpl.description}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {tmpl.parameters.map((param) => (
                              <Badge
                                key={param}
                                variant="outline"
                                className="border-sky-200 bg-sky-50 px-1 py-0 font-mono text-[10px] text-sky-600 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
                              >
                                {`{{${param}}}`}
                              </Badge>
                            ))}
                          </div>

                          <Input
                            placeholder="tmpl_..."
                            value={templateIds[tmpl.key]}
                            onChange={(e) =>
                              setTemplateIds((prev) => ({
                                ...prev,
                                [tmpl.key]: e.target.value,
                              }))
                            }
                            className="h-7 font-mono text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveTemplateIds}
                        disabled={isSavingOrgKeys}
                        className="h-8 text-xs"
                      >
                        {isSavingOrgKeys && (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        )}
                        Save Sent.dm Template IDs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Delivery Channels Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-amber-500" />
            Delivery Channels
          </CardTitle>
          <CardDescription>
            Choose the endpoints Ground Control uses to deliver your
            notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* In-App */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-blue-500">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">In-App Feed</p>
                <p className="text-xs text-muted-foreground">
                  Reactive badge & top header menu
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.inApp}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, inApp: checked }))
              }
            />
          </div>

          {/* Mobile Push */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-purple-500/20 bg-purple-500/10 p-2 text-purple-500">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Mobile Push</p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 py-0 text-[10px]"
                  >
                    Expo Push
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instant banners on mobile app
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.push}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, push: checked }))
              }
            />
          </div>

          {/* Email (Resend) */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">Email Notifications</p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 py-0 text-[10px]"
                  >
                    {orgApiKeys?.hasCustomResendKey ? "Custom BYOK" : "Resend"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sent to{" "}
                  <span className="font-mono text-foreground">
                    {profile?.email}
                  </span>
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.email}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, email: checked }))
              }
            />
          </div>

          {/* WhatsApp (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-green-500/20 bg-green-500/10 p-2 text-green-500">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 py-0 text-[10px]"
                  >
                    {orgApiKeys?.hasCustomSentDmKey ? "Custom BYOK" : "Sent.dm"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct template messages
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.whatsapp}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, whatsapp: checked }))
              }
            />
          </div>

          {/* SMS (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-orange-500/20 bg-orange-500/10 p-2 text-orange-500">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">SMS Messages</p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 py-0 text-[10px]"
                  >
                    {orgApiKeys?.hasCustomSentDmKey ? "Custom BYOK" : "Sent.dm"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard carrier cellular text
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.sms}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, sms: checked }))
              }
            />
          </div>

          {/* RCS (SentDM) */}
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-500">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">RCS Business Messaging</p>
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 py-0 text-[10px]"
                  >
                    {orgApiKeys?.hasCustomSentDmKey ? "Custom BYOK" : "Sent.dm"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rich cards with verified sender ID
                </p>
              </div>
            </div>
            <Switch
              checked={integrations.rcs}
              onCheckedChange={(checked) =>
                setIntegrations((prev) => ({ ...prev, rcs: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Phone Contact Routing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Phone Contact Routing (Sent.dm)
          </CardTitle>
          <CardDescription>
            Specify your international mobile number to receive SMS, WhatsApp,
            and RCS notifications.
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
                className="max-w-md font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                Save Phone
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include country code with a{" "}
              <span className="font-mono">+</span> sign (e.g.{" "}
              <span className="font-mono">+14155552671</span> or{" "}
              <span className="font-mono">+919876543210</span>).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Granular Event Subscriptions Matrix */}
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
                <p className="text-sm font-medium">
                  Task Assigned / Reassigned
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive an alert when you are assigned to a task
                </p>
              </div>
              <Switch
                checked={eventPreferences.taskAssigned}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    taskAssigned: checked,
                  }))
                }
              />
            </div>

            {/* Task Status Changed */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Task Status Transitions</p>
                <p className="text-xs text-muted-foreground">
                  Alerts when tasks you participate in are marked Under Review
                  or Completed
                </p>
              </div>
              <Switch
                checked={eventPreferences.taskStatusChanged}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    taskStatusChanged: checked,
                  }))
                }
              />
            </div>

            {/* Due Date & Overdue Reminders */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Due Date & Overdue Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Automatic 24-hour advance reminder and overdue warning notices
                </p>
              </div>
              <Switch
                checked={eventPreferences.taskDueReminder}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    taskDueReminder: checked,
                  }))
                }
              />
            </div>

            {/* Task Comments */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">
                  Task Comments & Chat Messages
                </p>
                <p className="text-xs text-muted-foreground">
                  When team members comment on your tasks
                </p>
              </div>
              <Switch
                checked={eventPreferences.taskComments}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    taskComments: checked,
                  }))
                }
              />
            </div>

            {/* Approval Requests */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Approval Requests</p>
                <p className="text-xs text-muted-foreground">
                  When your sign-off or approval is requested
                </p>
              </div>
              <Switch
                checked={eventPreferences.approvalRequested}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    approvalRequested: checked,
                  }))
                }
              />
            </div>

            {/* Approval Decided */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Approval Decisions</p>
                <p className="text-xs text-muted-foreground">
                  When your requested approval is Approved, Declined, or sent
                  for Rework
                </p>
              </div>
              <Switch
                checked={eventPreferences.approvalDecided}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    approvalDecided: checked,
                  }))
                }
              />
            </div>

            {/* Approval Comments */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">
                  Approval Discussion Comments
                </p>
                <p className="text-xs text-muted-foreground">
                  Discussion and audit comments on approval requests
                </p>
              </div>
              <Switch
                checked={eventPreferences.approvalComments}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    approvalComments: checked,
                  }))
                }
              />
            </div>

            {/* Form Responses */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">Form Submissions</p>
                <p className="text-xs text-muted-foreground">
                  When responses are submitted for tasks or standalone forms
                </p>
              </div>
              <Switch
                checked={eventPreferences.formResponses}
                onCheckedChange={(checked) =>
                  setEventPreferences((prev) => ({
                    ...prev,
                    formResponses: checked,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Interactive Live Test Center */}
      <Card className="border-primary/20 bg-gradient-to-b from-card to-primary/5 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Notification Dispatcher
              </CardTitle>
              <CardDescription>
                Test your notification routing live across all configured
                channels.
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
              className="ml-auto bg-primary font-medium text-primary-foreground hover:bg-primary/90"
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
            <div className="animate-in space-y-2 rounded-lg border bg-background/80 p-4 font-mono text-xs duration-200 fade-in">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Dispatch Results Summary:
              </p>
              <div className="space-y-1 text-muted-foreground">
                {Object.entries(testResults).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-border/50 py-1 last:border-0"
                    >
                      <span className="font-semibold text-foreground uppercase">
                        {key}:
                      </span>
                      <span
                        className={
                          val.status === "success"
                            ? "font-medium text-emerald-500"
                            : val.status === "warning"
                              ? "font-medium text-amber-500"
                              : "font-medium text-rose-500"
                        }
                      >
                        {val.message}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
