import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — Ground Control",
  description:
    "Read the Terms of Service for using the Ground Control application.",
}

export default function TermsOfServicePage() {
  const effectiveDate = "July 21, 2026"

  return (
    <article className="prose-invert max-w-none space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-zinc-900 pb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-400">
          Effective date: {effectiveDate}
        </p>
      </div>

      {/* 1. Acceptance */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          1. Acceptance of Terms
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          By accessing or using the Ground Control web application
          (the &ldquo;Service&rdquo;), operated by Ground Control (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by
          these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to
          these Terms, you may not use the Service.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          We reserve the right to update these Terms at any time. We will
          notify you of material changes by posting the revised Terms on this
          page. Your continued use of the Service after any changes constitutes
          acceptance of the updated Terms.
        </p>
      </section>

      {/* 2. Description */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          2. Description of Service
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Ground Control is a collaborative project management and task
          tracking application. The Service allows users to create
          organizations, manage tasks and approvals, build forms, collaborate in
          real-time through chat threads, attach files, and maintain audit
          trails of all workspace activity.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service is currently offered in Beta. Features, availability,
          and pricing are subject to change without prior notice.
        </p>
      </section>

      {/* 3. User Accounts */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          3. User Accounts
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          To use the Service, you must create an account using your email
          address or by signing in through Google OAuth. You are responsible
          for:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activities that occur under your account</li>
          <li>
            Providing accurate and complete information during registration
          </li>
          <li>
            Promptly notifying us of any unauthorized use of your account
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-zinc-400">
          We reserve the right to suspend or terminate accounts that violate
          these Terms or are inactive for an extended period.
        </p>
      </section>

      {/* 4. Acceptable Use */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          4. Acceptable Use Policy
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>
            Violate any applicable local, state, national, or international law
          </li>
          <li>
            Upload, transmit, or distribute any harmful, offensive, or
            illegal content
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the
            Service
          </li>
          <li>
            Attempt to gain unauthorized access to other accounts,
            organizations, or systems connected to the Service
          </li>
          <li>
            Use automated means (bots, scrapers, etc.) to access or interact
            with the Service without our prior written consent
          </li>
          <li>
            Impersonate any person or entity, or misrepresent your affiliation
            with any person or entity
          </li>
          <li>
            Collect or store personal data about other users without their
            explicit consent
          </li>
        </ul>
      </section>

      {/* 5. Organization & Collaboration */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          5. Organizations & Collaboration
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service allows you to create and join organizations. When you
          create an organization, you become its owner and are responsible for
          managing members and their roles (admin, member, guest).
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          Organization owners and admins may invite other users, assign roles,
          and configure role-based permissions. Content created within an
          organization (tasks, approvals, forms, chats, files) belongs to the
          organization and is accessible by its members according to their
          assigned permissions.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          If you leave or are removed from an organization, you will lose
          access to that organization&apos;s data. The organization owner may choose
          to retain or delete your contributions.
        </p>
      </section>

      {/* 6. Content & Intellectual Property */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          6. Content & Intellectual Property
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          You retain ownership of all content you create, upload, or share
          through the Service (&ldquo;Your Content&rdquo;). By using the
          Service, you grant us a limited, non-exclusive, worldwide license to
          store, process, and display Your Content solely for the purpose of
          providing the Service to you and your organization members.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service itself, including its design, code, logos, and
          documentation, is the intellectual property of Ground Control and is
          protected by applicable intellectual property laws. You may not copy,
          modify, distribute, or reverse-engineer any part of the Service.
        </p>
      </section>

      {/* 7. File Attachments */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          7. File Attachments
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service allows you to upload file attachments to tasks and
          approvals. You are responsible for ensuring that any files you upload
          do not infringe on the rights of third parties and comply with
          applicable laws.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          We reserve the right to remove any files that violate these Terms or
          that we deem inappropriate. We are not liable for any loss or damage
          resulting from the deletion of uploaded files.
        </p>
      </section>

      {/* 8. Beta Service */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          8. Beta Service Disclaimer
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service is currently offered in Beta. This means:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>
            The Service may contain bugs, errors, or incomplete features
          </li>
          <li>
            Data loss may occur during Beta, and we recommend maintaining
            your own backups where possible
          </li>
          <li>
            Service availability is not guaranteed and may be subject to
            downtime for maintenance or updates
          </li>
          <li>
            Features may be added, modified, or removed without notice
          </li>
        </ul>
      </section>

      {/* 9. Limitation of Liability */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          9. Limitation of Liability
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400 uppercase font-mono text-[11px] tracking-wide">
          To the maximum extent permitted by applicable law, in no event shall
          Ground Control, its officers, directors, employees, or agents be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, data,
          use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
          <li>Your access to, use of, or inability to use the Service</li>
          <li>Any unauthorized access to or alteration of your data</li>
          <li>
            Any content or conduct of any third party on the Service
          </li>
          <li>
            Any bugs, viruses, or other harmful components transmitted through
            the Service
          </li>
        </ul>
      </section>

      {/* 10. Disclaimers */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          10. Disclaimers
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS
          AVAILABLE&rdquo; basis, without warranties of any kind, either
          express or implied. We do not warrant that the Service will be
          uninterrupted, secure, or error-free.
        </p>
      </section>

      {/* 11. Termination */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          11. Termination
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          You may terminate your account at any time by contacting us or using
          the account deletion feature within the Service. We may suspend or
          terminate your access to the Service at any time, with or without
          cause, and with or without notice.
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          Upon termination, your right to use the Service will immediately
          cease. Provisions of these Terms that by their nature should survive
          termination shall survive, including but not limited to ownership
          provisions, warranty disclaimers, and limitations of liability.
        </p>
      </section>

      {/* 12. Governing Law */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          12. Governing Law
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          These Terms shall be governed by and construed in accordance with
          applicable laws, without regard to conflict of law principles. Any
          disputes arising from these Terms or the Service shall be resolved
          through good-faith negotiation, and if necessary, binding
          arbitration.
        </p>
      </section>

      {/* 13. Contact */}
      <section className="space-y-4 border-t border-zinc-900 pt-8">
        <h2 className="text-xl font-semibold text-white">
          13. Contact Us
        </h2>
        <p className="text-sm text-zinc-400">
          If you have questions about these Terms, please contact us at:
        </p>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-5 space-y-2 text-sm font-mono">
          <p className="text-zinc-300">Ground Control</p>
          <p className="text-zinc-400">
            Email:{" "}
            <a
              href="mailto:legal@groundcontrol.app"
              className="text-zinc-200 underline underline-offset-2 hover:text-white transition-colors"
            >
              legal@groundcontrol.app
            </a>
          </p>
        </div>
      </section>
    </article>
  )
}
