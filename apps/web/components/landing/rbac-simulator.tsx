"use client"

import React, { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

type Role = "guest" | "member" | "admin"
type Status = "Pending" | "In Progress" | "Under Review" | "Completed" | "Cancelled"

export function RbacSimulator() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const [role, setRole] = useState<Role>("member")
  const [taskStatus, setTaskStatus] = useState<Status>("In Progress")
  const [logs, setLogs] = useState<string[]>([
    "[16:20:00] CONVEX_INIT: Reactive connection established on wss://ground-control.convex.cloud",
    "[16:20:02] AUTH_RESOLVED: Session identity verified via Better Auth token.",
    "[16:20:05] PERMISSION_MATRIX: Loaded organization scope for workspace 'AEROSPACE DYNAMICS'.",
    "[16:20:08] SYSTEM: task_0x9a23 assigned to Flight Crew.",
  ])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
    setLogs((prev) => [...prev, `[${time}] ${msg}`])
  }

  const triggerDenialShake = () => {
    gsap.fromTo(
      ".rbac-widget",
      { x: -8 },
      { x: 0, ease: "elastic.out(1.2, 0.2)", duration: 0.5 }
    )
  }

  const handleAction = (action: "start" | "review" | "complete" | "cancel") => {
    if (role === "guest") {
      triggerDenialShake()
      addLog(`⚠ ACCESS_DENIED: Role 'guest' has read_only permission scope. Mutation rejected.`)
      return
    }

    if (action === "start") {
      setTaskStatus("In Progress")
      addLog(`MUTATION: task_0x9a23 status updated to IN_PROGRESS by operator (${role.toUpperCase()}).`)
    } else if (action === "review") {
      setTaskStatus("Under Review")
      addLog(`MUTATION: task_0x9a23 submitted for Flight Director review by (${role.toUpperCase()}).`)
    } else if (action === "complete") {
      if (role === "member") {
        setTaskStatus("Under Review")
        triggerDenialShake()
        addLog(`⚠ POLICY_GATE: Member attempted COMPLETE. Task mandates Flight Director sign-off. Routed to UNDER_REVIEW.`)
      } else {
        setTaskStatus("Completed")
        addLog(`✓ APPROVAL_GRANTED: Admin sign-off applied. task_0x9a23 resolved to COMPLETED. Telemetry archived.`)
      }
    } else if (action === "cancel") {
      if (role !== "admin") {
        triggerDenialShake()
        addLog(`⚠ ACCESS_DENIED: Role '${role}' lacks authority to abort task. Scope restricted to Flight Director (Admin).`)
      } else {
        setTaskStatus("Cancelled")
        addLog(`✕ MUTATION: task_0x9a23 CANCELLED by Flight Director. Recurrence crons stopped.`)
      }
    }
  }

  return (
    <section className="relative border-t border-white/[0.08] bg-[#060709] py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
            <Shield className="size-3" />
            ENTERPRISE SECURITY & RBAC
          </div>

          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Fine-Grained Permission Engine
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Every database mutation is gate-checked against organization role matrices before execution. Experience the security architecture live.
          </p>
        </div>

        {/* Interactive Simulation Widget */}
        <div className="rbac-widget mt-12 mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#090b10] shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Terminal className="size-3.5" />
              </div>
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                MUTATION_GATE_CONTROLLER
              </span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-500 text-[11px] uppercase hidden sm:inline">Active Role:</span>
              <div className="flex rounded-lg border border-white/[0.08] bg-black/60 p-0.5">
                {(["guest", "member", "admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r)
                      addLog(`ROLE_UPDATE: Security principal switched to ${r.toUpperCase()}.`)
                    }}
                    className={cn(
                      "px-3 py-1 font-semibold uppercase transition-all rounded-md text-[11px]",
                      role === r
                        ? "bg-white text-zinc-950 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {r === "admin" ? "Flight Director (Admin)" : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Task Status Overview */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">Simulated Resource</span>
                <h4 className="font-heading text-base font-bold text-white">
                  Orbital Telemetry Calibration (task_0x9a23)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">State:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold",
                    taskStatus === "Completed" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                    taskStatus === "Under Review" && "border-amber-500/40 bg-amber-500/10 text-amber-400",
                    taskStatus === "In Progress" && "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
                    taskStatus === "Pending" && "border-zinc-700 bg-zinc-800 text-zinc-400",
                    taskStatus === "Cancelled" && "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  )}
                >
                  {taskStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div>
              <div className="mb-2.5 font-mono text-[11px] text-zinc-400 uppercase">
                Trigger Mutation Action as [{role.toUpperCase()}]:
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                <Button
                  variant="outline"
                  onClick={() => handleAction("start")}
                  className="border-white/[0.1] bg-white/[0.02] hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/40"
                >
                  Start Work
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAction("review")}
                  className="border-white/[0.1] bg-white/[0.02] hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40"
                >
                  Submit Review
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAction("complete")}
                  className="border-white/[0.1] bg-white/[0.02] hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/40"
                >
                  Approve Complete
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAction("cancel")}
                  className="border-white/[0.1] bg-white/[0.02] hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/40"
                >
                  Cancel Task
                </Button>
              </div>
            </div>

            {/* Rolling Telemetry Audit Feed */}
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/60">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-[10px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <Activity className="size-3 text-emerald-400 animate-pulse" />
                  <span>LIVE CONVEX AUDIT STREAM</span>
                </div>
                <span className="text-zinc-600">ENCRYPTED LOGS</span>
              </div>

              <div className="h-32 space-y-1.5 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed select-text">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      log.includes("⚠")
                        ? "text-amber-400"
                        : log.includes("✓")
                          ? "text-emerald-400"
                          : log.includes("ROLE_UPDATE")
                            ? "text-cyan-400"
                            : "text-zinc-400"
                    )}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
