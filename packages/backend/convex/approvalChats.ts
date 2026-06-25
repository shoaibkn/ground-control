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

export const getChats = query({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)
    const isSubscriber = approval.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isApprover && !isSubscriber) {
      throw new Error("Permission denied to read chats for this approval request")
    }
    
    const chats = await ctx.db
      .query("approvalChats")
      .withIndex("by_approval", (q: any) => q.eq("approvalId", args.approvalId))
      .collect()

    return chats
  },
})

export const addChat = mutation({
  args: {
    approvalId: v.id("approvals"),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("approvalAttachments"))),
    statusChange: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot send chat on archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)
    const isSubscriber = approval.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isApprover && !isSubscriber) {
      throw new Error("Permission denied to send chat on this approval request")
    }

    // 1. Process Status Change if requested from chat
    if (args.statusChange && args.statusChange !== approval.status) {
      const previousStatus = approval.status
      await ctx.db.patch(args.approvalId, { status: args.statusChange })

      await ctx.db.insert("approvalAuditLogs", {
        approvalId: args.approvalId,
        actorId: user._id,
        action: "STATUS_CHANGED",
        details: { previous: previousStatus, new: args.statusChange, comment: args.content },
        timestamp: Date.now(),
      })

      // If Rework is selected, automatically create a task for the creator to rework on the request, due at EOD.
      if (args.statusChange === "Rework") {
        const now = new Date()
        const eod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()

        const taskId = await ctx.db.insert("tasks", {
          title: `Rework: ${approval.title}`,
          description: `Approval request "${approval.title}" needs rework. Comment: ${args.content || "Status changed from chat"}`,
          priority: "High",
          status: "Pending",
          dueDate: eod,
          creatorId: user._id,
          organizationId: approval.organizationId,
          assigneeIds: [approval.creatorId],
          collaboratorIds: [],
          subscriberIds: [],
          isArchived: false,
        })

        await ctx.db.insert("taskAuditLogs", {
          taskId,
          actorId: user._id,
          action: "TASK_CREATED",
          details: {
            title: `Rework: ${approval.title}`,
            assignees: [approval.creatorId],
            collaborators: [],
            subscribers: [],
          },
          timestamp: Date.now(),
        })
      }
    }

    // 2. Insert Chat Message
    const chatId = await ctx.db.insert("approvalChats", {
      approvalId: args.approvalId,
      userId: user._id,
      content: args.content,
      isEdited: false,
      isDeleted: false,
      attachmentIds: args.attachmentIds,
      statusChange: args.statusChange,
    })

    return chatId
  },
})

export const editChat = mutation({
  args: {
    chatId: v.id("approvalChats"),
    newContent: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const chat = await ctx.db.get(args.chatId)
    
    if (!chat) throw new Error("Chat not found")
    if (chat.userId !== user._id) throw new Error("Unauthorized to edit this chat")
    
    const approval = await ctx.db.get(chat.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot edit chat on archived approval request")

    await requireMember(ctx, user._id, approval.organizationId)

    await ctx.db.patch(args.chatId, {
      content: args.newContent,
      originalContent: chat.originalContent || chat.content,
      isEdited: true,
    })

    return { success: true }
  },
})

export const deleteChat = mutation({
  args: {
    chatId: v.id("approvalChats"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const chat = await ctx.db.get(args.chatId)
    
    if (!chat) throw new Error("Chat not found")
    
    const approval = await ctx.db.get(chat.approvalId)
    if (!approval) throw new Error("Approval request not found")

    await requireMember(ctx, user._id, approval.organizationId)

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    if (chat.userId !== user._id && !isAdminOrOwner) {
      throw new Error("Unauthorized to delete this chat")
    }

    // Soft delete
    await ctx.db.patch(args.chatId, {
      isDeleted: true,
      content: "This message was deleted",
    })

    return { success: true }
  },
})

export const markChatsAsRead = mutation({
  args: {
    approvalId: v.id("approvals"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")

    await requireMember(ctx, user._id, approval.organizationId)

    const existing = await ctx.db
      .query("approvalReadReceipts")
      .withIndex("by_approval_user", (q: any) =>
        q.eq("approvalId", args.approvalId).eq("userId", user._id)
      )
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadTime: now,
      })
    } else {
      await ctx.db.insert("approvalReadReceipts", {
        approvalId: args.approvalId,
        userId: user._id,
        lastReadTime: now,
      })
    }

    return { success: true }
  },
})

export const getApprovalReadReceipts = query({
  args: {
    approvalId: v.id("approvals"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) return []

    await requireMember(ctx, user._id, approval.organizationId)

    const receipts = await ctx.db
      .query("approvalReadReceipts")
      .withIndex("by_approval", (q: any) => q.eq("approvalId", args.approvalId))
      .collect()

    return receipts
  },
})
