import { internalQuery, internalAction } from "./_generated/server"
import { v } from "convex/values"
import { components, internal } from "./_generated/api"
import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/render"
import { NotificationEmail } from "./emails/NotificationEmail"
import SentDm from "@sentdm/sentdm"

const emailFrom = process.env.EMAIL_FROM || "Ground Control <onboarding@resend.dev>"
const siteUrl = process.env.SITE_URL || "http://localhost:3000"

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
      integrations: profile?.integrations,
    }
  },
})

export const sendEmailAction = internalAction({
  args: {
    email: v.string(),
    templateName: v.string(),
    parameters: v.any(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(components.resend, { testMode: false })

    let subject = "Ground Control Notification"
    let previewText = "New notification from Ground Control"
    let title = "Notification"
    let message = ""
    let actionUrl = siteUrl
    let actionLabel = "Open Dashboard"

    if (args.templateName === "task_assigned") {
      subject = `New Task Assigned: ${args.parameters.taskTitle}`
      previewText = `You have been assigned a new task by ${args.parameters.assignerName}`
      title = "New Task Assigned"
      message = `Hello, you have been assigned a new task: "${args.parameters.taskTitle}" by ${args.parameters.assignerName}. Due date: ${args.parameters.dueDate}.`
      actionUrl = `${siteUrl}/tasks`
      actionLabel = "View Tasks"
    } else if (args.templateName === "task_overdue") {
      subject = `TASK OVERDUE: ${args.parameters.taskTitle}`
      previewText = `Warning: Your task "${args.parameters.taskTitle}" is overdue`
      title = "Task Overdue Warning"
      message = `Warning: Your assigned task "${args.parameters.taskTitle}" was due on ${args.parameters.dueDate} and is now overdue. Please review it immediately.`
      actionUrl = `${siteUrl}/tasks`
      actionLabel = "View Tasks"
    } else if (args.templateName === "approval_requested") {
      subject = `Approval Request: ${args.parameters.approvalTitle}`
      previewText = `${args.parameters.requesterName} requested your approval`
      title = "Approval Requested"
      message = `Hello, ${args.parameters.requesterName} has requested your approval for: "${args.parameters.approvalTitle}". Due date: ${args.parameters.dueDate}.`
      actionUrl = `${siteUrl}/approvals`
      actionLabel = "View Approvals"
    } else if (args.templateName === "approval_status_changed") {
      subject = `Approval Request Updated: ${args.parameters.approvalTitle}`
      previewText = `Approval request updated to ${args.parameters.newStatus}`
      title = `Approval Request ${args.parameters.newStatus}`
      message = `The approval request "${args.parameters.approvalTitle}" has been updated to "${args.parameters.newStatus}" by ${args.parameters.updaterName}. Comment: ${args.parameters.comment}`
      actionUrl = `${siteUrl}/approvals`
      actionLabel = "View Approvals"
    }

    const html = await render(
      NotificationEmail({
        previewText,
        title,
        message,
        actionUrl,
        actionLabel,
      })
    )

    await resend.sendEmail(ctx as any, {
      from: emailFrom,
      to: args.email,
      subject,
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
  },
  handler: async (ctx, args) => {
    // 1. Get the user profile and preferences
    const profile = await ctx.runQuery(internal.notifications.getUserProfileForNotification, {
      userId: args.userId,
      organizationId: args.organizationId,
    })

    if (!profile) {
      console.warn(`No profile found for user ${args.userId} in organization ${args.organizationId}`)
      return
    }

    const { email, phoneNumber, integrations } = profile

    // 2. Dispatch via Email (Resend)
    const wantsEmail = integrations?.email ?? true // Default to true if not specified
    if (wantsEmail && email) {
      try {
        await ctx.runAction(internal.notifications.sendEmailAction, {
          email,
          templateName: args.templateName,
          parameters: args.parameters,
        })
        console.log(`Notification email sent to ${email} for template ${args.templateName}`)
      } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error)
      }
    }

    // 3. Dispatch via Messages/RCS/WhatsApp (SentDM Smart Router)
    const sentDmApiKey = process.env.SENT_DM_API_KEY
    const wantsRcs = integrations?.rcs ?? false
    const wantsWhatsapp = integrations?.whatsapp ?? false
    const wantsSms = integrations?.sms ?? false

    const channels: ("rcs" | "whatsapp" | "sms")[] = []
    if (wantsRcs) channels.push("rcs")
    if (wantsWhatsapp) channels.push("whatsapp")
    if (wantsSms) channels.push("sms")

    if (channels.length > 0 && phoneNumber) {
      if (!sentDmApiKey) {
        console.warn(`[SentDM Warning] SENT_DM_API_KEY is not defined. Fallback logging parameters: ${JSON.stringify(args.parameters)}`)
        return
      }

      const templateIds: Record<string, string | undefined> = {
        task_assigned: process.env.SENTDM_TASK_ASSIGNED_TEMPLATE_ID,
        task_overdue: process.env.SENTDM_TASK_OVERDUE_TEMPLATE_ID,
        approval_requested: process.env.SENTDM_APPROVAL_REQUESTED_TEMPLATE_ID,
        approval_status_changed: process.env.SENTDM_APPROVAL_STATUS_CHANGED_TEMPLATE_ID,
      }

      const templateId = templateIds[args.templateName]
      if (!templateId) {
        console.warn(`[SentDM Warning] Template ID for ${args.templateName} is not defined in environment variables. Fallback logging parameters: ${JSON.stringify(args.parameters)}`)
        return
      }

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
        console.log(`SentDM message sent to ${phoneNumber} via channels ${JSON.stringify(channels)}. Message ID: ${recipient?.message_id ?? "unknown"}`)
      } catch (error) {
        console.error(`Failed to send SentDM message to ${phoneNumber}:`, error)
      }
    }
  },
})
