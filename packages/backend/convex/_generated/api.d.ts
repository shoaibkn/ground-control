/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvalAttachments from "../approvalAttachments.js";
import type * as approvalChats from "../approvalChats.js";
import type * as approvals from "../approvals.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emails_InvitationEmail from "../emails/InvitationEmail.js";
import type * as emails_NotificationEmail from "../emails/NotificationEmail.js";
import type * as emails_ResetPasswordEmail from "../emails/ResetPasswordEmail.js";
import type * as emails_VerificationEmail from "../emails/VerificationEmail.js";
import type * as forms from "../forms.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as memberProfiles from "../memberProfiles.js";
import type * as notifications from "../notifications.js";
import type * as permissions from "../permissions.js";
import type * as taskAttachments from "../taskAttachments.js";
import type * as taskChats from "../taskChats.js";
import type * as taskCron from "../taskCron.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvalAttachments: typeof approvalAttachments;
  approvalChats: typeof approvalChats;
  approvals: typeof approvals;
  auth: typeof auth;
  crons: typeof crons;
  "emails/InvitationEmail": typeof emails_InvitationEmail;
  "emails/NotificationEmail": typeof emails_NotificationEmail;
  "emails/ResetPasswordEmail": typeof emails_ResetPasswordEmail;
  "emails/VerificationEmail": typeof emails_VerificationEmail;
  forms: typeof forms;
  http: typeof http;
  inbox: typeof inbox;
  memberProfiles: typeof memberProfiles;
  notifications: typeof notifications;
  permissions: typeof permissions;
  taskAttachments: typeof taskAttachments;
  taskChats: typeof taskChats;
  taskCron: typeof taskCron;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
