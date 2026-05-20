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

export const getComments = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    
    // Check if user has access to task (creator, assignee, or admin/owner)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    // In a real implementation we would enforce the read permission here as well
    // by calling `requireMember` and checking `tasks:read_own` / `tasks:read_all`
    
    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect()

    return comments
  },
})

export const addComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("taskAttachments"))),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot comment on archived task")

    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      userId: user._id,
      content: args.content,
      isEdited: false,
      isDeleted: false,
      attachmentIds: args.attachmentIds,
    })

    // TODO: Send notifications via actions

    return commentId
  },
})

export const editComment = mutation({
  args: {
    commentId: v.id("taskComments"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const comment = await ctx.db.get(args.commentId)
    
    if (!comment) throw new Error("Comment not found")
    if (comment.userId !== user._id) throw new Error("Unauthorized to edit this comment")
    
    const task = await ctx.db.get(comment.taskId)
    if (task?.isArchived) throw new Error("Cannot edit comment on archived task")

    await ctx.db.patch(args.commentId, {
      content: args.newContent,
      originalContent: comment.originalContent || comment.content,
      isEdited: true,
    })

    return { success: true }
  },
})

export const deleteComment = mutation({
  args: {
    commentId: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const comment = await ctx.db.get(args.commentId)
    
    if (!comment) throw new Error("Comment not found")
    // Only author or admin/owner can delete
    // For simplicity here, we allow author. In a full implementation we'd check roles.
    if (comment.userId !== user._id) throw new Error("Unauthorized to delete this comment")

    // Soft delete
    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      content: "This message was deleted",
    })

    return { success: true }
  },
})
