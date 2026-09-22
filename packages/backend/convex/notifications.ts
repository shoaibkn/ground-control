import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
  action,
} from "./_generated/server"
import { v } from "convex/values"
import { components, internal } from "./_generated/api"
import { Resend } from "@convex-dev/resend"
import { PushNotifications } from "@convex-dev/expo-push-notifications"
import { render } from "@react-email/render"
import { NotificationEmail } from "./emails/NotificationEmail"
import SentDm from "@sentdm/sentdm"
import { authComponent } from "./auth"

const emailFrom =
  process.env.EMAIL_FROM || "Ground Control <onboarding@resend.dev>"
const siteUrl = process.env.SITE_URL || "http://localhost:3000"

export const pushNotifications = new PushNotifications<string>(
  components.pushNotifications
)

async function requireAuth(ctx: any) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

async function requireMember(ctx: any, userId: string, organizationId: string) {
  const memberResult = (await ctx.runQuery(
    components.betterAuth.adapter.findMany,
    {
      model: "member",
      where: [
        { field: "userId", value: userId },
        { field: "organizationId", value: organizationId },
      ],
      paginationOpts: { numItems: 1, cursor: null },
    }
  )) as any

  const member = memberResult?.page?.[0]
  if (!member) {
    throw new Error("User is not a member of this organization")
  }
  return member
}

// ---------------------------------------------------------------------------
// Push Notification Token Registration (Mobile)
// ---------------------------------------------------------------------------

export const registerPushToken = mutation({
  args: {
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await pushNotifications.recordToken(ctx, {
      userId: user._id,
      pushToken: args.pushToken,
    })
    return { success: true }
  },
})

export const unregisterPushToken = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    await pushNotifications.removeToken(ctx, {
      userId: user._id,
    })
    return { success: true }
  },
})

// ---------------------------------------------------------------------------
// In-App Notifications Queries & Mutations
// ---------------------------------------------------------------------------

export const getUserNotifications = query({
  args: {
    organizationId: v.string(),
    unreadOnly: v.optional(v.boolean()),
    category: v.optional(v.string()), // "all" | "tasks" | "approvals" | "comments" | "system"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const limit = args.limit || 50

    let queryBuilder = ctx.db
      .query("notifications")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user._id).eq("organizationId", args.organizationId)
      )
      .order("desc")

    const notifications = await queryBuilder.take(limit)

    let filtered = notifications

    if (args.unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead)
    }

    if (args.category && args.category !== "all") {
      filtered = filtered.filter((n) => {
        if (args.category === "tasks")
          return n.entityType === "task" || n.type.startsWith("task_")
        if (args.category === "approvals")
          return n.entityType === "approval" || n.type.startsWith("approval_")
        if (args.category === "comments")
          return n.type.includes("comment") || n.type.includes("chat")
        if (args.category === "system") return n.type === "system"
        return true
      })
    }

    return filtered
  },
})

export const getUnreadCount = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q) =>
        q
          .eq("userId", user._id)
          .eq("organizationId", args.organizationId)
          .eq("isRead", false)
      )
      .collect()

    return unread.length
  },
})

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found")
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    })

    return { success: true }
  },
})

export const markAllNotificationsRead = mutation({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q) =>
        q
          .eq("userId", user._id)
          .eq("organizationId", args.organizationId)
          .eq("isRead", false)
      )
      .collect()

    const now = Date.now()
    for (const notif of unread) {
      await ctx.db.patch(notif._id, {
        isRead: true,
        readAt: now,
      })
    }

    return { count: unread.length }
  },
})

export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found")
    }

    await ctx.db.delete(args.notificationId)
    return { success: true }
  },
})

export const clearAllReadNotifications = mutation({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const readList = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q) =>
        q
          .eq("userId", user._id)
          .eq("organizationId", args.organizationId)
          .eq("isRead", true)
      )
      .collect()

    for (const notif of readList) {
      await ctx.db.delete(notif._id)
    }

    return { count: readList.length }
  },
})

// ---------------------------------------------------------------------------
// Organization BYOK API Key Management (Resend & Sent.dm)
// ---------------------------------------------------------------------------

export const getOrganizationApiKeys = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error("Unauthorized")
    }

    const member = await requireMember(ctx, user._id, args.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    const keysRecord = await ctx.db
      .query("organizationApiKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()

    const maskKey = (key?: string) => {
      if (!key) return null
      if (key.length <= 8) return "••••••••"
      return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
    }

    return {
      canManage: isAdminOrOwner,
      hasCustomResendKey: Boolean(keysRecord?.resendApiKey),
      resendApiKeyMasked: maskKey(keysRecord?.resendApiKey),
      resendFromEmail: keysRecord?.resendFromEmail || null,
      hasCustomSentDmKey: Boolean(keysRecord?.sentDmApiKey),
      sentDmApiKeyMasked: maskKey(keysRecord?.sentDmApiKey),
      sentDmTemplateIds: keysRecord?.sentDmTemplateIds || null,
      isPlatformResendAvailable: Boolean(process.env.RESEND_API_KEY),
      isPlatformSentDmAvailable: Boolean(process.env.SENT_DM_API_KEY),
      platformFromEmail: emailFrom,
      updatedAt: keysRecord?.updatedAt || null,
    }
  },
})

export const updateOrganizationApiKeys = mutation({
  args: {
    organizationId: v.string(),
    resendApiKey: v.optional(v.string()),
    clearResendKey: v.optional(v.boolean()),
    resendFromEmail: v.optional(v.string()),
    sentDmApiKey: v.optional(v.string()),
    clearSentDmKey: v.optional(v.boolean()),
    sentDmTemplateIds: v.optional(
      v.object({
        task_assigned: v.optional(v.string()),
        task_status_changed: v.optional(v.string()),
        task_overdue: v.optional(v.string()),
        task_due_soon: v.optional(v.string()),
        task_comment: v.optional(v.string()),
        approval_requested: v.optional(v.string()),
        approval_status_changed: v.optional(v.string()),
        approval_comment: v.optional(v.string()),
        form_response_submitted: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error("Unauthorized")
    }

    const member = await requireMember(ctx, user._id, args.organizationId)
    if (member.role !== "admin" && member.role !== "owner") {
      throw new Error(
        "Only organization owners and administrators can configure API keys"
      )
    }

    const existing = await ctx.db
      .query("organizationApiKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()

    const now = Date.now()

    let newResendApiKey = existing?.resendApiKey
    if (args.clearResendKey) {
      newResendApiKey = undefined
    } else if (
      args.resendApiKey !== undefined &&
      args.resendApiKey.trim() !== ""
    ) {
      newResendApiKey = args.resendApiKey.trim()
    }

    let newSentDmApiKey = existing?.sentDmApiKey
    if (args.clearSentDmKey) {
      newSentDmApiKey = undefined
    } else if (
      args.sentDmApiKey !== undefined &&
      args.sentDmApiKey.trim() !== ""
    ) {
      newSentDmApiKey = args.sentDmApiKey.trim()
    }

    const updateData = {
      organizationId: args.organizationId,
      resendApiKey: newResendApiKey,
      resendFromEmail:
        args.resendFromEmail !== undefined
          ? args.resendFromEmail.trim() || undefined
          : existing?.resendFromEmail,
      sentDmApiKey: newSentDmApiKey,
      sentDmTemplateIds:
        args.sentDmTemplateIds !== undefined
          ? args.sentDmTemplateIds
          : existing?.sentDmTemplateIds,
      updatedAt: now,
      updatedBy: user._id,
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData)
    } else {
      await ctx.db.insert("organizationApiKeys", updateData)
    }

    return { success: true }
  },
})

export const getOrganizationApiKeysInternal = internalQuery({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizationApiKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first()
  },
})

// ---------------------------------------------------------------------------
// Internal Dispatchers & Actions
// ---------------------------------------------------------------------------

export const getUserProfileForNotification = internalQuery({
  args: {
    userId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "_id", value: args.userId }],
    })) as any

    if (!user) return null

    const profile = await ctx.db
      .query("memberProfiles")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.userId))
      .first()

    return {
      email: user.email,
      name: user.name,
      phoneNumber: profile?.phoneNumber,
      integrations: profile?.integrations ?? {
        email: true,
        sms: false,
        rcs: false,
        whatsapp: false,
        push: true,
        inApp: true,
      },
      notificationPreferences: profile?.notificationPreferences ?? {
        taskAssigned: true,
        taskStatusChanged: true,
        taskDueReminder: true,
        taskComments: true,
        approvalRequested: true,
        approvalDecided: true,
        approvalComments: true,
        formResponses: true,
      },
    }
  },
})

export const insertInAppNotification = internalMutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    actorId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    channelSent: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      organizationId: args.organizationId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      isRead: false,
      actorId: args.actorId,
      entityId: args.entityId,
      entityType: args.entityType,
      channelSent: args.channelSent,
      createdAt: Date.now(),
    })
  },
})

export const sendPushNotificationMutation = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      await pushNotifications.sendPushNotification(ctx, {
        userId: args.userId,
        notification: {
          title: args.title,
          body: args.body,
          data: args.data,
        },
        allowUnregisteredTokens: true,
      })
    } catch (e) {
      console.warn(
        `[Push Warning] Failed to send push notification to ${args.userId}:`,
        e
      )
    }
  },
})

export const sendEmailAction = internalAction({
  args: {
    email: v.string(),
    templateName: v.string(),
    parameters: v.any(),
    subject: v.string(),
    previewText: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.string(),
    actionLabel: v.string(),
    resendApiKey: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = args.resendApiKey
      ? new Resend(components.resend, {
          apiKey: args.resendApiKey,
          testMode: false,
        })
      : new Resend(components.resend, { testMode: false })

    const from =
      args.fromEmail && args.fromEmail.trim() !== ""
        ? args.fromEmail.trim()
        : emailFrom

    const html = await render(
      NotificationEmail({
        previewText: args.previewText,
        title: args.title,
        message: args.message,
        actionUrl: args.actionUrl,
        actionLabel: args.actionLabel,
      })
    )

    await resend.sendEmail(ctx as any, {
      from,
      to: args.email,
      subject: args.subject,
      html,
    })
  },
})

export const sendNotification = internalAction({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    templateName: v.string(),
    parameters: v.any(),
    actorId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get the user profile and preferences
    const profile = await ctx.runQuery(
      internal.notifications.getUserProfileForNotification,
      {
        userId: args.userId,
        organizationId: args.organizationId,
      }
    )

    if (!profile) {
      console.warn(
        `No profile found for user ${args.userId} in organization ${args.organizationId}`
      )
      return
    }

    const { email, phoneNumber, integrations, notificationPreferences } =
      profile

    // Check event-level preference
    if (notificationPreferences) {
      if (
        args.templateName === "task_assigned" &&
        notificationPreferences.taskAssigned === false
      )
        return
      if (
        args.templateName === "task_status_changed" &&
        notificationPreferences.taskStatusChanged === false
      )
        return
      if (
        (args.templateName === "task_overdue" ||
          args.templateName === "task_due_soon") &&
        notificationPreferences.taskDueReminder === false
      )
        return
      if (
        args.templateName === "task_comment" &&
        notificationPreferences.taskComments === false
      )
        return
      if (
        args.templateName === "approval_requested" &&
        notificationPreferences.approvalRequested === false
      )
        return
      if (
        args.templateName === "approval_status_changed" &&
        notificationPreferences.approvalDecided === false
      )
        return
      if (
        args.templateName === "approval_comment" &&
        notificationPreferences.approvalComments === false
      )
        return
      if (
        args.templateName === "form_response_submitted" &&
        notificationPreferences.formResponses === false
      )
        return
    }

    // Format content
    let subject = "Ground Control Notification"
    let previewText = "New notification from Ground Control"
    let title = "Notification"
    let message = ""
    let actionUrl = args.link ? `${siteUrl}${args.link}` : siteUrl
    let actionLabel = "Open Dashboard"
    let entityType = args.entityType || "system"

    if (args.templateName === "task_assigned") {
      subject = `New Task Assigned: ${args.parameters.taskTitle}`
      previewText = `You have been assigned a new task by ${args.parameters.assignerName}`
      title = "New Task Assigned"
      message = `You have been assigned to "${args.parameters.taskTitle}" by ${args.parameters.assignerName}. Due date: ${args.parameters.dueDate}.`
      actionUrl = `${siteUrl}/tasks?taskId=${args.entityId || ""}`
      actionLabel = "View Task"
      entityType = "task"
    } else if (args.templateName === "task_status_changed") {
      subject = `Task Updated: ${args.parameters.taskTitle}`
      previewText = `Task status changed to ${args.parameters.newStatus}`
      title = `Task ${args.parameters.newStatus}`
      message = `The task "${args.parameters.taskTitle}" was updated to "${args.parameters.newStatus}" by ${args.parameters.updaterName}.`
      actionUrl = `${siteUrl}/tasks?taskId=${args.entityId || ""}`
      actionLabel = "View Task"
      entityType = "task"
    } else if (args.templateName === "task_comment") {
      subject = `New Comment on: ${args.parameters.taskTitle}`
      previewText = `${args.parameters.authorName}: ${args.parameters.commentPreview}`
      title = `New Comment on Task`
      message = `${args.parameters.authorName} commented on "${args.parameters.taskTitle}": "${args.parameters.commentPreview}"`
      actionUrl = `${siteUrl}/tasks?taskId=${args.entityId || ""}`
      actionLabel = "View Conversation"
      entityType = "task"
    } else if (args.templateName === "task_due_soon") {
      subject = `Task Due Soon: ${args.parameters.taskTitle}`
      previewText = `Reminder: Task "${args.parameters.taskTitle}" is due soon`
      title = "Task Due Soon"
      message = `Your assigned task "${args.parameters.taskTitle}" is due on ${args.parameters.dueDate}.`
      actionUrl = `${siteUrl}/tasks?taskId=${args.entityId || ""}`
      actionLabel = "View Task"
      entityType = "task"
    } else if (args.templateName === "task_overdue") {
      subject = `TASK OVERDUE: ${args.parameters.taskTitle}`
      previewText = `Warning: Your task "${args.parameters.taskTitle}" is overdue`
      title = "Task Overdue Warning"
      message = `Warning: Your assigned task "${args.parameters.taskTitle}" was due on ${args.parameters.dueDate} and is now overdue.`
      actionUrl = `${siteUrl}/tasks?taskId=${args.entityId || ""}`
      actionLabel = "View Task"
      entityType = "task"
    } else if (args.templateName === "approval_requested") {
      subject = `Approval Request: ${args.parameters.approvalTitle}`
      previewText = `${args.parameters.requesterName} requested your approval`
      title = "Approval Requested"
      message = `${args.parameters.requesterName} has requested your approval for: "${args.parameters.approvalTitle}". Due date: ${args.parameters.dueDate}.`
      actionUrl = `${siteUrl}/approvals?approvalId=${args.entityId || ""}`
      actionLabel = "View Approval"
      entityType = "approval"
    } else if (args.templateName === "approval_status_changed") {
      subject = `Approval Request Updated: ${args.parameters.approvalTitle}`
      previewText = `Approval request updated to ${args.parameters.newStatus}`
      title = `Approval ${args.parameters.newStatus}`
      message = `The approval request "${args.parameters.approvalTitle}" has been updated to "${args.parameters.newStatus}" by ${args.parameters.updaterName}. ${args.parameters.comment ? `Comment: "${args.parameters.comment}"` : ""}`
      actionUrl = `${siteUrl}/approvals?approvalId=${args.entityId || ""}`
      actionLabel = "View Approval"
      entityType = "approval"
    } else if (args.templateName === "approval_comment") {
      subject = `New Comment on Approval: ${args.parameters.approvalTitle}`
      previewText = `${args.parameters.authorName}: ${args.parameters.commentPreview}`
      title = `New Comment on Approval`
      message = `${args.parameters.authorName} commented on approval "${args.parameters.approvalTitle}": "${args.parameters.commentPreview}"`
      actionUrl = `${siteUrl}/approvals?approvalId=${args.entityId || ""}`
      actionLabel = "View Conversation"
      entityType = "approval"
    } else if (args.templateName === "form_response_submitted") {
      subject = `New Form Response: ${args.parameters.formTitle}`
      previewText = `${args.parameters.submitterName} submitted a form response`
      title = "Form Response Submitted"
      message = `${args.parameters.submitterName} submitted a response for form "${args.parameters.formTitle}".`
      actionUrl = `${siteUrl}/forms`
      actionLabel = "View Forms"
      entityType = "form"
    }

    const channelsSent: string[] = []

    // 1. In-App Notification (Default true)
    const wantsInApp = integrations?.inApp ?? true
    if (wantsInApp) {
      await ctx.runMutation(internal.notifications.insertInAppNotification, {
        userId: args.userId,
        organizationId: args.organizationId,
        type: args.templateName,
        title,
        message,
        link:
          args.link ||
          (entityType === "task"
            ? `/tasks`
            : entityType === "approval"
              ? `/approvals`
              : `/dashboard`),
        actorId: args.actorId,
        entityId: args.entityId,
        entityType,
        channelSent: channelsSent,
      })
      channelsSent.push("in_app")
    }

    // 2. Mobile Push Notification via @convex-dev/expo-push-notifications (Default true)
    const wantsPush = integrations?.push ?? true
    if (wantsPush) {
      try {
        await ctx.runMutation(
          internal.notifications.sendPushNotificationMutation,
          {
            userId: args.userId,
            title,
            body: message,
            data: {
              entityType,
              entityId: args.entityId,
              link: args.link,
            },
          }
        )
        channelsSent.push("push")
      } catch (e) {
        console.warn(`[Mobile Push Error] ${args.userId}:`, e)
      }
    }

    // Retrieve organization BYOK configuration
    const orgKeys = await ctx.runQuery(
      internal.notifications.getOrganizationApiKeysInternal,
      {
        organizationId: args.organizationId,
      }
    )

    // 3. Dispatch via Email (Resend)
    const wantsEmail = integrations?.email ?? true
    if (wantsEmail && email) {
      try {
        await ctx.runAction(internal.notifications.sendEmailAction, {
          email,
          templateName: args.templateName,
          parameters: args.parameters,
          subject,
          previewText,
          title,
          message,
          actionUrl,
          actionLabel,
          resendApiKey: orgKeys?.resendApiKey,
          fromEmail: orgKeys?.resendFromEmail,
        })
        channelsSent.push("email")
      } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error)
      }
    }

    // 4. Dispatch via Messages/RCS/WhatsApp (SentDM Smart Router)
    const sentDmApiKey = orgKeys?.sentDmApiKey || process.env.SENT_DM_API_KEY
    const wantsRcs = integrations?.rcs ?? false
    const wantsWhatsapp = integrations?.whatsapp ?? false
    const wantsSms = integrations?.sms ?? false

    const channels: ("rcs" | "whatsapp" | "sms")[] = []
    if (wantsRcs) channels.push("rcs")
    if (wantsWhatsapp) channels.push("whatsapp")
    if (wantsSms) channels.push("sms")

    if (channels.length > 0 && phoneNumber) {
      if (!sentDmApiKey) {
        console.warn(
          `[SentDM Warning] Neither custom nor platform SENT_DM_API_KEY is defined. Logging payload: ${JSON.stringify(args.parameters)}`
        )
      } else {
        const defaultTemplateIds: Record<string, string | undefined> = {
          task_assigned: process.env.SENTDM_TASK_ASSIGNED_TEMPLATE_ID,
          task_status_changed:
            process.env.SENTDM_TASK_STATUS_CHANGED_TEMPLATE_ID,
          task_overdue: process.env.SENTDM_TASK_OVERDUE_TEMPLATE_ID,
          task_due_soon: process.env.SENTDM_TASK_DUE_SOON_TEMPLATE_ID,
          task_comment: process.env.SENTDM_TASK_COMMENT_TEMPLATE_ID,
          approval_requested: process.env.SENTDM_APPROVAL_REQUESTED_TEMPLATE_ID,
          approval_status_changed:
            process.env.SENTDM_APPROVAL_STATUS_CHANGED_TEMPLATE_ID,
          approval_comment: process.env.SENTDM_APPROVAL_COMMENT_TEMPLATE_ID,
          form_response_submitted:
            process.env.SENTDM_FORM_RESPONSE_SUBMITTED_TEMPLATE_ID,
        }

        const templateId =
          (orgKeys?.sentDmTemplateIds as any)?.[args.templateName] ||
          defaultTemplateIds[args.templateName]

        if (templateId) {
          try {
            const client = new SentDm({ apiKey: sentDmApiKey })
            const response = await client.messages.send({
              to: [phoneNumber],
              template: {
                id: templateId,
                parameters: args.parameters,
              },
              channel: channels,
            })
            const recipient = response.data?.recipients?.[0]
            console.log(
              `SentDM message sent to ${phoneNumber} via channels ${JSON.stringify(channels)}. Message ID: ${recipient?.message_id ?? "unknown"}`
            )
            channelsSent.push(...channels)
          } catch (error) {
            console.error(
              `Failed to send SentDM message to ${phoneNumber}:`,
              error
            )
          }
        } else {
          console.log(
            `[SentDM Info] Fallback: No template ID for ${args.templateName}. Message: "${title} - ${message}"`
          )
        }
      }
    }
  },
})

// ---------------------------------------------------------------------------
// Interactive Test Notification Action (for Settings UI)
// ---------------------------------------------------------------------------

export const sendTestNotification = action({
  args: {
    organizationId: v.string(),
    channel: v.string(), // "all" | "in_app" | "push" | "email" | "whatsapp" | "sms" | "rcs"
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error("Unauthorized")
    }

    const profile = await ctx.runQuery(
      internal.notifications.getUserProfileForNotification,
      {
        userId: user._id,
        organizationId: args.organizationId,
      }
    )

    if (!profile) {
      throw new Error("Member profile not found")
    }

    const orgKeys = await ctx.runQuery(
      internal.notifications.getOrganizationApiKeysInternal,
      {
        organizationId: args.organizationId,
      }
    )

    const testTime = new Date().toLocaleTimeString()
    const testTitle = `Test Notification (${args.channel.toUpperCase()})`
    const testMessage = `This is a test notification from Ground Control at ${testTime}. Your notification routing is operational!`

    const results: Record<string, any> = {}

    // In-App Test
    if (args.channel === "all" || args.channel === "in_app") {
      await ctx.runMutation(internal.notifications.insertInAppNotification, {
        userId: user._id,
        organizationId: args.organizationId,
        type: "system",
        title: testTitle,
        message: testMessage,
        link: "/settings?tab=notifications",
        actorId: user._id,
        channelSent: ["in_app"],
      })
      results.inApp = {
        status: "success",
        message: "In-App notification delivered",
      }
    }

    // Mobile Push Test
    if (args.channel === "all" || args.channel === "push") {
      try {
        await ctx.runMutation(
          internal.notifications.sendPushNotificationMutation,
          {
            userId: user._id,
            title: testTitle,
            body: testMessage,
            data: { link: "/settings?tab=notifications" },
          }
        )
        results.push = {
          status: "success",
          message: "Push notification queued for Expo mobile client",
        }
      } catch (e: any) {
        results.push = {
          status: "error",
          message: e.message || "Failed to dispatch push",
        }
      }
    }

    // Email Test (Resend)
    if (args.channel === "all" || args.channel === "email") {
      if (profile.email) {
        try {
          const resendMode = orgKeys?.resendApiKey
            ? "Custom Org Key (BYOK)"
            : "Platform Managed Key"
          await ctx.runAction(internal.notifications.sendEmailAction, {
            email: profile.email,
            templateName: "system_test",
            parameters: {},
            subject: `Ground Control: Test Notification (${testTime})`,
            previewText:
              "Your Ground Control notification test was successful!",
            title: "Ground Control Test Notification",
            message: `Hello ${profile.name || "Operator"}, this is a test notification verifying that your email integration via Resend is working properly (${resendMode}).`,
            actionUrl: `${siteUrl}/settings?tab=notifications`,
            actionLabel: "Open Notification Settings",
            resendApiKey: orgKeys?.resendApiKey,
            fromEmail: orgKeys?.resendFromEmail,
          })
          results.email = {
            status: "success",
            message: `Email delivered to ${profile.email} using ${resendMode}`,
          }
        } catch (e: any) {
          results.email = {
            status: "error",
            message: e.message || "Failed to send email",
          }
        }
      } else {
        results.email = { status: "skipped", message: "No email address found" }
      }
    }

    // SentDM Smart Messaging Test (WhatsApp / SMS / RCS)
    if (
      args.channel === "all" ||
      args.channel === "whatsapp" ||
      args.channel === "sms" ||
      args.channel === "rcs"
    ) {
      const targetChannel = (args.channel === "all" ? "sms" : args.channel) as
        | "sms"
        | "whatsapp"
        | "rcs"
      const sentDmApiKey = orgKeys?.sentDmApiKey || process.env.SENT_DM_API_KEY
      const sentDmMode = orgKeys?.sentDmApiKey
        ? "Custom Org Key (BYOK)"
        : "Platform Managed Key"

      if (!profile.phoneNumber) {
        results.phone = {
          status: "skipped",
          message: "No phone number configured in profile",
        }
      } else if (!sentDmApiKey) {
        results.phone = {
          status: "warning",
          message:
            "No Sent.dm API key configured (Neither custom nor platform key found)",
        }
      } else {
        try {
          const client = new SentDm({ apiKey: sentDmApiKey })
          const templateId =
            (orgKeys?.sentDmTemplateIds as any)?.task_assigned ||
            process.env.SENTDM_TASK_ASSIGNED_TEMPLATE_ID

          if (templateId) {
            await client.messages.send({
              to: [profile.phoneNumber],
              template: {
                id: templateId,
                parameters: {
                  taskTitle: "Test Telemetry Link",
                  assignerName: "Ground Control System",
                  dueDate: "Today",
                },
              },
              channel: [targetChannel],
            })
            results.phone = {
              status: "success",
              message: `Sent.dm message dispatched to ${profile.phoneNumber} via ${targetChannel.toUpperCase()} using ${sentDmMode}`,
            }
          } else {
            results.phone = {
              status: "warning",
              message:
                "Sent.dm template ID not configured (custom or environment template ID needed)",
            }
          }
        } catch (e: any) {
          results.phone = {
            status: "error",
            message: e.message || "Failed to dispatch Sent.dm message",
          }
        }
      }
    }

    return { success: true, results }
  },
})
