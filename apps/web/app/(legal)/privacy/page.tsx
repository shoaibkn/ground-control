import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Ground Control",
  description:
    "Learn how Ground Control collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  const effectiveDate = "July 21, 2026"

  return (
    <article className="prose-invert max-w-none space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-zinc-900 pb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-400">
          Effective date: {effectiveDate}
        </p>
      </div>

      {/* Introduction */}
      <section className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-300">
          Ground Control (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Ground Control
          web application (the &ldquo;Service&rdquo;). This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you use our
          Service.
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          By accessing or using the Service, you agree to this Privacy Policy.
          If you do not agree, please do not use the Service.
        </p>
      </section>

      {/* 1. Information We Collect */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          1. Information We Collect
        </h2>

        <div className="space-y-3">
          <h3 className="text-base font-medium text-zinc-200">
            1.1 Information You Provide
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
            <li>
              <span className="text-zinc-300 font-medium">Account Information:</span>{" "}
              When you register, we collect your name, email address, and
              password. If you sign up via Google OAuth, we receive your name,
              email address, and profile picture from Google.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Organization Data:</span>{" "}
              Information about organizations you create or join, including
              organization name, member roles, and member profiles (position,
              department, phone number, address).
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Content Data:</span>{" "}
              Tasks, approvals, form responses, chat messages, comments, and
              file attachments you create within the Service.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Beta Programme:</span>{" "}
              If you sign up for our Beta Programme, we collect your name and
              email address.
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-medium text-zinc-200">
            1.2 Information Collected Automatically
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
            <li>
              <span className="text-zinc-300 font-medium">Usage Data:</span>{" "}
              We may collect information about how you access and use the Service,
              including your browser type, device information, pages visited, and
              timestamps of interactions.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Session Data:</span>{" "}
              Session tokens and authentication state managed through our
              authentication provider (Better Auth).
            </li>
          </ul>
        </div>
      </section>

      {/* 2. How We Use Your Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          2. How We Use Your Information
        </h2>
        <p className="text-sm text-zinc-400">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>Provide, operate, and maintain the Service</li>
          <li>Authenticate your identity and manage your account</li>
          <li>Enable collaboration within your organizations</li>
          <li>
            Send transactional emails (e.g., account verification, password
            reset, organization invitations, overdue task notifications)
          </li>
          <li>Enforce role-based access controls and permissions</li>
          <li>
            Maintain audit logs of actions performed within the Service for
            accountability and security
          </li>
          <li>Improve and optimize the Service</li>
          <li>Respond to your inquiries and provide customer support</li>
        </ul>
      </section>

      {/* 3. Third-Party Services */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          3. Third-Party Services
        </h2>
        <p className="text-sm text-zinc-400">
          We use the following third-party services to operate the Service:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-zinc-800 rounded-lg overflow-hidden">
            <thead className="bg-zinc-900/60 text-zinc-300 text-xs uppercase font-mono">
              <tr>
                <th className="px-4 py-3 border-b border-zinc-800">Service</th>
                <th className="px-4 py-3 border-b border-zinc-800">Purpose</th>
                <th className="px-4 py-3 border-b border-zinc-800">Data Shared</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">Convex</td>
                <td className="px-4 py-3">Real-time database and serverless backend</td>
                <td className="px-4 py-3">All application data (tasks, approvals, forms, user profiles)</td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">Google OAuth</td>
                <td className="px-4 py-3">Social sign-in authentication</td>
                <td className="px-4 py-3">Name, email, profile picture (received from Google)</td>
              </tr>
              <tr className="border-b border-zinc-900">
                <td className="px-4 py-3 font-medium text-zinc-300">Resend</td>
                <td className="px-4 py-3">Transactional email delivery</td>
                <td className="px-4 py-3">Recipient email address, email content</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-zinc-300">Cloudflare R2</td>
                <td className="px-4 py-3">File attachment storage</td>
                <td className="px-4 py-3">Uploaded files (documents, images)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-zinc-400">
          Each third-party service has its own privacy policy. We encourage you
          to review their policies.
        </p>
      </section>

      {/* 4. Data Retention */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          4. Data Retention
        </h2>
        <p className="text-sm text-zinc-400">
          We retain your personal data for as long as your account is active or
          as needed to provide you the Service. If you delete your account, we
          will delete or anonymize your personal data within 30 days, except
          where we are required to retain it for legal obligations.
        </p>
        <p className="text-sm text-zinc-400">
          Audit logs and organizational data may be retained for the duration of
          the organization&apos;s existence to maintain data integrity for other
          members.
        </p>
      </section>

      {/* 5. Data Security */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          5. Data Security
        </h2>
        <p className="text-sm text-zinc-400">
          We implement appropriate technical and organizational measures to
          protect your personal data, including:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>Encryption of data in transit (HTTPS/TLS)</li>
          <li>Secure authentication with session token management</li>
          <li>Role-based access controls within the application</li>
          <li>Regular security reviews of our infrastructure</li>
        </ul>
        <p className="text-sm text-zinc-400">
          However, no method of transmission over the Internet is 100% secure.
          We cannot guarantee absolute security of your data.
        </p>
      </section>

      {/* 6. Your Rights */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          6. Your Rights
        </h2>
        <p className="text-sm text-zinc-400">
          Depending on your jurisdiction, you may have the right to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-zinc-300 font-medium">Access</span> the
            personal data we hold about you
          </li>
          <li>
            <span className="text-zinc-300 font-medium">Correct</span>{" "}
            inaccurate or incomplete personal data
          </li>
          <li>
            <span className="text-zinc-300 font-medium">Delete</span> your
            personal data (see our{" "}
            <a href="/data-deletion" className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors">
              Data Deletion
            </a>{" "}
            page)
          </li>
          <li>
            <span className="text-zinc-300 font-medium">Export</span> your data
            in a portable format
          </li>
          <li>
            <span className="text-zinc-300 font-medium">Withdraw consent</span>{" "}
            for data processing where applicable
          </li>
        </ul>
        <p className="text-sm text-zinc-400">
          To exercise any of these rights, please contact us at{" "}
          <a
            href="mailto:privacy@groundcontrol.app"
            className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors"
          >
            privacy@groundcontrol.app
          </a>
          .
        </p>
      </section>

      {/* 7. Google OAuth Specific Disclosure */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          7. Google User Data
        </h2>
        <p className="text-sm text-zinc-400">
          When you sign in using Google, we access the following data from your
          Google account:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>Your name</li>
          <li>Your email address</li>
          <li>Your profile picture</li>
        </ul>
        <p className="text-sm text-zinc-400">
          This data is used solely for creating and authenticating your account
          within the Service. We do not share your Google user data with any
          third parties for advertising or other purposes unrelated to the
          Service. We do not store your Google access tokens beyond the
          authentication session.
        </p>
        <p className="text-sm text-zinc-400">
          You can revoke Ground Control&apos;s access to your Google account at any
          time through your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors"
          >
            Google Account permissions settings
          </a>
          .
        </p>
      </section>

      {/* 8. Children */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          8. Children&apos;s Privacy
        </h2>
        <p className="text-sm text-zinc-400">
          The Service is not intended for use by children under 13 years of age.
          We do not knowingly collect personal data from children under 13. If
          you are a parent or guardian and believe your child has provided us
          with personal data, please contact us so we can take appropriate
          action.
        </p>
      </section>

      {/* 9. Changes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          9. Changes to This Privacy Policy
        </h2>
        <p className="text-sm text-zinc-400">
          We may update this Privacy Policy from time to time. We will notify
          you of any material changes by posting the new Privacy Policy on this
          page and updating the &ldquo;Effective date&rdquo; above. Your continued use of
          the Service after changes are posted constitutes acceptance of the
          updated policy.
        </p>
      </section>

      {/* 10. Contact */}
      <section className="space-y-4 border-t border-zinc-900 pt-8">
        <h2 className="text-xl font-semibold text-white">
          10. Contact Us
        </h2>
        <p className="text-sm text-zinc-400">
          If you have questions or concerns about this Privacy Policy, please
          contact us at:
        </p>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-5 space-y-2 text-sm font-mono">
          <p className="text-zinc-300">Ground Control</p>
          <p className="text-zinc-400">
            Email:{" "}
            <a
              href="mailto:privacy@groundcontrol.app"
              className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors"
            >
              privacy@groundcontrol.app
            </a>
          </p>
        </div>
      </section>
    </article>
  )
}
