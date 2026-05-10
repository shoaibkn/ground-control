"use node"

import { createClient } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import type { GenericCtx } from "@convex-dev/better-auth/utils"
import type { BetterAuthOptions } from "better-auth"
import { betterAuth } from "better-auth"
import { components } from "../_generated/api"
import type { DataModel } from "../_generated/dataModel"
import authConfig from "../auth.config"
import schema from "./schema"
import { VerificationEmail } from "../emails/VerificationEmail"
import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/render"

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  }
)

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const resend = new Resend(components.resend, { testMode: false })

  return {
    appName: "Ground Control",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
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
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions
}

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>)

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}
