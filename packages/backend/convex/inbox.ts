import { query } from "./_generated/server.js"
import { v } from "convex/values"
import { authComponent } from "./auth.js"
import { components } from "./_generated/api.js"
import { hasPermission } from "./permissions.js"

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

export const getInboxThreads = query({
  args: { organizationId: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    // 1. Fetch Tasks if readable
    const canReadAllTasks = await hasPermission(ctx, args.organizationId, member.role, "tasks", "read_all")
    const canReadOwnTasks = await hasPermission(ctx, args.organizationId, member.role, "tasks", "read_own")

    let filteredTasks: any[] = []
    if (canReadAllTasks || canReadOwnTasks) {
      const allTasks = await ctx.db
        .query("tasks")
        .withIndex("by_organization", (q: any) => q.eq("organizationId", args.organizationId))
        .filter((q: any) => q.eq(q.field("isArchived"), false))
        .collect()

      filteredTasks = canReadAllTasks
        ? allTasks
        : allTasks.filter(
            (task: any) =>
              task.creatorId === user._id ||
              task.assigneeIds.includes(user._id) ||
              task.collaboratorIds?.includes(user._id) ||
              task.subscriberIds?.includes(user._id)
          )
    }

    // 2. Fetch Approvals if readable
    const canReadAllApprovals = await hasPermission(ctx, args.organizationId, member.role, "approvals", "read_all")
    const canReadOwnApprovals = await hasPermission(ctx, args.organizationId, member.role, "approvals", "read_own")

    let filteredApprovals: any[] = []
    if (canReadAllApprovals || canReadOwnApprovals) {
      const allApprovals = await ctx.db
        .query("approvals")
        .withIndex("by_organization", (q: any) => q.eq("organizationId", args.organizationId))
        .filter((q: any) => q.eq(q.field("isArchived"), false))
        .collect()

      filteredApprovals = canReadAllApprovals
        ? allApprovals
        : allApprovals.filter(
            (app: any) =>
              app.creatorId === user._id ||
              app.approverIds.includes(user._id) ||
              app.subscriberIds?.includes(user._id)
          )
    }

    const threads: any[] = []

    // 3. Process Tasks into Threads
    for (const task of filteredTasks) {
      // Get all non-deleted chats
      const chats = await ctx.db
        .query("taskChats")
        .withIndex("by_task", (q: any) => q.eq("taskId", task._id))
        .collect()
      const activeChats = chats.filter((c: any) => !c.isDeleted)

      // Get latest message
      const latestChat = activeChats[activeChats.length - 1] // chronological order, so last is latest

      // Get unread count
      const readReceipt = await ctx.db
        .query("taskReadReceipts")
        .withIndex("by_task_user", (q: any) => q.eq("taskId", task._id).eq("userId", user._id))
        .first()
      const lastReadTime = readReceipt?.lastReadTime ?? 0
      const unreadChatCount = activeChats.filter(
        (c: any) => c.userId !== user._id && c._creationTime > lastReadTime
      ).length

      // Resolve sender details for the preview
      let latestMessage: any = null
      if (latestChat) {
        let sender: any = null
        if (latestChat.userId && latestChat.userId.length >= 15) {
          try {
            const userRecord = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: latestChat.userId }],
              }
            )) as any
            if (userRecord) {
              sender = {
                name: userRecord.name,
                image: userRecord.image,
              }
            }
          } catch (e) {
            console.error(`Failed to find user profile for chat: ${latestChat.userId}`, e)
          }
        }
        latestMessage = {
          content: latestChat.content,
          senderId: latestChat.userId,
          senderName: sender?.name || "Unknown Member",
          senderImage: sender?.image,
          timestamp: latestChat._creationTime,
          isSystem: latestChat.isSystem,
        }
      }

      // Last activity timestamp: latest chat creation time, otherwise task creation time
      const lastActivityTimestamp = latestChat ? latestChat._creationTime : task._creationTime

      threads.push({
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        type: "task",
        priority: task.priority,
        dueDate: task.dueDate,
        creatorId: task.creatorId,
        assigneeIds: task.assigneeIds,
        collaboratorIds: task.collaboratorIds || [],
        subscriberIds: task.subscriberIds || [],
        unreadChatCount,
        chatCount: activeChats.length,
        latestMessage,
        lastActivityTimestamp,
      })
    }

    // 4. Process Approvals into Threads
    for (const approval of filteredApprovals) {
      // Get all non-deleted chats
      const chats = await ctx.db
        .query("approvalChats")
        .withIndex("by_approval", (q: any) => q.eq("approvalId", approval._id))
        .collect()
      const activeChats = chats.filter((c: any) => !c.isDeleted)

      // Get latest message
      const latestChat = activeChats[activeChats.length - 1]

      // Get unread count
      const readReceipt = await ctx.db
        .query("approvalReadReceipts")
        .withIndex("by_approval_user", (q: any) => q.eq("approvalId", approval._id).eq("userId", user._id))
        .first()
      const lastReadTime = readReceipt?.lastReadTime ?? 0
      const unreadChatCount = activeChats.filter(
        (c: any) => c.userId !== user._id && c._creationTime > lastReadTime
      ).length

      // Resolve sender details for the preview
      let latestMessage: any = null
      if (latestChat) {
        let sender: any = null
        if (latestChat.userId && latestChat.userId.length >= 15) {
          try {
            const userRecord = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: latestChat.userId }],
              }
            )) as any
            if (userRecord) {
              sender = {
                name: userRecord.name,
                image: userRecord.image,
              }
            }
          } catch (e) {
            console.error(`Failed to find user profile for chat: ${latestChat.userId}`, e)
          }
        }
        latestMessage = {
          content: latestChat.content,
          senderId: latestChat.userId,
          senderName: sender?.name || "Unknown Member",
          senderImage: sender?.image,
          timestamp: latestChat._creationTime,
          isSystem: latestChat.isSystem,
        }
      }

      // Last activity timestamp: latest chat creation time, otherwise approval creation time
      const lastActivityTimestamp = latestChat ? latestChat._creationTime : approval._creationTime

      threads.push({
        id: approval._id,
        title: approval.title,
        description: approval.description,
        status: approval.status,
        type: "approval",
        dueDate: approval.dueDate,
        creatorId: approval.creatorId,
        approverIds: approval.approverIds,
        subscriberIds: approval.subscriberIds || [],
        unreadChatCount,
        chatCount: activeChats.length,
        latestMessage,
        lastActivityTimestamp,
      })
    }

    // 5. Sort threads by lastActivityTimestamp descending
    threads.sort((a: any, b: any) => b.lastActivityTimestamp - a.lastActivityTimestamp)

    return threads
  },
})
