import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components } from "./_generated/api"

export const DEFAULT_PERMISSIONS = {
  owner: {
    tasks: ["create", "read_all", "assign", "delete", "archive", "cancel", "complete"],
  },
  admin: {
    tasks: ["create", "read_all", "assign", "delete", "archive", "cancel", "complete"],
  },
  member: {
    // Members can create, but only read their own, and cannot complete or cancel.
    tasks: ["create", "read_own"],
  },
}

export const getPermissions = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    // Requires authentication
    const userId = await ctx.auth.getUserIdentity()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const rolePermissions = await ctx.db
      .query("rolePermissions")
      .withIndex("by_organization_role", (q: any) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect()

    return rolePermissions
  },
})

export const setPermissions = mutation({
  args: {
    organizationId: v.string(),
    role: v.string(),
    resource: v.string(),
    actions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Requires authentication and must be owner or admin
    const userId = await ctx.auth.getUserIdentity()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Check if the caller is an admin or owner of the organization
    const activeMemberResult = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "member",
        where: [
          { field: "userId", value: userId.subject },
          { field: "organizationId", value: args.organizationId },
        ],
        paginationOpts: { numItems: 1, cursor: null },
      }
    )) as any

    const activeMember = activeMemberResult?.page?.[0]

    if (!activeMember || (activeMember.role !== "admin" && activeMember.role !== "owner")) {
      throw new Error("Unauthorized to modify permissions")
    }

    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("by_organization_role", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("role", args.role)
      )
      .filter((q) => q.eq(q.field("resource"), args.resource))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { actions: args.actions })
    } else {
      await ctx.db.insert("rolePermissions", {
        organizationId: args.organizationId,
        role: args.role,
        resource: args.resource,
        actions: args.actions,
      })
    }

    return { success: true }
  },
})

export async function hasPermission(
  ctx: any,
  organizationId: string,
  userRole: string,
  resource: string,
  action: string
): Promise<boolean> {
  const customPermissions = await ctx.db
    .query("rolePermissions")
    .withIndex("by_organization_role", (q: any) =>
      q.eq("organizationId", organizationId).eq("role", userRole)
    )
    .filter((q: any) => q.eq(q.field("resource"), resource))
    .first()

  if (customPermissions) {
    return customPermissions.actions.includes(action)
  }

  // Fallback to default
  const defaults = (DEFAULT_PERMISSIONS as any)[userRole]?.[resource] || []
  return defaults.includes(action)
}
