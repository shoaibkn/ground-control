import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components } from "./_generated/api"
import { hasPermission } from "./permissions"

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

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(), // "Low" | "Normal" | "High" | "Urgent" | "Critical"
    dueDate: v.optional(v.number()),
    organizationId: v.string(),
    assigneeIds: v.array(v.string()),
    collaboratorIds: v.optional(v.array(v.string())),
    subscriberIds: v.optional(v.array(v.string())),
    timeOfDay: v.optional(v.string()),
    recurrence: v.optional(
      v.object({
        frequency: v.string(),
        startDate: v.number(),
        endDate: v.optional(v.number()),
        timeOfDay: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canCreate = await hasPermission(ctx, args.organizationId, member.role, "tasks", "create")
    if (!canCreate) {
      throw new Error("Permission denied to create tasks")
    }

    const canAssign = await hasPermission(ctx, args.organizationId, member.role, "tasks", "assign")
    let finalAssignees = args.assigneeIds
    let finalCollaborators = args.collaboratorIds || []
    let finalSubscribers = args.subscriberIds || []

    // If they cannot assign to others, force assignee to be themselves and clear others
    if (!canAssign) {
      finalAssignees = [user._id]
      finalCollaborators = []
      finalSubscribers = []
    }

    // Ensure role exclusivity: Assignees > Collaborators > Subscribers
    const assigneeSet = new Set(finalAssignees)
    const collaboratorSet = new Set(finalCollaborators.filter((id: string) => !assigneeSet.has(id)))
    const subscriberSet = new Set(finalSubscribers.filter((id: string) => !assigneeSet.has(id) && !collaboratorSet.has(id)))

    const cleanAssignees = Array.from(assigneeSet)
    const cleanCollaborators = Array.from(collaboratorSet)
    const cleanSubscribers = Array.from(subscriberSet)

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      priority: args.priority || "Normal",
      status: "Pending",
      dueDate: args.dueDate || args.recurrence?.startDate,
      timeOfDay: args.timeOfDay || args.recurrence?.timeOfDay,
      recurrence: args.recurrence,
      creatorId: user._id,
      organizationId: args.organizationId,
      assigneeIds: cleanAssignees,
      collaboratorIds: cleanCollaborators,
      subscriberIds: cleanSubscribers,
      isArchived: false,
    })

    // Log the creation
    await ctx.db.insert("taskAuditLogs", {
      taskId,
      actorId: user._id,
      action: "TASK_CREATED",
      details: { 
        title: args.title, 
        assignees: cleanAssignees,
        collaborators: cleanCollaborators,
        subscribers: cleanSubscribers
      },
      timestamp: Date.now(),
    })

    // TODO: Send emails to assignees via Resend/Cron/Actions

    return taskId
  },
})

export const getTasks = query({
  args: { organizationId: v.string(), showArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canReadAll = await hasPermission(ctx, args.organizationId, member.role, "tasks", "read_all")
    const canReadOwn = await hasPermission(ctx, args.organizationId, member.role, "tasks", "read_own")

    if (!canReadAll && !canReadOwn) {
      throw new Error("Permission denied to read tasks")
    }

    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))

    if (!args.showArchived) {
      tasksQuery = tasksQuery.filter((q) => q.eq(q.field("isArchived"), false))
    }

    const tasks = await tasksQuery.collect()

    const filteredTasks = canReadAll
      ? tasks
      : tasks.filter(
          (task) =>
            task.creatorId === user._id ||
            task.assigneeIds.includes(user._id) ||
            task.collaboratorIds?.includes(user._id) ||
            task.subscriberIds?.includes(user._id)
        )

    const userStarredTasks = await ctx.db
      .query("starredTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    const starredTaskIdsSet = new Set(userStarredTasks.map((st) => st.taskId))

    const enrichedTasks = []
    for (const task of filteredTasks) {
      // 1. Documents count
      const attachments = await ctx.db
        .query("taskAttachments")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect()
      const documentCount = attachments.length

      // 2. Comments count (non-deleted)
      const comments = await ctx.db
        .query("taskComments")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect()
      
      const activeComments = comments.filter((c) => !c.isDeleted)
      const commentCount = activeComments.length

      // Unread comments count
      const readReceipt = await ctx.db
        .query("taskReadReceipts")
        .withIndex("by_task_user", (q) => q.eq("taskId", task._id).eq("userId", user._id))
        .first()

      const lastReadTime = readReceipt?.lastReadTime ?? 0
      const unreadCommentCount = activeComments.filter(
        (c) => c.userId !== user._id && c._creationTime > lastReadTime
      ).length

      // 3. Last activity
      const latestAuditLog = await ctx.db
        .query("taskAuditLogs")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .order("desc")
        .first()

      const latestComment = await ctx.db
        .query("taskComments")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .order("desc")
        .first()

      let lastActivity = null
      
      // Determine if the latest comment is newer than the latest audit log
      if (latestComment && latestComment._creationTime > (latestAuditLog?.timestamp ?? 0)) {
        // Resolve comment author profile
        let actor = null
        if (latestComment.userId && latestComment.userId.length >= 15) {
          try {
            const userRecord = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: latestComment.userId }],
              }
            )) as any
            if (userRecord) {
              actor = {
                id: userRecord._id,
                name: userRecord.name,
                email: userRecord.email,
                image: userRecord.image,
              }
            }
          } catch (e) {
            console.error(`Failed to find user profile for comment author: ${latestComment.userId}`, e)
          }
        }
        lastActivity = {
          action: "COMMENT_ADDED",
          timestamp: latestComment._creationTime,
          actor: actor || { name: "Unknown Member" },
        }
      } else if (latestAuditLog) {
        // Resolve audit log actor profile
        const isSystemActor = latestAuditLog.actorId.toUpperCase() === "SYSTEM"
        let actor = null
        if (!isSystemActor && latestAuditLog.actorId && latestAuditLog.actorId.length >= 15) {
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
                id: userRecord._id,
                name: userRecord.name,
                email: userRecord.email,
                image: userRecord.image,
              }
            }
          } catch (e) {
            console.error(`Failed to find user profile for audit log actor: ${latestAuditLog.actorId}`, e)
          }
        }
        lastActivity = {
          action: latestAuditLog.action,
          timestamp: latestAuditLog.timestamp,
          actor: actor || (isSystemActor ? { name: "System" } : { name: "Unknown Member" }),
        }
      } else {
        // Fallback to task creation
        let actor = null
        if (task.creatorId && task.creatorId.length >= 15) {
          try {
            const userRecord = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: task.creatorId }],
              }
            )) as any
            if (userRecord) {
              actor = {
                id: userRecord._id,
                name: userRecord.name,
                email: userRecord.email,
                image: userRecord.image,
              }
            }
          } catch (e) {
            console.error(`Failed to find user profile for task creator: ${task.creatorId}`, e)
          }
        }
        lastActivity = {
          action: "TASK_CREATED",
          timestamp: task._creationTime,
          actor: actor || { name: "Unknown Creator" },
        }
      }

      enrichedTasks.push({
        ...task,
        documentCount,
        commentCount,
        unreadCommentCount,
        lastActivity,
        isStarred: starredTaskIdsSet.has(task._id),
      })
    }

    return enrichedTasks
  },
})

export function calculateNextDueDate(currentDueDate: number, frequency: string, endDate?: number): number | null {
  const date = new Date(currentDueDate)
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1)
      break
    case "weekly":
      date.setDate(date.getDate() + 7)
      break
    case "bi-weekly":
      date.setDate(date.getDate() + 14)
      break
    case "monthly":
      date.setMonth(date.getMonth() + 1)
      break
    case "quarterly":
      date.setMonth(date.getMonth() + 3)
      break
    case "yearly":
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      return null
  }
  const nextTime = date.getTime()
  if (endDate && nextTime > endDate) {
    return null
  }
  return nextTime
}

export async function spawnNextRecurringInstance(ctx: any, task: any) {
  if (!task.recurrence) return

  const nextDueDate = calculateNextDueDate(
    task.dueDate || task.recurrence.startDate,
    task.recurrence.frequency,
    task.recurrence.endDate
  )

  if (nextDueDate !== null) {
    // 1. Insert new task copy
    const newTaskId = await ctx.db.insert("tasks", {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "Pending",
      dueDate: nextDueDate,
      timeOfDay: task.recurrence.timeOfDay || task.timeOfDay,
      recurrence: task.recurrence,
      creatorId: task.creatorId,
      organizationId: task.organizationId,
      assigneeIds: task.assigneeIds,
      collaboratorIds: task.collaboratorIds || [],
      subscriberIds: task.subscriberIds || [],
      isArchived: false,
    })

    // 2. Clone subtasks
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q: any) => q.eq("taskId", task._id))
      .collect()

    for (const sub of subtasks) {
      await ctx.db.insert("subtasks", {
        taskId: newTaskId,
        title: sub.title,
        isCompleted: false,
        creatorId: sub.creatorId,
        createdAt: Date.now(),
      })
    }

    // 3. Log audit log for new task
    await ctx.db.insert("taskAuditLogs", {
      taskId: newTaskId,
      actorId: "SYSTEM",
      action: "TASK_CREATED",
      details: {
        title: task.title,
        assignees: task.assigneeIds,
        collaborators: task.collaboratorIds || [],
        subscribers: task.subscriberIds || [],
        isRecurringInstance: true,
      },
      timestamp: Date.now(),
    })

    // 4. Log audit log for old task
    await ctx.db.insert("taskAuditLogs", {
      taskId: task._id,
      actorId: "SYSTEM",
      action: "RECURRING_INSTANCE_SPAWNED",
      details: {
        newTaskId,
        nextDueDate,
      },
      timestamp: Date.now(),
    })
  }

  // 5. Update old task: mark isArchived: true, clear recurrence
  await ctx.db.patch(task._id, {
    isArchived: true,
    recurrence: undefined,
  })
}

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(), // "Pending" | "In Progress" | "Under Review" | "Completed" | "Cancelled"
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    if (task.isArchived) throw new Error("Cannot update archived task")

    const member = await requireMember(ctx, user._id, task.organizationId)

    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isCreator = task.creatorId === user._id
    const canComplete = await hasPermission(ctx, task.organizationId, member.role, "tasks", "complete")
    const canCancel = await hasPermission(ctx, task.organizationId, member.role, "tasks", "cancel")

    // State machine logic
    if (args.status === "Cancelled" && !canCancel) {
      throw new Error("Only admins/owners can cancel tasks")
    }
    
    if (args.status === "Completed" && !canComplete) {
      // If a member marks it as completed, it should actually go to "Under Review"
      // But let's allow them to request "Completed" and we intercept it
      if (isAssignee || isCollaborator || isCreator) {
        args.status = "Under Review"
      } else {
        throw new Error("Unauthorized to complete task")
      }
    }

    // Member moving forward
    if (args.status === "In Progress" || args.status === "Under Review") {
      if (!isAssignee && !isCollaborator && !isCreator && !canComplete) {
        throw new Error("Permission denied to update task status")
      }
    }

    const previousStatus = task.status
    await ctx.db.patch(args.taskId, { status: args.status })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "STATUS_CHANGED",
      details: { previous: previousStatus, new: args.status },
      timestamp: Date.now(),
    })

    // If marked Completed and has recurrence, spawn next instance and archive this one
    if (args.status === "Completed" && task.recurrence) {
      await spawnNextRecurringInstance(ctx, task)
    }

    return { success: true, newStatus: args.status }
  },
})

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) return null
    const member = await requireMember(ctx, user._id, task.organizationId)

    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false

    if (!isAdminOrOwner && !isCreator && !isAssignee && !isCollaborator && !isSubscriber) {
      throw new Error("Permission denied to view this task")
    }

    const starred = await ctx.db
      .query("starredTasks")
      .withIndex("by_user_task", (q) => q.eq("userId", user._id).eq("taskId", task._id))
      .first()

    return {
      ...task,
      isStarred: !!starred,
    }
  },
})

export const updateTaskDetails = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)

    // Check if the user is creator (assigner) or admin/owner
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    if (!isCreator && !isAdminOrOwner) {
      throw new Error("Only the creator/assigner or organization admins/owners can edit task details")
    }

    const patch: Record<string, any> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.description !== undefined) patch.description = args.description
    if (args.priority !== undefined) patch.priority = args.priority
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate

    await ctx.db.patch(args.taskId, patch)

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "TASK_UPDATED",
      details: patch,
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const inviteAssignees = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id

    // Only assigner (creator) or admin can change assignees
    if (!isCreator && !isAdminOrOwner) {
      throw new Error("Only the creator/assigner or organization admins/owners can update assignees")
    }

    const cleanAssignees = Array.from(new Set(args.assigneeIds))
    const cleanCollaborators = (task.collaboratorIds || []).filter((id: string) => !cleanAssignees.includes(id))
    const cleanSubscribers = (task.subscriberIds || []).filter((id: string) => !cleanAssignees.includes(id))

    await ctx.db.patch(args.taskId, {
      assigneeIds: cleanAssignees,
      collaboratorIds: cleanCollaborators,
      subscriberIds: cleanSubscribers,
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "ASSIGNEES_UPDATED",
      details: { previous: task.assigneeIds, new: cleanAssignees },
      timestamp: Date.now(),
    })

    return { success: true, assigneeIds: cleanAssignees }
  },
})

export const updateCollaborators = mutation({
  args: {
    taskId: v.id("tasks"),
    collaboratorIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)

    // Only assigner and assignees can add/remove collaborators
    if (!isCreator && !isAssignee && !isAdminOrOwner) {
      throw new Error("Only the creator or assignees can manage collaborators")
    }

    const cleanCollaborators = (Array.from(new Set(args.collaboratorIds)) as string[]).filter(id => !task.assigneeIds.includes(id))
    const cleanSubscribers = (task.subscriberIds || []).filter((id: string) => !cleanCollaborators.includes(id))

    await ctx.db.patch(args.taskId, {
      collaboratorIds: cleanCollaborators,
      subscriberIds: cleanSubscribers,
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "COLLABORATORS_UPDATED",
      details: { previous: task.collaboratorIds || [], new: cleanCollaborators },
      timestamp: Date.now(),
    })

    return { success: true, collaboratorIds: cleanCollaborators }
  },
})

export const updateSubscribers = mutation({
  args: {
    taskId: v.id("tasks"),
    subscriberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false

    // Only assigner, assignees, and collaborators can add/remove subscribers
    if (!isCreator && !isAssignee && !isCollaborator && !isAdminOrOwner) {
      throw new Error("Only the creator, assignees, or collaborators can manage subscribers")
    }

    const cleanSubscribers = (Array.from(new Set(args.subscriberIds)) as string[]).filter(id => !task.assigneeIds.includes(id))
    const cleanCollaborators = (task.collaboratorIds || []).filter((id: string) => !cleanSubscribers.includes(id))

    await ctx.db.patch(args.taskId, {
      collaboratorIds: cleanCollaborators,
      subscriberIds: cleanSubscribers,
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "SUBSCRIBERS_UPDATED",
      details: { previous: task.subscriberIds || [], new: cleanSubscribers },
      timestamp: Date.now(),
    })

    return { success: true, subscriberIds: cleanSubscribers }
  },
})

export const createSubtask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    // Verify user is assignee, creator, collaborator, or org admin/owner
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCollaborator && !isCreator && !isAdminOrOwner) {
      throw new Error("Only the creator, assignees, collaborators, or organization admins can add subtasks")
    }

    const subtaskId = await ctx.db.insert("subtasks", {
      taskId: args.taskId,
      title: args.title,
      isCompleted: false,
      creatorId: user._id,
      createdAt: Date.now(),
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "SUBTASK_CREATED",
      details: { subtaskId, title: args.title },
      timestamp: Date.now(),
    })

    return subtaskId
  },
})

export const toggleSubtask = mutation({
  args: {
    subtaskId: v.id("subtasks"),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const subtask = await ctx.db.get(args.subtaskId)
    if (!subtask) throw new Error("Subtask not found")

    const task = await ctx.db.get(subtask.taskId)
    if (!task) throw new Error("Parent task not found")

    const member = await requireMember(ctx, user._id, task.organizationId)
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    // Verify user is assignee, creator, collaborator, or org admin/owner
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCollaborator && !isCreator && !isAdminOrOwner) {
      throw new Error("Only the creator, assignees, collaborators, or organization admins can toggle subtasks")
    }

    await ctx.db.patch(args.subtaskId, {
      isCompleted: args.isCompleted,
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: subtask.taskId,
      actorId: user._id,
      action: "SUBTASK_TOGGLED",
      details: { subtaskId: args.subtaskId, title: subtask.title, isCompleted: args.isCompleted },
      timestamp: Date.now(),
    })

    return { success: true }
  },
})

export const getSubtasks = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) return []

    await requireMember(ctx, user._id, task.organizationId)

    return await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect()
  },
})

export const getTaskAuditLogs = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) return []

    await requireMember(ctx, user._id, task.organizationId)

    const logs = await ctx.db
      .query("taskAuditLogs")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect()

    // Resolve actor profiles for each log entry
    const logsWithActors = []
    for (const log of logs) {
      const isSystemActor = log.actorId.toUpperCase() === "SYSTEM"
      let actor = null

      if (!isSystemActor && log.actorId && log.actorId.length >= 15) {
        try {
          actor = (await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
              model: "user",
              where: [{ field: "_id", value: log.actorId }],
            }
          )) as any
        } catch (err) {
          console.error(`Failed to find user profile for actorId: ${log.actorId}`, err)
        }
      }

      logsWithActors.push({
        ...log,
        actor: isSystemActor ? {
          name: "System",
          email: "",
          image: "",
        } : actor ? {
          name: actor.name,
          email: actor.email,
          image: actor.image,
        } : {
          name: "Unknown Member",
          email: "",
          image: ""
        }
      })
    }

    return logsWithActors
  },
})

export const toggleReaction = mutation({
  args: {
    taskId: v.id("tasks"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    // Verify workspace membership
    const member = await requireMember(ctx, user._id, task.organizationId)

    // Verify access (Creator, Assignee, Collaborator, Subscriber, or Admin/Owner)
    const isCreator = task.creatorId === user._id
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCollaborator = task.collaboratorIds?.includes(user._id) || false
    const isSubscriber = task.subscriberIds?.includes(user._id) || false
    const isAdminOrOwner = member.role === "admin" || member.role === "owner"

    if (!isCreator && !isAssignee && !isCollaborator && !isSubscriber && !isAdminOrOwner) {
      throw new Error("Permission denied to react to this task")
    }

    const currentReactions = task.reactions || []
    const existingIndex = currentReactions.findIndex(
      (r) => r.userId === user._id && r.emoji === args.emoji
    )

    let newReactions = [...currentReactions]
    if (existingIndex > -1) {
      // Remove reaction
      newReactions.splice(existingIndex, 1)
    } else {
      // Add reaction
      newReactions.push({ userId: user._id, emoji: args.emoji })
    }

    await ctx.db.patch(args.taskId, {
      reactions: newReactions,
    })

    return { success: true }
  },
})

export const toggleStarTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new Error("Task not found")

    await requireMember(ctx, user._id, task.organizationId)

    const existing = await ctx.db
      .query("starredTasks")
      .withIndex("by_user_task", (q) => q.eq("userId", user._id).eq("taskId", args.taskId))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { isStarred: false }
    } else {
      await ctx.db.insert("starredTasks", {
        userId: user._id,
        taskId: args.taskId,
      })
      return { isStarred: true }
    }
  },
})
