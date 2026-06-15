"use node"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { components } from "./_generated/api"
import { DataModel } from "./_generated/dataModel"
import { betterAuth, BetterAuthOptions } from "better-auth/minimal"
import { organization } from "better-auth/plugins"
import { expo } from "@better-auth/expo"
import authConfig from "./auth.config"
import authSchema from "./betterAuth/schema"
import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/render"
import { VerificationEmail } from "./emails/VerificationEmail"
import { InvitationEmail } from "./emails/InvitationEmail"
import { ResetPasswordEmail } from "./emails/ResetPasswordEmail"
import { createAuthMiddleware, APIError } from "better-auth/api"

const siteUrl = process.env.SITE_URL!
const emailFrom = process.env.EMAIL_FROM || "Ground Control <onboarding@resend.dev>"

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const resend = new Resend(components.resend, { testMode: false })
  const options: any = {
    ...authConfig,
    appName: "Ground Control",
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: ["exp://", "mobile://"],
    user: {
      fields: {
        status: {
          type: "string",
          required: false,
        },
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
      },
    },
    hooks: {
      before: createAuthMiddleware(async (c) => {
        // 1. Block sign in if the user is blocked
        if (c.path === "/sign-in/email" || c.path === "/sign-in/social") {
          const email = c.body?.email
          if (email) {
            const user = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "email", value: email }],
              }
            )) as any
            if (user && user.status === "blocked") {
              throw new APIError("FORBIDDEN", {
                message: "This account has been blocked.",
              })
            }
          }
        }

        // 2. Block session verification and any other requests if the user is blocked
        const authHeader = c.headers?.get("authorization") || ""
        let token = authHeader.startsWith("Bearer ")
          ? authHeader.substring(7)
          : ""
        if (!token) {
          const cookieHeader = c.headers?.get("cookie") || ""
          token =
            cookieHeader
              .split(";")
              .map((p) => p.trim())
              .find((p) => p.startsWith("better-auth.session_token="))
              ?.split("=")[1] || ""
        }

        if (token) {
          const session = (await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
              model: "session",
              where: [{ field: "token", value: token }],
            }
          )) as any
          if (session) {
            const user = (await ctx.runQuery(
              components.betterAuth.adapter.findOne,
              {
                model: "user",
                where: [{ field: "_id", value: session.userId }],
              }
            )) as any
            if (user && user.status === "blocked") {
              throw new APIError("FORBIDDEN", {
                message: "This account has been blocked.",
              })
            }
          }
        }
      }),
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
        await resend.sendEmail(ctx as any, {
          from: emailFrom,
          to: user.email,
          subject: "Reset your Ground Control password",
          html: await render(ResetPasswordEmail({ url })),
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      testMode: false,
      sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
        await resend.sendEmail(ctx as any, {
          from: emailFrom,
          to: user.email,
          subject: "Verify your email address",
          html: await render(VerificationEmail({ url })),
        })
      },
    },
    plugins: [
      expo(),
      convex({ authConfig }),
      organization({
        invitation: {
          fields: {
            isDeleted: {
              type: "boolean",
              required: false,
            },
          },
        },
        sendInvitationEmail: async ({ email, invitation }: { email: string; invitation: any }) => {
          const inviteLink = `${siteUrl}/accept-invitation?id=${invitation.id}`
          const org = (await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
              model: "organization",
              where: [{ field: "_id", value: invitation.organizationId }],
            }
          )) as any
          const organizationName = org?.name || "an organization"

          const inviter = (await ctx.runQuery(
            components.betterAuth.adapter.findOne,
            {
              model: "user",
              where: [{ field: "_id", value: invitation.inviterId }],
            }
          )) as any
          const inviterEmail = inviter?.email || "Someone"

          await resend.sendEmail(ctx as any, {
            from: emailFrom,
            to: email,
            subject: "You have been invited to join an organization",
            html: await render(
              InvitationEmail({
                url: inviteLink,
                organizationName,
                inviterEmail,
                role: invitation.role,
              })
            ),
          })
        },
      }),
    ],
  }
  return options
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx))
