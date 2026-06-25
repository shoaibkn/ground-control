import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components } from "./_generated/api"
import { hasPermission } from "./permissions"
import { spawnNextRecurringInstance } from "./tasks"

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
  args: { taskId: v.id("tasks") },
  handler: async (ctx: any, args: any) => {
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
      throw new Error("Permission denied to read chats for this task")
    }
    
    const chats = await ctx.db
      .query("taskChats")
      .withIndex("by_task", (q: any) => q.eq("taskId", args.taskId))
      .collect()

    return chats
  },
})

export const addChat = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("taskAttachments"))),
    statusChange: v.optional(v.string()),
    completedSubtaskIds: v.optional(v.array(v.id("subtasks"))),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot send chat on archived task")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isAssignee && !isCollaborator && !isSubscriber) {
      throw new Error("Permission denied to send chat on this task")
    }

    // 1. Process Status Change if requested from chat
    if (args.statusChange && args.statusChange !== task.status) {
      let nextStatus = args.statusChange
      const canComplete = await hasPermission(ctx, task.organizationId, member.role, "tasks", "complete")
      const canCancel = await hasPermission(ctx, task.organizationId, member.role, "tasks", "cancel")

      if (nextStatus === "Cancelled" && !canCancel) {
        throw new Error("Only admins/owners can cancel tasks")
      }
      
      if (nextStatus === "Completed" && !canComplete) {
        if (isAssignee || isCollaborator || isCreator) {
          nextStatus = "Under Review"
        } else {
          throw new Error("Unauthorized to complete task")
        }
      }

      if (nextStatus === "In Progress" || nextStatus === "Under Review") {
        if (!isAssignee && !isCollaborator && !isCreator && !canComplete) {
          throw new Error("Permission denied to update task status")
        }
      }

      const previousStatus = task.status
      await ctx.db.patch(args.taskId, { status: nextStatus })

      await ctx.db.insert("taskAuditLogs", {
        taskId: args.taskId,
        actorId: user._id,
        action: "STATUS_CHANGED",
        details: { previous: previousStatus, new: nextStatus },
        timestamp: Date.now(),
      })

      if (nextStatus === "Completed" && task.recurrence) {
        await spawnNextRecurringInstance(ctx, task)
      }
    }

    // 2. Process Subtask Completions if requested from chat
    if (args.completedSubtaskIds && args.completedSubtaskIds.length > 0) {
      if (!isAssignee && !isCollaborator && !isCreator && !isAdminOrOwner) {
        throw new Error("Only the creator, assignees, collaborators, or organization admins can toggle subtasks")
      }

      for (const subtaskId of args.completedSubtaskIds) {
        const subtask = await ctx.db.get(subtaskId)
        if (subtask && subtask.taskId === args.taskId && !subtask.isCompleted) {
          await ctx.db.patch(subtaskId, { isCompleted: true })
          
          await ctx.db.insert("taskAuditLogs", {
            taskId: args.taskId,
            actorId: user._id,
            action: "SUBTASK_TOGGLED",
            details: { subtaskId, title: subtask.title, isCompleted: true },
            timestamp: Date.now(),
          })
        }
      }
    }

    // 3. Insert Chat Message
    const chatId = await ctx.db.insert("taskChats", {
      taskId: args.taskId,
      userId: user._id,
      content: args.content,
      isEdited: false,
      isDeleted: false,
      attachmentIds: args.attachmentIds,
      statusChange: args.statusChange,
      completedSubtaskIds: args.completedSubtaskIds,
    })

    return chatId
  },
})

export const editChat = mutation({
  args: {
    chatId: v.id("taskChats"),
    newContent: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const chat = await ctx.db.get(args.chatId)
    
    if (!chat) throw new Error("Chat not found")
    if (chat.userId !== user._id) throw new Error("Unauthorized to edit this chat")
    
    const task = await ctx.db.get(chat.taskId)
    if (!task) throw new Error("Task not found")
    if (task.isArchived) throw new Error("Cannot edit chat on archived task")

    await requireMember(ctx, user._id, task.organizationId)

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
    chatId: v.id("taskChats"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const chat = await ctx.db.get(args.chatId)
    
    if (!chat) throw new Error("Chat not found")
    
    const task = await ctx.db.get(chat.taskId)
    if (!task) throw new Error("Task not found")

    await requireMember(ctx, user._id, task.organizationId)

    const member = await requireMember(ctx, user._id, task.organizationId)
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
    taskId: v.id("tasks"),
  },
  handler: async (ctx: any, args: any) => {
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
  handler: async (ctx: any, args: any) => {
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
