"use client"

import React, { useRef, useState, useEffect } from "react"
import { gsap } from "gsap"
import {
  Check,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  Sparkles,
  Users,
  Flame,
  AlertCircle,
  FileCheck2,
  Radio,
  Lock,
  MessageSquare,
  Repeat,
  Layers,
  ArrowUpRight,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

interface CockpitPreviewProps {
  className?: string
}

type Status = "Pending" | "In Progress" | "Under Review" | "Completed"
type Priority = "Urgent" | "High" | "Medium"

export function CockpitPreview({ className }: CockpitPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const [taskStatus, setTaskStatus] = useState<Status>("In Progress")
  const [priority, setPriority] = useState<Priority>("Urgent")
  const [subtasks, setSubtasks] = useState([
    { id: 1, title: "Initialize telemetry feed via Convex WebSocket", done: true },
    { id: 2, title: "Verify RF beacon phase array calibration (48V)", done: true },
    { id: 3, title: "Execute Sent.dm dispatch to orbital flight crew", done: false },
  ])
  const [comments, setComments] = useState([
    {
      id: 1,
      name: "Sarah Connor",
      role: "Flight Director",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces",
      text: "RF telemetry shows optimal signal clarity. Ready for approval sign-off.",
      time: "2m ago",
    },
    {
      id: 2,
      name: "John Glen",
      role: "Mission Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces",
      text: "Sent.dm SMS alert verified on carrier network. Proceeding.",
      time: "Just now",
    },
  ])
  const [newComment, setNewComment] = useState("")
  const [telemetryCount, setTelemetryCount] = useState(1482)

  // Increment telemetry tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryCount((prev) => prev + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // 3D Tilt Effect on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const maxTilt = 4
    const rotateX = -((y - centerY) / centerY) * maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      transformPerspective: 1200,
      ease: "power2.out",
      duration: 0.4,
      overwrite: "auto",
    })

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0.15,
        left: `${x}px`,
        top: `${y}px`,
        duration: 0.2,
        overwrite: "auto",
      })
    }
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      ease: "power3.out",
      duration: 0.6,
      overwrite: "auto",
    })
    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        duration: 0.4,
        overwrite: "auto",
      })
    }
  }

  const toggleSubtask = (id: number) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    )
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const newMsg = {
      id: Date.now(),
      name: "Current Operator",
      role: "Ground Control Lead",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=faces",
      text: newComment.trim(),
      time: "Just now",
    }
    setComments((prev) => [...prev, newMsg])
    setNewComment("")

    setTimeout(() => {
      gsap.fromTo(
        ".preview-comment:last-child",
        { opacity: 0, y: 12, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.5)" }
      )
    }, 20)
  }

  const completedCount = subtasks.filter((s) => s.done).length
  const progressPercent = Math.round((completedCount / subtasks.length) * 100)

  return (
    <div
      className={cn("relative mx-auto w-full max-w-5xl", className)}
      style={{ perspective: 1200 }}
    >
      {/* Outer ambient glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-violet-500/20 blur-xl opacity-75" />

      {/* Main Container Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#090b10]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_25px_60px_rgba(6,182,212,0.15)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Dynamic mouse spotlight glow */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 opacity-0 blur-3xl transition-opacity duration-300"
        />

        {/* Cockpit Window Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* macOS Style Traffic Dots */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div className="h-3 w-px bg-white/[0.1]" />

            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
              <span className="text-zinc-500">WORKSPACE:</span>
              <span className="font-semibold text-white">ORBITAL DYNAMICS</span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400">
                PROD
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-zinc-500">CONVEX SYNC:</span>
              <span className="text-emerald-400">8ms</span>
            </div>

            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="text-zinc-500">PACKETS:</span>
              <span className="text-zinc-300">#{telemetryCount}</span>
            </div>

            <Badge variant="outline" className="border-white/[0.1] bg-white/[0.03] text-[10px] text-zinc-400">
              MISSION PHASE 4
            </Badge>
          </div>
        </div>

        {/* Cockpit Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Live Task Details & Workflow Controller */}
          <div className="p-6 lg:col-span-7 lg:border-r lg:border-white/[0.08]">
            {/* Task Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-400">
                    TASK-0842
                  </span>
                  <button
                    onClick={() => {
                      const next: Priority =
                        priority === "Urgent" ? "High" : priority === "High" ? "Medium" : "Urgent"
                      setPriority(next)
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase transition-all",
                      priority === "Urgent" && "border-rose-500/40 bg-rose-500/10 text-rose-400",
                      priority === "High" && "border-amber-500/40 bg-amber-500/10 text-amber-400",
                      priority === "Medium" && "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                    )}
                    title="Click to toggle priority level"
                  >
                    <Flame className="size-3" />
                    <span>{priority}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                  <Clock className="size-3.5" />
                  <span>DUE: TODAY 18:00 UTC</span>
                </div>
              </div>

              <h3 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                Deploy Phased Array Telemetry Uplink
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Calibrate RF beacon transmitters, verify zero packet loss on Convex reactive channel,
                and broadcast mission authorization via Sent.dm omnichannel router.
              </p>
            </div>

            {/* Status Workflow State Machine */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between font-mono text-[11px]">
                <span className="font-semibold text-zinc-400 uppercase">
                  Workflow Lifecycle State:
                </span>
                <span className="text-[10px] text-cyan-400">
                  Click to simulate transition ➔
                </span>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["Pending", "In Progress", "Under Review", "Completed"] as Status[]).map(
                  (status) => {
                    const isActive = taskStatus === status
                    return (
                      <button
                        key={status}
                        onClick={() => setTaskStatus(status)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border p-2 text-center font-mono text-xs transition-all",
                          isActive
                            ? "border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 to-cyan-900/20 font-bold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                            : "border-white/[0.06] bg-black/40 text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300"
                        )}
                      >
                        <span className="text-[9px] text-zinc-500">
                          STAGE {status === "Pending" ? "01" : status === "In Progress" ? "02" : status === "Under Review" ? "03" : "04"}
                        </span>
                        <span className="mt-0.5">{status}</span>
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* Interactive Subtasks Matrix */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-300 uppercase">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  Subtask Checklist Matrix
                </span>
                <span className="font-bold text-emerald-400">{progressPercent}%</span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-2 pt-1 font-mono text-xs">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleSubtask(st.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all select-none",
                      st.done
                        ? "border-emerald-500/20 bg-emerald-500/[0.03] text-zinc-400"
                        : "border-white/[0.06] bg-black/40 text-zinc-200 hover:border-white/[0.12] hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border transition-all",
                          st.done
                            ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                            : "border-white/[0.2] bg-transparent"
                        )}
                      >
                        {st.done && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span className={st.done ? "line-through text-zinc-500" : ""}>
                        {st.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-600">
                      {st.done ? "DONE" : "PENDING"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Approval Gate + Live Discussion Thread */}
          <div className="flex flex-col bg-white/[0.01] p-6 lg:col-span-5">
            {/* Approval Gate Badge */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400">
                  <Shield className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">
                      Mandated Sign-Off Gate
                    </span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.2 font-mono text-[9px] text-amber-300">
                      REQUIRES APPROVAL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Completion locked until verified by Flight Director. Audit trail immutable.
                  </p>
                </div>
              </div>
            </div>

            {/* Contextual Discussion Stream */}
            <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="size-3 text-cyan-400" />
                  <span>DISCUSSION TELEMETRY</span>
                </div>
                <span className="text-[9px] text-zinc-600">ENCRYPTED R2</span>
              </div>

              {/* Message List */}
              <div className="max-h-[220px] space-y-3 overflow-y-auto p-3.5 font-mono">
                {comments.map((comment) => (
                  <div key={comment.id} className="preview-comment flex items-start gap-2.5">
                    <img
                      src={comment.avatar}
                      alt={comment.name}
                      className="h-6 w-6 rounded-full border border-white/[0.1] object-cover"
                    />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-zinc-200">{comment.name}</span>
                        <span className="text-[9px] text-zinc-500">{comment.time}</span>
                      </div>
                      <p className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-[11px] leading-relaxed text-zinc-300">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleAddComment}
                className="mt-auto flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Send dispatch note..."
                  className="flex-1 bg-transparent px-2 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim()}
                  className="h-7 w-7 rounded bg-cyan-500/20 p-0 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-30"
                >
                  <Send className="size-3" />
                </Button>
              </form>
            </div>

            {/* Omnichannel Broadcast Indicator */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2 font-mono text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Radio className="size-3 text-emerald-400 animate-pulse" />
                DISPATCH CHANNEL:
              </span>
              <span className="font-semibold text-zinc-300">
                SENT.DM (WHATSAPP + SMS)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
