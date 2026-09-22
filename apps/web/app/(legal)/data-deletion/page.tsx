import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Deletion — Ground Control",
  description:
    "Learn how to request deletion of your data from Ground Control.",
}

export default function DataDeletionPage() {
  return (
    <article className="prose-invert max-w-none space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-zinc-900 pb-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Data Deletion Instructions
        </h1>
        <p className="text-sm text-zinc-400">
          How to request deletion of your personal data from Ground Control.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          We respect your right to control your personal data. You may request
          the deletion of your account and associated personal data at any time.
          This page explains how to do so and what happens when you request
          deletion.
        </p>
      </section>

      {/* How to Request */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          How to Request Data Deletion
        </h2>
        <p className="text-sm text-zinc-400">
          You can request deletion of your data through any of the following
          methods:
        </p>

        {/* Method 1 */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-zinc-300">
              1
            </div>
            <h3 className="text-base font-medium text-zinc-200">
              Via Email Request
            </h3>
          </div>
          <p className="text-sm text-zinc-400">
            Send an email to{" "}
            <a
              href="mailto:privacy@groundcontrol.app"
              className="text-zinc-200 underline underline-offset-2 transition-colors hover:text-white"
            >
              privacy@groundcontrol.app
            </a>{" "}
            with the subject line &ldquo;Data Deletion Request&rdquo; and
            include the following information:
          </p>
          <ul className="ml-2 list-inside list-disc space-y-1.5 text-sm text-zinc-400">
            <li>Your full name</li>
            <li>
              The email address associated with your Ground Control account
            </li>
            <li>
              (Optional) The name of any organizations you own that you would
              also like deleted
            </li>
          </ul>
        </div>

        {/* Method 2 */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-zinc-300">
              2
            </div>
            <h3 className="text-base font-medium text-zinc-200">
              Via Account Settings
            </h3>
          </div>
          <p className="text-sm text-zinc-400">
            Sign in to your Ground Control account, navigate to{" "}
            <span className="font-medium text-zinc-300">Settings</span>, and use
            the account deletion option (when available). This will initiate the
            deletion process immediately.
          </p>
        </div>

        {/* Method 3 */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-zinc-300">
              3
            </div>
            <h3 className="text-base font-medium text-zinc-200">
              Revoke Google OAuth Access
            </h3>
          </div>
          <p className="text-sm text-zinc-400">
            If you signed in using Google, you can also revoke Ground
            Control&apos;s access to your Google account through your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-200 underline underline-offset-2 transition-colors hover:text-white"
            >
              Google Account permissions settings
            </a>
            . Note that this revokes OAuth access but does not automatically
            delete your Ground Control account data — please also use Method 1
            or 2 above.
          </p>
        </div>
      </section>

      {/* What Gets Deleted */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          What Data Is Deleted
        </h2>
        <p className="text-sm text-zinc-400">
          When you request account deletion, the following data will be
          permanently removed:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full overflow-hidden rounded-lg border border-zinc-800 text-left text-sm">
            <thead className="bg-zinc-900/60 font-mono text-xs text-zinc-300 uppercase">
              <tr>
                <th className="border-b border-zinc-800 px-4 py-3">
                  Data Type
                </th>
                <th className="border-b border-zinc-800 px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">
                  Account Information
                </td>
                <td className="px-4 py-3">
                  Name, email, profile picture, password hash — permanently
                  deleted
                </td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">
                  Session Data
                </td>
                <td className="px-4 py-3">
                  All active sessions — immediately invalidated and deleted
                </td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">
                  Member Profiles
                </td>
                <td className="px-4 py-3">
                  Organization member profiles (position, department, phone) —
                  deleted
                </td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">
                  Starred Tasks
                </td>
                <td className="px-4 py-3">
                  Personal task star/bookmark data — deleted
                </td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">
                  File Attachments
                </td>
                <td className="px-4 py-3">
                  Files you uploaded — deleted from storage within 30 days
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-zinc-300">
                  Organizational Content
                </td>
                <td className="px-4 py-3">
                  Tasks, approvals, forms, and chat messages created within
                  organizations — retained for other organization members but
                  anonymized to remove your identity
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Deletion Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-300">
              24h
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Account Access Revoked
              </p>
              <p className="text-sm text-zinc-400">
                Your account will be deactivated and you will no longer be able
                to sign in within 24 hours of our receiving your request.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-300">
              7d
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Personal Data Purged
              </p>
              <p className="text-sm text-zinc-400">
                Your personal account data (name, email, sessions, member
                profiles) will be permanently deleted within 7 days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-300">
              30d
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                File Attachments Purged
              </p>
              <p className="text-sm text-zinc-400">
                All file attachments uploaded by you will be permanently deleted
                from our cloud storage within 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exceptions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Data Retention Exceptions
        </h2>
        <p className="text-sm text-zinc-400">
          In certain cases, we may be required to retain some data even after
          your deletion request:
        </p>
        <ul className="list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>
            <span className="font-medium text-zinc-300">
              Legal obligations:
            </span>{" "}
            Data we are required to retain by law, regulation, or legal
            proceedings
          </li>
          <li>
            <span className="font-medium text-zinc-300">Audit logs:</span>{" "}
            Anonymized audit records may be retained for organizational
            compliance purposes, with your personal identifiers removed
          </li>
          <li>
            <span className="font-medium text-zinc-300">
              Active organization ownership:
            </span>{" "}
            If you are the sole owner of an organization, you must either
            transfer ownership or delete the organization before your account
            can be fully deleted
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="space-y-4 border-t border-zinc-900 pt-8">
        <h2 className="text-xl font-semibold text-white">Contact Us</h2>
        <p className="text-sm text-zinc-400">
          If you have questions about data deletion or need assistance, please
          contact us:
        </p>
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5 font-mono text-sm">
          <p className="text-zinc-300">Ground Control — Privacy Team</p>
          <p className="text-zinc-400">
            Email:{" "}
            <a
              href="mailto:privacy@groundcontrol.app"
              className="text-zinc-200 underline underline-offset-2 transition-colors hover:text-white"
            >
              privacy@groundcontrol.app
            </a>
          </p>
        </div>
      </section>
    </article>
  )
}
