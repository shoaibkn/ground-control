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
    collaboratorIds: v.optional(v.array(v.string())),
    subscriberIds: v.optional(v.array(v.string())),
    isArchived: v.boolean(),
    lastOverdueNotifiedAt: v.optional(v.number()),
    timeOfDay: v.optional(v.string()),
    recurrence: v.optional(
      v.object({
        frequency: v.string(), // "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "yearly"
        startDate: v.number(), // timestamp
        endDate: v.optional(v.number()), // timestamp
        timeOfDay: v.optional(v.string()),
      })
    ),
    reactions: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          emoji: v.string(),
        })
      )
    ),
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

  taskReadReceipts: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(),
    lastReadTime: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_task_user", ["taskId", "userId"]),

  starredTasks: defineTable({
    userId: v.string(),
    taskId: v.id("tasks"),
  })
    .index("by_user", ["userId"])
    .index("by_user_task", ["userId", "taskId"]),
})
