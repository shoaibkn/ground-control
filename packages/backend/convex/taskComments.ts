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

export const getComments = query({
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
      throw new Error("Permission denied to read comments for this task")
    }
    
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

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isAssignee && !isCollaborator && !isSubscriber) {
      throw new Error("Permission denied to comment on this task")
    }

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
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot edit comment on archived task")

    await requireMember(ctx, user._id, task.organizationId)

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
    
    const task = await ctx.db.get(comment.taskId)
    if (!task) throw new Error("Task not found")

    await requireMember(ctx, user._id, task.organizationId)

    // Only author or admin/owner can delete
    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    if (comment.userId !== user._id && !isAdminOrOwner) {
      throw new Error("Unauthorized to delete this comment")
    }

    // Soft delete
    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      content: "This message was deleted",
    })

    return { success: true }
  },
})

export const markCommentsAsRead = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    await requireMember(ctx, user._id, task.organizationId)

    const existing = await ctx.db
      .query("taskReadReceipts")
      .withIndex("by_task_user", (q: any) =>
        q.eq("taskId", args.taskId).eq("userId", user._id)
      )
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadTime: now,
      })
    } else {
      await ctx.db.insert("taskReadReceipts", {
        taskId: args.taskId,
        userId: user._id,
        lastReadTime: now,
      })
    }

    return { success: true }
  },
})

export const getTaskReadReceipts = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) return []

    await requireMember(ctx, user._id, task.organizationId)

    const receipts = await ctx.db
      .query("taskReadReceipts")
      .withIndex("by_task", (q: any) => q.eq("taskId", args.taskId))
      .collect()

    return receipts
  },
})
