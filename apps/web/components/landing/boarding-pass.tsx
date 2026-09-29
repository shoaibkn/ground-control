"use client"

import React, { useState } from "react"
import { gsap } from "gsap"
import {
  Sparkles,
  Check,
  RotateCcw,
  Radio,
  QrCode,
  Shield,
  Plane,
  ChevronRight,
  Send,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function BoardingPass() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [teamSize, setTeamSize] = useState("5-20")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [passId, setPassId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setSubmitting(true)

    // Generate random pass id
    const rand = Math.floor(1000 + Math.random() * 9000)
    const code = `GC-2026-FLIGHT-${rand}`

    setTimeout(() => {
      setPassId(code)
      setSubmitting(false)
      setSubmitted(true)

      setTimeout(() => {
        gsap.fromTo(
          ".boarding-ticket",
          { opacity: 0, rotateX: 25, y: 30, scale: 0.95 },
          { opacity: 1, rotateX: 0, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)" }
        )
      }, 50)
    }, 1000)
  }

  const handleReset = () => {
    setSubmitted(false)
    setName("")
    setEmail("")
  }

  return (
    <section id="beta-access" className="relative border-t border-white/[0.08] bg-[#07080a] py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
            <Sparkles className="size-3" />
            EARLY FLIGHT CLEARANCE
          </div>

          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Request Ground Control Beta Access
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Secure priority onboarding for your organization. Beta operators receive direct access to our engineering team, dedicated Slack channels, and lifetime pioneer privileges.
          </p>
        </div>

        <div className="mt-12 mx-auto max-w-xl">
          {!submitted ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#090b10] p-6 shadow-2xl backdrop-blur-xl sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 uppercase">Operator Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Commander Sarah Connor"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 uppercase">Work / Organization Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@orbital-dynamics.com"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.02] px-4 py-3 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 uppercase">Flight Crew / Team Size</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#090b10] px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option>1-5 Operators</option>
                    <option>5-20 Operators</option>
                    <option>20-50 Operators</option>
                    <option>50+ Operators (Enterprise Fleet)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 mt-2 bg-gradient-to-r from-cyan-500 to-emerald-500 font-bold text-zinc-950 hover:opacity-90 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-white" />
                      GENERATING CLEARANCE MANIFEST...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Radio className="size-4" />
                      GENERATE FLIGHT CLEARANCE PASS
                    </span>
                  )}
                </Button>

                <p className="text-center text-[10px] text-zinc-500 pt-2">
                  No credit card required. Instant sandbox workspace provisioning upon approval.
                </p>
              </form>
            </div>
          ) : (
            <div className="boarding-ticket relative overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-[#0c1017] to-[#07090d] p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] sm:p-8 font-mono">
              {/* Top Bar of Ticket */}
              <div className="flex items-center justify-between border-b border-dashed border-white/[0.15] pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Radio className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">GROUND CONTROL</span>
                    <span className="text-xs font-bold text-white">MISSION BOARDING PASS</span>
                  </div>
                </div>

                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  CONFIRMED
                </span>
              </div>

              {/* Middle Section of Ticket */}
              <div className="grid grid-cols-2 gap-4 py-5 border-b border-dashed border-white/[0.15]">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">OPERATOR</span>
                  <span className="text-sm font-bold text-white truncate block">{name}</span>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">CLEARANCE ID</span>
                  <span className="text-sm font-bold text-cyan-400">{passId}</span>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">EMAIL MANIFEST</span>
                  <span className="text-xs text-zinc-300 truncate block">{email}</span>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">FLEET TIER</span>
                  <span className="text-xs text-zinc-300">{teamSize}</span>
                </div>
              </div>

              {/* Bottom Bar with Barcode simulation */}
              <div className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-6 flex items-center gap-1">
                    {[3, 1, 4, 2, 5, 2, 1, 3, 2, 4, 1, 3, 5, 2, 1, 4].map((w, idx) => (
                      <span key={idx} className="bg-white/70 h-5" style={{ width: `${w * 2}px` }} />
                    ))}
                  </div>
                  <span className="text-[8px] text-zinc-500 block">AUTHENTICATED CONVEX HASH</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-white/[0.1] text-zinc-400 hover:text-white hover:bg-white/[0.04] text-[10px]"
                >
                  <RotateCcw className="size-3 mr-1" />
                  New Registration
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
