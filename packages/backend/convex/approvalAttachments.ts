import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components } from "./_generated/api"

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

export const getAttachments = query({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)
    const isSubscriber = approval.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isApprover && !isSubscriber) {
      throw new Error("Permission denied to read attachments for this approval request")
    }

    return await ctx.db
      .query("approvalAttachments")
      .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
      .collect()
  },
})

export const registerAttachment = mutation({
  args: {
    approvalId: v.id("approvals"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    r2Key: v.string(),
    bypassChatNotification: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot add attachment to archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)
    const isSubscriber = approval.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isApprover && !isSubscriber) {
      throw new Error("Permission denied to register attachment on this approval request")
    }

    const attachmentId = await ctx.db.insert("approvalAttachments", {
      approvalId: args.approvalId,
      uploaderId: user._id,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      r2Key: args.r2Key,
    })

    // Log the attachment
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: "ATTACHMENT_ADDED",
      details: { fileName: args.fileName, attachmentId },
      timestamp: Date.now(),
    })

    if (!args.bypassChatNotification) {
      await ctx.db.insert("approvalChats", {
        approvalId: args.approvalId,
        userId: user._id,
        content: `added an attachment: ${args.fileName}`,
        isEdited: false,
        isDeleted: false,
        isSystem: true,
        attachmentIds: [attachmentId],
      })
    }

    return attachmentId
  },
})

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("approvalAttachments"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const attachment = await ctx.db.get(args.attachmentId)
    if (!attachment) throw new Error("Attachment not found")

    const approval = await ctx.db.get(attachment.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot delete attachment from archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id

    if (attachment.uploaderId !== user._id && !isCreator && !isAdminOrOwner) {
      throw new Error("Unauthorized to delete this attachment")
    }

    await ctx.db.delete(args.attachmentId)

    // Log deletion
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: attachment.approvalId,
      actorId: user._id,
      action: "ATTACHMENT_DELETED",
      details: { fileName: attachment.fileName, attachmentId: args.attachmentId },
      timestamp: Date.now(),
    })

    return { success: true }
  },
})
