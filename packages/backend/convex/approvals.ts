import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components, internal } from "./_generated/api"
import { hasPermission } from "./permissions"
import { spawnNextRecurringInstance } from "./tasks"

/**
 * Ensures the caller is authenticated and returns their user record.
 */
async function requireAuth(ctx: any) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/**
 * Retrieves the member record for the caller in the given organization.
 * Used to check their role.
 */
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

export const createApproval = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    organizationId: v.string(),
    approverIds: v.array(v.string()),
    subscriberIds: v.optional(v.array(v.string())),
    formId: v.optional(v.id("forms")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canCreate = await hasPermission(ctx, args.organizationId, member.role, "approvals", "create")
    if (!canCreate) {
      throw new Error("Permission denied to create approvals")
    }

    const cleanApprovers = Array.from(new Set(args.approverIds))
    const cleanSubscribers = Array.from(
      new Set((args.subscriberIds || []).filter((id) => !cleanApprovers.includes(id)))
    )

    const approvalId = await ctx.db.insert("approvals", {
      title: args.title,
      description: args.description,
      status: "Pending",
      dueDate: args.dueDate,
      creatorId: user._id,
      organizationId: args.organizationId,
      approverIds: cleanApprovers,
      subscriberIds: cleanSubscribers,
      isArchived: false,
      formId: args.formId,
    })

    // Log the creation
    await ctx.db.insert("approvalAuditLogs", {
      approvalId,
      actorId: user._id,
      action: "APPROVAL_CREATED",
      details: {
        title: args.title,
        approvers: cleanApprovers,
        subscribers: cleanSubscribers,
      },
      timestamp: Date.now(),
    })

    // Send notifications to approvers
    for (const approverId of cleanApprovers) {
      if (approverId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
          userId: approverId,
          organizationId: args.organizationId,
          templateName: "approval_requested",
          parameters: {
            approvalTitle: args.title,
            requesterName: user.name || user.email || "Someone",
            dueDate: args.dueDate
              ? new Date(args.dueDate).toLocaleDateString()
              : "No due date",
          },
        })
      }
    }

    return approvalId
  },
})

export const getApprovals = query({
  args: { organizationId: v.string(), showArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canReadAll = await hasPermission(ctx, args.organizationId, member.role, "approvals", "read_all")
    const canReadOwn = await hasPermission(ctx, args.organizationId, member.role, "approvals", "read_own")

    if (!canReadAll && !canReadOwn) {
      throw new Error("Permission denied to read approvals")
    }

    let approvalsQuery = ctx.db
      .query("approvals")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))

    if (!args.showArchived) {
      approvalsQuery = approvalsQuery.filter((q) => q.eq(q.field("isArchived"), false))
    }

    const approvals = await approvalsQuery.collect()

    // Enforce permission scopes (members only see approvals where they are creator, approver, or subscriber)
    const filteredApprovals = canReadAll
      ? approvals
      : approvals.filter(
          (app) =>
            app.creatorId === user._id ||
            app.approverIds.includes(user._id) ||
            app.subscriberIds?.includes(user._id)
        )

    const enrichedApprovals = []
    for (const approval of filteredApprovals) {
      // 1. Documents count
      const attachments = await ctx.db
        .query("approvalAttachments")
        .withIndex("by_approval", (q) => q.eq("approvalId", approval._id))
        .collect()
      const documentCount = attachments.length

      // 2. Chats count
      const chats = await ctx.db
        .query("approvalChats")
        .withIndex("by_approval", (q) => q.eq("approvalId", approval._id))
        .collect()
      const activeChats = chats.filter((c) => !c.isDeleted)
      const chatCount = activeChats.length

      // Unread chats count
      const readReceipt = await ctx.db
        .query("approvalReadReceipts")
        .withIndex("by_approval_user", (q) => q.eq("approvalId", approval._id).eq("userId", user._id))
        .first()

      const lastReadTime = readReceipt?.lastReadTime ?? 0
      const unreadChatCount = activeChats.filter(
        (c) => c.userId !== user._id && c._creationTime > lastReadTime
      ).length

      // 3. Last activity
      const latestAuditLog = await ctx.db
        .query("approvalAuditLogs")
        .withIndex("by_approval", (q) => q.eq("approvalId", approval._id))
        .order("desc")
        .first()

      let lastActivity = null
      if (latestAuditLog) {
        // Fetch actor user profile details
        let actor = null
        if (latestAuditLog.actorId && latestAuditLog.actorId.length >= 15) {
          try {
            const userRecord = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: latestAuditLog.actorId }],
              }
            )) as any
            if (userRecord) {
              actor = {
                name: userRecord.name,
                image: userRecord.image,
              };
            }
          } catch (e) {
            console.error(`Failed to find user profile for audit log actor: ${latestAuditLog.actorId}`, e);
          }
        }
        lastActivity = {
          action: latestAuditLog.action,
          timestamp: latestAuditLog.timestamp,
          actor: actor || { name: "System" },
          actorId: latestAuditLog.actorId,
        };
      }

      enrichedApprovals.push({
        ...approval,
        documentCount,
        chatCount,
        unreadChatCount,
        lastActivity,
      })
    }

    return enrichedApprovals
  },
})

export const getApproval = query({
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
      throw new Error("Permission denied to read this approval request")
    }

    return approval
  },
})

export const updateApprovalDetails = mutation({
  args: {
    approvalId: v.id("approvals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot edit archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id

    if (!isAdminOrOwner && !isCreator) {
      throw new Error("Unauthorized to edit approval details")
    }

    const patch: any = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.description !== undefined) patch.description = args.description
    if (args.dueDate !== undefined) {
      patch.dueDate = args.dueDate === 0 ? undefined : args.dueDate
    }

    await ctx.db.patch(args.approvalId, patch)

    // Log details change
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: "DETAILS_UPDATED",
      details: patch,
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const updateApprovalStatus = mutation({
  args: {
    approvalId: v.id("approvals"),
    status: v.string(), // "Pending" | "Approved" | "Declined" | "Rework"
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot update archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)

    // Both requester (creator) and approver can change the status
    if (!isAdminOrOwner && !isCreator && !isApprover) {
      throw new Error("Unauthorized to change approval request status")
    }

    const previousStatus = approval.status
    if (previousStatus === args.status) return { success: true }

    await ctx.db.patch(args.approvalId, { status: args.status })

    // Log status change
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: "STATUS_CHANGED",
      details: { previous: previousStatus, new: args.status, comment: args.comment },
      timestamp: Date.now(),
    })

    // If this approval request is linked to a task completion, update the task status accordingly
    if (approval.taskId) {
      const task = await ctx.db.get(approval.taskId)
      if (task) {
        const prevTaskStatus = task.status
        let nextTaskStatus = prevTaskStatus
        let chatMessage = ""

        if (args.status === "Approved") {
          nextTaskStatus = "Completed"
          chatMessage = `approved the task completion request. Task marked as Completed.`
          
          // Spawn next instance if recurring
          if (task.recurrence) {
            await spawnNextRecurringInstance(ctx, task)
          }
        } else if (args.status === "Declined") {
          nextTaskStatus = "In Progress"
          chatMessage = `declined task completion request. Task reverted to In Progress. Comment: ${args.comment || "No comment provided."}`
        } else if (args.status === "Rework") {
          nextTaskStatus = "In Progress"
          chatMessage = `requested rework on the task completion. Task status set back to In Progress. Comment: ${args.comment || "No comment provided."}`
        }

        if (nextTaskStatus !== prevTaskStatus) {
          await ctx.db.patch(approval.taskId, { status: nextTaskStatus })
          
          await ctx.db.insert("taskAuditLogs", {
            taskId: approval.taskId,
            actorId: user._id,
            action: "STATUS_CHANGED",
            details: { previous: prevTaskStatus, new: nextTaskStatus, approvalId: approval._id, comment: args.comment },
            timestamp: Date.now(),
          })

          await ctx.db.insert("taskChats", {
            taskId: approval.taskId,
            userId: user._id,
            content: chatMessage,
            isEdited: false,
            isDeleted: false,
            isSystem: true,
            statusChange: nextTaskStatus,
          })
        }
      }
    } else {
      // If Rework is selected, automatically create a task for the creator to rework on the request, due at EOD.
      if (args.status === "Rework") {
        const now = new Date()
        // EOD timestamp
        const eod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()

        const taskId = await ctx.db.insert("tasks", {
          title: `Rework: ${approval.title}`,
          description: `Approval request "${approval.title}" needs rework. Comment: ${args.comment || "No comment provided."}`,
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

        // Log the generated task creation
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

    // Send notifications to creator and subscribers
    const recipients = new Set<string>()
    recipients.add(approval.creatorId)
    if (approval.subscriberIds) {
      for (const subId of approval.subscriberIds) {
        recipients.add(subId)
      }
    }
    recipients.delete(user._id) // Don't notify the person who triggered the change

    for (const recipientId of recipients) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
        userId: recipientId,
        organizationId: approval.organizationId,
        templateName: "approval_status_changed",
        parameters: {
          approvalTitle: approval.title,
          updaterName: user.name || user.email || "Someone",
          newStatus: args.status,
          comment: args.comment || "No comment provided.",
        },
      })
    }

    return { success: true }
  },
})

export const inviteApprovers = mutation({
  args: {
    approvalId: v.id("approvals"),
    approverIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot modify archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id

    if (!isAdminOrOwner && !isCreator) {
      throw new Error("Unauthorized to modify approvers list")
    }

    const cleanApprovers = Array.from(new Set(args.approverIds))
    // Remove from subscribers if they are now approvers
    const currentSubscribers = approval.subscriberIds || []
    const cleanSubscribers = currentSubscribers.filter((id) => !cleanApprovers.includes(id))

    await ctx.db.patch(args.approvalId, {
      approverIds: cleanApprovers,
      subscriberIds: cleanSubscribers,
    })

    // Log action
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: "APPROVERS_UPDATED",
      details: { approverIds: cleanApprovers },
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const inviteSubscribers = mutation({
  args: {
    approvalId: v.id("approvals"),
    subscriberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")
    if (approval.isArchived) throw new Error("Cannot modify archived approval request")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id
    const isApprover = approval.approverIds.includes(user._id)

    if (!isAdminOrOwner && !isCreator && !isApprover) {
      throw new Error("Unauthorized to modify subscribers list")
    }

    // Filter subscribers to exclude anyone who is already an approver
    const cleanSubscribers = Array.from(
      new Set(args.subscriberIds.filter((id) => !approval.approverIds.includes(id)))
    )

    await ctx.db.patch(args.approvalId, {
      subscriberIds: cleanSubscribers,
    })

    // Log action
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: "SUBSCRIBERS_UPDATED",
      details: { subscriberIds: cleanSubscribers },
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const archiveApproval = mutation({
  args: {
    approvalId: v.id("approvals"),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const approval = await ctx.db.get(args.approvalId)
    if (!approval) throw new Error("Approval request not found")

    const member = await requireMember(ctx, user._id, approval.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = approval.creatorId === user._id

    if (!isAdminOrOwner && !isCreator) {
      throw new Error("Unauthorized to archive approval request")
    }

    await ctx.db.patch(args.approvalId, { isArchived: args.isArchived })

    // Log archive state
    await ctx.db.insert("approvalAuditLogs", {
      approvalId: args.approvalId,
      actorId: user._id,
      action: args.isArchived ? "APPROVAL_ARCHIVED" : "APPROVAL_UNARCHIVED",
      details: {},
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const getApprovalAuditLogs = query({
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
      throw new Error("Permission denied to read audit logs for this approval request")
    }

    return await ctx.db
      .query("approvalAuditLogs")
      .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
      .collect()
  },
})
