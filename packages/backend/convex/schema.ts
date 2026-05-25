import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  memberProfiles: defineTable({
    memberId: v.string(), // ID from betterAuth member table
    address: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    integrations: v.optional(
      v.object({
        sms: v.boolean(),
        rcs: v.boolean(),
        whatsapp: v.boolean(),
      })
    ),
  }).index("by_memberId", ["memberId"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(),
    status: v.string(),
    dueDate: v.optional(v.number()),
    creatorId: v.string(),
    organizationId: v.string(),
    assigneeIds: v.array(v.string()),
    isArchived: v.boolean(),
    lastOverdueNotifiedAt: v.optional(v.number()),
  }).index("by_organization", ["organizationId"]),

  taskComments: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(),
    content: v.string(),
    originalContent: v.optional(v.string()),
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    attachmentIds: v.optional(v.array(v.id("taskAttachments"))),
  }).index("by_task", ["taskId"]),

  taskAttachments: defineTable({
    taskId: v.id("tasks"),
    uploaderId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    r2Key: v.string(),
  }).index("by_task", ["taskId"]),

  taskAuditLogs: defineTable({
    taskId: v.id("tasks"),
    actorId: v.string(),
    action: v.string(),
    details: v.any(),
    timestamp: v.number(),
  }).index("by_task", ["taskId"]),

  rolePermissions: defineTable({
    organizationId: v.string(),
    role: v.string(),
    resource: v.string(),
    actions: v.array(v.string()),
  }).index("by_organization_role", ["organizationId", "role"]),

  subtasks: defineTable({
    taskId: v.id("tasks"),
    title: v.string(),
    isCompleted: v.boolean(),
    creatorId: v.string(),
    createdAt: v.number(),
  }).index("by_task", ["taskId"]),
})
