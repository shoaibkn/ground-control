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
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isAssignee && !isCollaborator && !isSubscriber) {
      throw new Error("Permission denied to read attachments for this task")
    }

    return await ctx.db
      .query("taskAttachments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect()
  },
})

export const registerAttachment = mutation({
  args: {
    taskId: v.id("tasks"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    r2Key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot add attachment to archived task")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isAssignee && !isCollaborator && !isSubscriber) {
      throw new Error("Permission denied to register attachment on this task")
    }

    const attachmentId = await ctx.db.insert("taskAttachments", {
      taskId: args.taskId,
      uploaderId: user._id,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      r2Key: args.r2Key,
    })

    // Log the attachment
    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "ATTACHMENT_ADDED",
      details: { fileName: args.fileName, attachmentId },
      timestamp: Date.now(),
    })

    return attachmentId
  },
})

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("taskAttachments"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const attachment = await ctx.db.get(args.attachmentId)
    if (!attachment) throw new Error("Attachment not found")

    const task = await ctx.db.get(attachment.taskId)
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot delete attachment from archived task")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id

    if (attachment.uploaderId !== user._id && !isCreator && !isAdminOrOwner) {
      throw new Error("Unauthorized to delete this attachment")
    }

    await ctx.db.delete(args.attachmentId)

    // Log deletion
    await ctx.db.insert("taskAuditLogs", {
      taskId: attachment.taskId,
      actorId: user._id,
      action: "ATTACHMENT_DELETED",
      details: { fileName: attachment.fileName, attachmentId: args.attachmentId },
      timestamp: Date.now(),
    })

    // Note: Actual deletion from Cloudflare R2 bucket would happen via a background action or HTTP request

    return { success: true }
  },
})
