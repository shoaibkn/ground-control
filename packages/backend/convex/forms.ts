import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { components } from "./_generated/api"
import { spawnNextRecurringInstance } from "./tasks"
import { hasPermission } from "./permissions"

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

export const createForm = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        placeholder: v.optional(v.string()),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      })
    ),
    isStandalone: v.boolean(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canCreate = await hasPermission(ctx, args.organizationId, member.role, "forms", "create")
    if (!canCreate) {
      throw new Error("Permission denied to create forms")
    }

    const formId = await ctx.db.insert("forms", {
      title: args.title,
      description: args.description,
      creatorId: user._id,
      organizationId: args.organizationId,
      fields: args.fields,
      isStandalone: args.isStandalone,
      createdAt: Date.now(),
    })

    return formId
  },
})

export const updateForm = mutation({
  args: {
    formId: v.id("forms"),
    title: v.string(),
    description: v.optional(v.string()),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        placeholder: v.optional(v.string()),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      })
    ),
    isStandalone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const form = await ctx.db.get(args.formId)
    if (!form) throw new Error("Form not found")

    const member = await requireMember(ctx, user._id, form.organizationId)

    const isCreator = form.creatorId === user._id
    const canUpdate = isCreator || await hasPermission(ctx, form.organizationId, member.role, "forms", "update")
    if (!canUpdate) {
      throw new Error("Permission denied to update this form")
    }

    await ctx.db.patch(args.formId, {
      title: args.title,
      description: args.description,
      fields: args.fields,
      isStandalone: args.isStandalone,
    })

    return { success: true }
  },
})

export const deleteForm = mutation({
  args: {
    formId: v.id("forms"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const form = await ctx.db.get(args.formId)
    if (!form) throw new Error("Form not found")

    const member = await requireMember(ctx, user._id, form.organizationId)

    const isCreator = form.creatorId === user._id
    const canDelete = isCreator || await hasPermission(ctx, form.organizationId, member.role, "forms", "delete")
    if (!canDelete) {
      throw new Error("Permission denied to delete this form")
    }

    await ctx.db.delete(args.formId)
    return { success: true }
  },
})

export const getForms = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const member = await requireMember(ctx, user._id, args.organizationId)

    const canReadAll = await hasPermission(ctx, args.organizationId, member.role, "forms", "read_all")
    let forms = await ctx.db
      .query("forms")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect()

    if (!canReadAll) {
      forms = forms.filter((f) => f.creatorId === user._id)
    }

    return forms
  },
})

export const getForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const form = await ctx.db.get(args.formId)
    if (!form) return null

    await requireMember(ctx, user._id, form.organizationId)
    return form
  },
})

export const getFormResponses = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const form = await ctx.db.get(args.formId)
    if (!form) throw new Error("Form not found")

    const member = await requireMember(ctx, user._id, form.organizationId)

    const isCreator = form.creatorId === user._id
    const canViewResponses = isCreator || await hasPermission(ctx, form.organizationId, member.role, "forms", "read_all")
    if (!canViewResponses) {
      throw new Error("Permission denied to view responses for this form")
    }

    const responses = await ctx.db
      .query("formResponses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect()

    return responses
  },
})

export const submitFormResponse = mutation({
  args: {
    formId: v.id("forms"),
    answers: v.array(
      v.object({
        fieldId: v.string(),
        value: v.any(),
      })
    ),
    taskId: v.optional(v.id("tasks")),
    approvalId: v.optional(v.id("approvals")),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await requireMember(ctx, user._id, args.organizationId)

    const form = await ctx.db.get(args.formId)
    if (!form) throw new Error("Form not found")

    const responseId = await ctx.db.insert("formResponses", {
      formId: args.formId,
      submitterId: user._id,
      organizationId: args.organizationId,
      answers: args.answers,
      submittedAt: Date.now(),
      taskId: args.taskId,
      approvalId: args.approvalId,
    })

    // If attached to a task
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId)
      if (!task) throw new Error("Task not found")

      let targetStatus = "Completed"
      if (task.completedRequiresApproval && user._id !== task.creatorId) {
        targetStatus = "Pending Approval"

        // Create approval request linked to both task and form response
        await ctx.db.insert("approvals", {
          title: `Task Completion Approval: ${task.title}`,
          description: `Form responses submitted by assignee. Please review and approve completion.`,
          status: "Pending",
          creatorId: user._id,
          organizationId: task.organizationId,
          approverIds: [task.creatorId],
          subscriberIds: task.assigneeIds.filter(id => id !== user._id),
          isArchived: false,
          taskId: task._id,
          formId: args.formId,
          formResponseId: responseId,
        })
      }

      await ctx.db.patch(args.taskId, {
        status: targetStatus,
        formResponseId: responseId,
      })

      // Audit logs
      await ctx.db.insert("taskAuditLogs", {
        taskId: args.taskId,
        actorId: user._id,
        action: "FORM_SUBMITTED",
        details: { formId: args.formId, formResponseId: responseId, targetStatus },
        timestamp: Date.now(),
      })

      // Chat logs
      await ctx.db.insert("taskChats", {
        taskId: args.taskId,
        userId: user._id,
        content: `submitted required form: "${form.title}"`,
        isEdited: false,
        isDeleted: false,
        isSystem: true,
      })

      if (targetStatus === "Completed") {
        if (task.recurrence) {
          await spawnNextRecurringInstance(ctx, task)
        }
      }
    }

    // If attached directly to an approval request
    if (args.approvalId) {
      const approval = await ctx.db.get(args.approvalId)
      if (!approval) throw new Error("Approval not found")

      await ctx.db.patch(args.approvalId, {
        status: "Approved",
        formResponseId: responseId,
      })

      await ctx.db.insert("approvalAuditLogs", {
        approvalId: args.approvalId,
        actorId: user._id,
        action: "FORM_SUBMITTED",
        details: { formId: args.formId, formResponseId: responseId },
        timestamp: Date.now(),
      })

      await ctx.db.insert("approvalChats", {
        approvalId: args.approvalId,
        userId: user._id,
        content: `submitted required form: "${form.title}" and approved request`,
        isEdited: false,
        isDeleted: false,
        isSystem: true,
        statusChange: "Approved",
      })

      if (approval.taskId) {
        const task = await ctx.db.get(approval.taskId)
        if (task) {
          await ctx.db.patch(approval.taskId, {
            status: "Completed",
            formResponseId: responseId,
          })

          await ctx.db.insert("taskAuditLogs", {
            taskId: approval.taskId,
            actorId: user._id,
            action: "STATUS_CHANGED",
            details: { previous: task.status, new: "Completed" },
            timestamp: Date.now(),
          })

          await ctx.db.insert("taskChats", {
            taskId: approval.taskId,
            userId: user._id,
            content: `approved the task completion request. Form answers verified.`,
            isEdited: false,
            isDeleted: false,
            isSystem: true,
            statusChange: "Completed",
          })

          if (task.recurrence) {
            await spawnNextRecurringInstance(ctx, task)
          }
        }
      }
    }

    return responseId
  },
})

export const getFormResponse = query({
  args: { formResponseId: v.id("formResponses") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const response = await ctx.db.get(args.formResponseId)
    if (!response) return null

    await requireMember(ctx, user._id, response.organizationId)

    // 1. Allowed if the caller is the submitter
    if (response.submitterId === user._id) return response

    // 2. Allowed if the caller is the creator of the form
    const form = await ctx.db.get(response.formId)
    if (form && form.creatorId === user._id) return response

    // 3. Allowed if the caller has global "forms: read_all" permissions (admin/owner)
    const member = await requireMember(ctx, user._id, response.organizationId)
    const canReadAll = await hasPermission(ctx, response.organizationId, member.role, "forms", "read_all")
    if (canReadAll) return response

    // 4. Allowed if the caller is a participant on the linked task
    if (response.taskId) {
      const task = await ctx.db.get(response.taskId)
      if (task) {
        const isParticipant =
          task.creatorId === user._id ||
          task.assigneeIds?.includes(user._id) ||
          task.collaboratorIds?.includes(user._id) ||
          task.subscriberIds?.includes(user._id)
        if (isParticipant) return response
      }
    }

    // 5. Allowed if the caller is a participant on the linked approval request
    if (response.approvalId) {
      const approval = await ctx.db.get(response.approvalId)
      if (approval) {
        const isParticipant =
          approval.creatorId === user._id ||
          approval.approverIds?.includes(user._id) ||
          approval.subscriberIds?.includes(user._id)
        if (isParticipant) return response
      }
    }

    throw new Error("Permission denied to view this response")
  },
})
