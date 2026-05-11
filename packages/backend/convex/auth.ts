"use node"

import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { components } from "./_generated/api"
import { DataModel } from "./_generated/dataModel"
import { betterAuth, BetterAuthOptions } from "better-auth/minimal"
import { organization } from "better-auth/plugins"
import authConfig from "./auth.config"
import authSchema from "./betterAuth/schema"
import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/render"
import { VerificationEmail } from "./emails/VerificationEmail"

const siteUrl = process.env.SITE_URL!

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

  return {
    appName: "Ground Control",
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const html = await render(VerificationEmail({ url }))
        await resend.sendEmail(ctx as any, {
          to: user.email,
          from: "Ground Control <onboarding@lumin8.in>",
          subject: "Verify your email address",
          html,
        })
      },
    },
    plugins: [
      organization(),
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}
