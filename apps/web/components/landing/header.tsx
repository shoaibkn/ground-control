"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  Loader2,
  LogOut,
  User,
  Radio,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Activity,
  Layers,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { authClient } from "@/lib/auth-client"

interface HeaderProps {
  className?: string
}

export function LandingHeader({ className }: HeaderProps) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in")
        },
      },
    })
  }

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    if (targetId.startsWith("#")) {
      e.preventDefault()
      setMobileMenuOpen(false)
      const element = document.getElementById(targetId.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07080a]/80 backdrop-blur-xl transition-all duration-300",
        className
      )}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 to-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Radio className="size-4.5 text-cyan-400 transition-transform duration-500 group-hover:rotate-12" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-extrabold tracking-tight text-white">
                GROUND CONTROL
              </span>
              <span className="hidden rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-cyan-400 uppercase sm:inline-block">
                v1.0
              </span>
            </div>
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
              Mission Operations Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#capabilities"
            onClick={(e) => handleSmoothScroll(e, "#capabilities")}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Capabilities
          </a>
          <a
            href="#command-center"
            onClick={(e) => handleSmoothScroll(e, "#command-center")}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Command Deck
          </a>
          <a
            href="#sentdm"
            onClick={(e) => handleSmoothScroll(e, "#sentdm")}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Omnichannel
          </a>
          <a
            href="#workflow"
            onClick={(e) => handleSmoothScroll(e, "#workflow")}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Workflow
          </a>
          <a
            href="#beta-access"
            onClick={(e) => handleSmoothScroll(e, "#beta-access")}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/10"
          >
            Beta Access
          </a>
        </nav>

        {/* Live Status + Auth Action Group */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-zinc-400 xl:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-zinc-500">TELEMETRY:</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>

          {isPending ? (
            <div className="flex h-9 w-20 items-center justify-center">
              <Loader2 className="size-4 animate-spin text-zinc-400" />
            </div>
          ) : session ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                className="h-8 border border-cyan-500/40 bg-cyan-500/10 px-3 font-mono text-xs text-cyan-300 hover:bg-cyan-500/20"
              >
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  <Activity className="size-3.5" />
                  Console
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-2 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                title="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 px-3 font-mono text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="group relative h-8 overflow-hidden rounded-md border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 font-mono text-xs font-semibold text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              >
                <Link href="/sign-up" className="flex items-center gap-1">
                  <span>Deploy</span>
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-400 transition-colors hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-[#07080a]/95 px-6 py-6 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col space-y-3 font-mono text-sm">
            <a
              href="#capabilities"
              onClick={(e) => handleSmoothScroll(e, "#capabilities")}
              className="py-1 text-zinc-400 transition-colors hover:text-white"
            >
              Capabilities
            </a>
            <a
              href="#command-center"
              onClick={(e) => handleSmoothScroll(e, "#command-center")}
              className="py-1 text-zinc-400 transition-colors hover:text-white"
            >
              Command Deck
            </a>
            <a
              href="#sentdm"
              onClick={(e) => handleSmoothScroll(e, "#sentdm")}
              className="py-1 text-zinc-400 transition-colors hover:text-white"
            >
              Omnichannel Sent.dm
            </a>
            <a
              href="#workflow"
              onClick={(e) => handleSmoothScroll(e, "#workflow")}
              className="py-1 text-zinc-400 transition-colors hover:text-white"
            >
              Mission Workflow
            </a>
            <a
              href="#beta-access"
              onClick={(e) => handleSmoothScroll(e, "#beta-access")}
              className="py-1 text-cyan-400 transition-colors hover:text-cyan-300"
            >
              Request Beta Clearance
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
export { LandingHeader as Navbar1 }
