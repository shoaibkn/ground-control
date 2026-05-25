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

    // If they cannot assign to others, force assignee to be themselves
    if (!canAssign) {
      finalAssignees = [user._id]
    }

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      priority: args.priority || "Normal",
      status: "Pending",
      dueDate: args.dueDate,
      creatorId: user._id,
      organizationId: args.organizationId,
      assigneeIds: finalAssignees,
      isArchived: false,
    })

    // Log the creation
    await ctx.db.insert("taskAuditLogs", {
      taskId,
      actorId: user._id,
      action: "TASK_CREATED",
      details: { title: args.title, assignees: finalAssignees },
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
      .filter((q) => q.eq(q.field("isArchived"), args.showArchived ?? false))

    const tasks = await tasksQuery.collect()

    if (canReadAll) {
      return tasks
    }

    // Only read own
    return tasks.filter((task) => task.creatorId === user._id || task.assigneeIds.includes(user._id))
  },
})

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
      if (isAssignee || isCreator) {
        args.status = "Under Review"
      } else {
        throw new Error("Unauthorized to complete task")
      }
    }

    // Member moving forward
    if (args.status === "In Progress" || args.status === "Under Review") {
      if (!isAssignee && !isCreator && !canComplete) {
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

    return { success: true, newStatus: args.status }
  },
})

export const getTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task) return null
    await requireMember(ctx, user._id, task.organizationId)
    return task
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

    await requireMember(ctx, user._id, task.organizationId)

    // Check if the user is creator or an assignee of the task
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCreator) {
      throw new Error("Only the creator or assignees can edit task details")
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

    await requireMember(ctx, user._id, task.organizationId)

    // Verify user is assignee or creator
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCreator) {
      throw new Error("Only the creator or assignees can invite members")
    }

    // Merge assignees, avoiding duplicates
    const uniqueAssignees = Array.from(new Set([...task.assigneeIds, ...args.assigneeIds]))

    await ctx.db.patch(args.taskId, {
      assigneeIds: uniqueAssignees,
    })

    await ctx.db.insert("taskAuditLogs", {
      taskId: args.taskId,
      actorId: user._id,
      action: "ASSIGNEES_UPDATED",
      details: { previous: task.assigneeIds, new: uniqueAssignees },
      timestamp: Date.now(),
    })

    return { success: true, assigneeIds: uniqueAssignees }
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

    await requireMember(ctx, user._id, task.organizationId)

    // Verify user is assignee or creator
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCreator) {
      throw new Error("Only the creator or assignees can add subtasks")
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

    await requireMember(ctx, user._id, task.organizationId)

    // Verify user is assignee or creator
    const isAssignee = task.assigneeIds.includes(user._id)
    const isCreator = task.creatorId === user._id
    if (!isAssignee && !isCreator) {
      throw new Error("Only the creator or assignees can toggle subtasks")
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
