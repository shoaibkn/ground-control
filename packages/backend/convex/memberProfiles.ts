import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { authComponent } from "./auth"
import { components } from "./_generated/api"

export const getProfile = query({
  args: {
    memberId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const callerUser = await authComponent.getAuthUser(ctx)
    if (!callerUser) {
      throw new Error("Unauthorized")
    }

    // Basic check to see if caller is a member of this org
    const callerMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: callerUser._id },
        ],
      }
    )) as any

    if (!callerMember) {
      throw new Error("Unauthorized")
    }

    // Now get the profile
    const profile = await ctx.db
      .query("memberProfiles")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .first()

    return profile
  },
})

export const upsertProfile = mutation({
  args: {
    memberId: v.string(),
    organizationId: v.string(),
    address: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    integrations: v.optional(
      v.object({
        email: v.optional(v.boolean()),
        sms: v.boolean(),
        rcs: v.boolean(),
        whatsapp: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const callerUser = await authComponent.getAuthUser(ctx)
    if (!callerUser) {
      throw new Error("Unauthorized")
    }

    // Check if caller is admin or owner of the org
    const callerMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: callerUser._id },
        ],
      }
    )) as any

    if (
      !callerMember ||
      (callerMember.role !== "owner" && callerMember.role !== "admin")
    ) {
      throw new Error("Unauthorized to perform this action")
    }

    const existingProfile = await ctx.db
      .query("memberProfiles")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .first()

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        address: args.address !== undefined ? args.address : existingProfile.address,
        position: args.position !== undefined ? args.position : existingProfile.position,
        department: args.department !== undefined ? args.department : existingProfile.department,
        phoneNumber: args.phoneNumber !== undefined ? args.phoneNumber : existingProfile.phoneNumber,
        integrations: args.integrations !== undefined ? args.integrations : existingProfile.integrations,
      })
    } else {
      await ctx.db.insert("memberProfiles", {
        memberId: args.memberId,
        address: args.address,
        position: args.position,
        department: args.department,
        phoneNumber: args.phoneNumber,
        integrations: args.integrations ?? { email: true, sms: false, rcs: false, whatsapp: false },
      })
    }

    return { success: true }
  },
})

export const getOrganizationProfiles = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const callerUser = await authComponent.getAuthUser(ctx)
    if (!callerUser) {
      throw new Error("Unauthorized")
    }

    // Check if caller is member of this org
    const callerMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: callerUser._id },
        ],
      }
    )) as any

    if (!callerMember) {
      throw new Error("Unauthorized")
    }

    // Get all members of the organization
    const membersResult = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "member",
        where: [{ field: "organizationId", value: args.organizationId }],
        paginationOpts: { numItems: 1000, cursor: null },
      }
    )) as any

    const members = membersResult?.page || []
    
    const profiles = []
    for (const member of members) {
      if (member && member.userId) {
        const profile = await ctx.db
          .query("memberProfiles")
          .withIndex("by_memberId", (q) => q.eq("memberId", member.userId))
          .first()
        if (profile) {
          profiles.push(profile)
        }
      }
    }

    return profiles
  },
})
