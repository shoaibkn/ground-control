import Link from "next/link"

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased flex flex-col">
      {/* Minimal Legal Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              Ground Control
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-xs font-mono text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/data-deletion" className="hover:text-zinc-300 transition-colors">
              Data Deletion
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-6 py-16 max-w-3xl">
        {children}
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-zinc-900 py-8 bg-zinc-950/40">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ground Control</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
            <Link href="/data-deletion" className="hover:text-zinc-400 transition-colors">Data Deletion</Link>
          </div>
          <span>© {new Date().getFullYear()} Ground Control. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
