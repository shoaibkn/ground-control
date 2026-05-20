import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"

async function requireAuth(ctx: any) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export const getAttachments = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
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
    if (task?.isArchived) throw new Error("Cannot delete attachment from archived task")

    // In a real app, verify they have permission to delete (Admins/Owners)
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
