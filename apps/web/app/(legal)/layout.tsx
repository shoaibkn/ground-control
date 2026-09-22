import Link from "next/link"

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100 antialiased">
      {/* Minimal Legal Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-base font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
              Ground Control
            </span>
          </Link>
          <nav className="flex items-center gap-6 font-mono text-xs text-zinc-500">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-300"
            >
              Terms
            </Link>
            <Link
              href="/data-deletion"
              className="transition-colors hover:text-zinc-300"
            >
              Data Deletion
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-3xl flex-1 px-6 py-16">
        {children}
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 font-mono text-[10px] text-zinc-600 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span>Ground Control</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-400"
            >
              Terms of Service
            </Link>
            <Link
              href="/data-deletion"
              className="transition-colors hover:text-zinc-400"
            >
              Data Deletion
            </Link>
          </div>
          <span>
            © {new Date().getFullYear()} Ground Control. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  )
}
