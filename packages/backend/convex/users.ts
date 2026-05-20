import { query, mutation } from "./_generated/server"
import { authComponent } from "./auth"
import { v } from "convex/values"
import { components } from "./_generated/api"

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx)
  },
})

export const updateUserStatus = mutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    status: v.union(v.null(), v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get the authenticated caller
    const callerUser = await authComponent.getAuthUser(ctx)
    if (!callerUser) {
      throw new Error("Unauthorized")
    }

    const callerUserId = callerUser._id

    // 2. Verify that the caller is an owner or admin in this organization
    const callerMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: callerUserId },
        ],
      }
    )) as any

    if (
      !callerMember ||
      (callerMember.role !== "owner" && callerMember.role !== "admin")
    ) {
      throw new Error("Unauthorized to perform this action")
    }

    // 3. Prevent the caller from blocking themselves
    if (args.userId === callerUserId) {
      throw new Error("You cannot block yourself")
    }

    // 4. Verify that the target user is a member of the organization
    const targetMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: args.userId },
        ],
      }
    )) as any

    if (!targetMember) {
      throw new Error("User is not a member of this organization")
    }

    // 5. Update the target user's status in the database
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        update: { status: args.status },
        where: [{ field: "_id", value: args.userId }],
      },
    })

    // 6. Fetch all active sessions for this user and delete them to force-logout the user instantly
    const result = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "session",
        where: [{ field: "userId", value: args.userId }],
        paginationOpts: { numItems: 100, cursor: null },
      }
    )) as any

    const sessions = result?.page || []

    for (const session of sessions) {
      if (session && session._id) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: "session",
            where: [{ field: "_id", value: session._id }],
          },
        })
      }
    }

    return { success: true }
  },
})

export const deleteInvitation = mutation({
  args: {
    invitationId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get the authenticated caller
    const callerUser = await authComponent.getAuthUser(ctx)
    if (!callerUser) {
      throw new Error("Unauthorized")
    }

    const callerUserId = callerUser._id

    // 2. Verify that the caller is an owner or admin in this organization
    const callerMember = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "member",
        where: [
          { field: "organizationId", value: args.organizationId },
          { field: "userId", value: callerUserId },
        ],
      }
    )) as any

    if (
      !callerMember ||
      (callerMember.role !== "owner" && callerMember.role !== "admin")
    ) {
      throw new Error("Unauthorized to perform this action")
    }

    // 3. Verify that the invitation exists and belongs to this organization
    const invite = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "invitation",
        where: [{ field: "_id", value: args.invitationId }],
      }
    )) as any

    if (!invite || invite.organizationId !== args.organizationId) {
      throw new Error("Invitation not found")
    }

    // 4. Update the invitation record in the database setting isDeleted to true
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "invitation",
        update: { isDeleted: true },
        where: [{ field: "_id", value: args.invitationId }],
      },
    })

    return { success: true }
  },
})

export const getUserProviders = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "user",
        where: [{ field: "email", value: args.email }],
      }
    )) as any

    if (!user) {
      return { exists: false, providers: [] }
    }

    const accountsResult = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "account",
        where: [{ field: "userId", value: user._id }],
        paginationOpts: { numItems: 10, cursor: null },
      }
    )) as any

    const accounts = accountsResult?.page || []
    const providers = accounts.map((acc: any) => acc.providerId)

    return {
      exists: true,
      providers,
    }
  },
})

