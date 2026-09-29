"use client"

import React from "react"
import Link from "next/link"
import { Radio, ArrowUpRight, ShieldCheck, Heart } from "lucide-react"

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] py-16 font-mono text-xs text-zinc-400">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/60 text-cyan-400">
                <Radio className="size-4" />
              </div>
              <span className="font-heading text-base font-extrabold tracking-tight text-white">
                GROUND CONTROL
              </span>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-zinc-400 font-sans">
              The mission operations platform for high-velocity teams. Intelligent task orchestration, multi-stage approval gateways, dynamic forms, and carrier-grade omnichannel routing.
            </p>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[10px] w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-zinc-500">ALL SYSTEMS NOMINAL</span>
              <span className="text-emerald-400">• 99.99% UPTIME</span>
            </div>
          </div>

          {/* Subsystems Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white text-[11px]">
              Subsystems
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a href="#command-center" className="transition-colors hover:text-white">
                  Task Matrix
                </a>
              </li>
              <li>
                <a href="#command-center" className="transition-colors hover:text-white">
                  Approval Gates
                </a>
              </li>
              <li>
                <a href="#command-center" className="transition-colors hover:text-white">
                  Dynamic Forms
                </a>
              </li>
              <li>
                <a href="#sentdm" className="transition-colors hover:text-white">
                  Sent.dm Omnichannel
                </a>
              </li>
              <li>
                <a href="#capabilities" className="transition-colors hover:text-white">
                  Convex Reactive DB
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Tech */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white text-[11px]">
              Engineering
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>Next.js 16 (Turbopack)</li>
              <li>React 19 Server Components</li>
              <li>Convex Real-Time Cloud</li>
              <li>Better Auth Security</li>
              <li>Tailwind CSS v4 & GSAP</li>
              <li>Expo SDK 56 (Native Mobile)</li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white text-[11px]">
              Governance
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="transition-colors hover:text-white">
                  Data Deletion Protocol
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="transition-colors hover:text-white">
                  Operator Login
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="transition-colors hover:text-white">
                  Deploy Workspace
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-[11px] text-zinc-500 sm:flex-row">
          <div>
            © {currentYear} Ground Control Systems. Designed for mission-critical operations.
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              LAT 28.5721° N, LON 80.6480° W
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
