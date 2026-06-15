"use client"

import React, { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Activity,
  Layers,
  Shield,
  Paperclip,
  ChevronRight,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Wifi,
  Users,
  Compass,
  Lock,
  Check,
  Plus,
  Send,
  Terminal,
} from "lucide-react"

import { Navbar1 } from "@/components/landing/header"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

// Register ScrollTrigger only on the client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// Simulated User Data for Comments & Actions
const USER_PROFILES: Record<string, { name: string; image: string; role: string }> = {
  sarah: { name: "Sarah Connor", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp", role: "Flight Director" },
  john: { name: "John Doe", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp", role: "Mission Control" },
  operator: { name: "System Operator", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-3.webp", role: "Astronaut" }
}

export default function LandingPage() {
  // References for GSAP
  const containerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLDivElement>(null)

  // 1. Task State Machine Simulator State
  const [userRole, setUserRole] = useState<"guest" | "member" | "admin">("member")
  const [taskStatus, setTaskStatus] = useState<"Pending" | "In Progress" | "Under Review" | "Completed" | "Cancelled">("Pending")
  const [stateLogs, setStateLogs] = useState<string[]>([
    "[14:40:02] DB_INIT: Convex connection stable.",
    "[14:40:05] AUTH_SYNC: betterAuth resolved active session.",
    "[14:40:08] SYSTEM: task_0x9a23 loaded in workspace organization context.",
    ""
  ])

  // 2. Subtask & Comments Widget State
  const [subtasks, setSubtasks] = useState([
    { id: 1, title: "Initialize telemetry antenna calibration", completed: true },
    { id: 2, title: "Check hydraulic thruster chamber pressure", completed: false },
    { id: 3, title: "Run diagnostic system sweeps", completed: false }
  ])
  const [comments, setComments] = useState([
    { id: 1, author: USER_PROFILES.sarah, content: "Reactor cooling loops show solid metrics. Proceed with antenna alignment.", time: "10m ago" },
    { id: 2, author: USER_PROFILES.john, content: "Standing by for the hydraulic verification check logs.", time: "4m ago" }
  ])
  const [newComment, setNewComment] = useState("")

  // 3. CTA Diagnostics Flow State
  const [diagStep, setDiagStep] = useState(0)
  const [diagLogs, setDiagLogs] = useState<string[]>([])
  const [diagComplete, setDiagComplete] = useState(false)
  const [diagRunning, setDiagRunning] = useState(false)

  // 4. Staggered Stat Counts state
  const [statCounts, setStatCounts] = useState({ tasks: 0, sync: 0, logs: 0 })

  // Log end-of-list ref
  const logEndRef = useRef<HTMLDivElement>(null)

  // Scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [stateLogs])

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero elements reveal
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } })
      heroTl.fromTo(".hero-badge", { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".hero-heading", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
        .fromTo(".hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
        .fromTo(".hero-buttons", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .fromTo(".hero-widgets", { opacity: 0, scale: 0.98, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.9 }, "-=0.4")

      // Stats numbers reveal tween
      const statTarget = { tasks: 0, sync: 0, logs: 0 }
      gsap.to(statTarget, {
        tasks: 124,
        sync: 100,
        logs: 8940,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsSectionRef.current,
          start: "top 85%",
        },
        onUpdate: () => {
          setStatCounts({
            tasks: Math.floor(statTarget.tasks),
            sync: Math.floor(statTarget.sync),
            logs: Math.floor(statTarget.logs)
          })
        }
      })

      // Timeline vertical connector line growth
      gsap.fromTo(
        ".timeline-connector-progress",
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top 60%",
            end: "bottom 70%",
            scrub: true,
          }
        }
      )

      // Staggered timeline card reveals
      gsap.utils.toArray<HTMLElement>(".timeline-card").forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none reverse",
            }
          }
        )
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  // 3D Tilt Hover effect on Feature Cards (minimalist, shadcn style)
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2
    const maxRotate = 5 // subtle tilt for shadcn aesthetic
    const rotateY = ((x - xc) / xc) * maxRotate
    const rotateX = -((y - yc) / yc) * maxRotate

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 800,
      ease: "power2.out",
      duration: 0.3,
      overwrite: "auto"
    })

    // Update reflection glow coordinate
    const glow = card.querySelector(".card-radial-glow") as HTMLDivElement
    if (glow) {
      gsap.to(glow, {
        opacity: 0.08,
        left: `${x}px`,
        top: `${y}px`,
        duration: 0.2,
        overwrite: "auto"
      })
    }
  }

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      ease: "power3.out",
      duration: 0.5,
      overwrite: "auto"
    })

    const glow = card.querySelector(".card-radial-glow") as HTMLDivElement
    if (glow) {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.4,
        overwrite: "auto"
      })
    }
  }

  // 1. State Machine Action click handlers
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
    setStateLogs(prev => [...prev, `[${time}] ${msg}`])
  }

  const triggerWidgetWarning = () => {
    // Shakes the state machine widget when permission or action is blocked
    gsap.fromTo(
      ".state-machine-widget",
      { x: -6 },
      { x: 0, ease: "elastic.out(1, 0.25)", duration: 0.5 }
    )
  }

  const handleStatusTransition = (targetStatus: typeof taskStatus) => {
    // Permission checks matching Convex backend schema
    if (userRole === "guest") {
      triggerWidgetWarning()
      addLog(`⚠ ACCESS_DENIED: Guest role has read_only permission scope. Mutation blocked.`)
      return
    }

    if (userRole === "member") {
      // Member can start and submit review
      if (targetStatus === "In Progress") {
        setTaskStatus("In Progress")
        addLog(`MUTATION: task_0x9a23 status patched to IN_PROGRESS by Member_Sarah (assignee).`)
      } else if (targetStatus === "Under Review") {
        setTaskStatus("Under Review")
        addLog(`MUTATION: task_0x9a23 status patched to UNDER_REVIEW by Member_Sarah (submitted for approval).`)
      } else if (targetStatus === "Completed") {
        // Redirection logic from backend: Member completing task sends it to Under Review instead
        setTaskStatus("Under Review")
        triggerWidgetWarning()
        addLog(`⚠ INTERCEPT: Member requested COMPLETE. Redirecting task status to UNDER_REVIEW for Admin audit.`)
      } else if (targetStatus === "Cancelled") {
        triggerWidgetWarning()
        addLog(`⚠ PERMISSION_DENIED: Member role lacks permission to cancel task. Scope restricted to Owner/Admin.`)
      } else if (targetStatus === "Pending") {
        setTaskStatus("Pending")
        addLog(`MUTATION: task_0x9a23 reset to PENDING by assignee Sarah.`)
      }
      return
    }

    if (userRole === "admin") {
      // Admin has full control
      setTaskStatus(targetStatus)
      if (targetStatus === "Completed") {
        addLog(`MUTATION: task_0x9a23 status resolved to COMPLETED by Admin_John. Telemetry locked.`)
      } else if (targetStatus === "Cancelled") {
        addLog(`MUTATION: task_0x9a23 status resolved to CANCELLED by Admin_John. Cron flags purged.`)
      } else {
        addLog(`MUTATION: task_0x9a23 status updated to ${targetStatus.toUpperCase()} by Admin_John.`)
      }
    }
  }

  // 2. Checklist toggle handlers
  const handleToggleSubtask = (id: number) => {
    setSubtasks(prev =>
      prev.map(st => {
        if (st.id === id) {
          const nextState = !st.completed
          const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
          setStateLogs(prevLogs => [
            ...prevLogs,
            `[${time}] MUTATION: Subtask "${st.title}" toggled to ${nextState.toString().toUpperCase()} by active operator.`
          ])
          return { ...st, completed: nextState }
        }
        return st
      })
    )
  }

  // Add Comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const commentObj = {
      id: Date.now(),
      author: USER_PROFILES.operator,
      content: newComment.trim(),
      time: "Just now"
    }

    setComments(prev => [...prev, commentObj])
    const commentText = newComment.trim()
    setNewComment("")

    // Animate comments wrapper to show new item smoothly
    setTimeout(() => {
      gsap.fromTo(
        ".comment-item:last-child",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 }
      )
      const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
      setStateLogs(prev => [...prev, `[${time}] MUTATION: Comment thread appended. actorId: operator, content: "${commentText}"`])
    }, 50)
  }

  // Calculates subtask progress percentage
  const completedSubtasksCount = subtasks.filter(s => s.completed).length
  const progressPercent = Math.round((completedSubtasksCount / subtasks.length) * 100)

  // 3. CTA Telemetry Diagnostic run sequence
  const runDiagnostics = () => {
    if (diagRunning || diagComplete) return
    setDiagRunning(true)
    setDiagLogs([])
    setDiagStep(1)

    const diagTimeline = gsap.timeline({
      onComplete: () => {
        setDiagComplete(true)
        setDiagRunning(false)
      }
    })

    // Step 1: Convex DB check
    diagTimeline.call(() => {
      setDiagLogs(prev => [...prev, "Checking Convex database clusters..."])
    })
    .to({}, { duration: 0.7 })
    .call(() => {
      setDiagLogs(prev => [...prev, "✔ SUCCESS: Convex clusters connected (replica link active)"])
      setDiagStep(2)
    })
    // Step 2: betterAuth handshake
    .call(() => {
      setDiagLogs(prev => [...prev, "Validating betterAuth token vectors..."])
    })
    .to({}, { duration: 0.8 })
    .call(() => {
      setDiagLogs(prev => [...prev, "✔ SUCCESS: credential adapters and session tokens sync OK"])
      setDiagStep(3)
    })
    // Step 3: R2 Attachment check
    .call(() => {
      setDiagLogs(prev => [...prev, "Pinging Cloudflare R2 bucket mounts..."])
    })
    .to({}, { duration: 0.7 })
    .call(() => {
      setDiagLogs(prev => [...prev, "✔ SUCCESS: R2 attachment upload/download telemetry verified"])
      setDiagStep(4)
    })
    // Step 4: Final handshake
    .call(() => {
      setDiagLogs(prev => [...prev, "Validating user role permission tables..."])
    })
    .to({}, { duration: 0.6 })
    .call(() => {
      setDiagLogs(prev => [...prev, "✔ SUCCESS: Role permissions parsed. Workspace active."])
      setDiagStep(5)
    })
  }

  const resetDiagnostics = () => {
    setDiagComplete(false)
    setDiagRunning(false)
    setDiagStep(0)
    setDiagLogs([])
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-x-hidden font-sans antialiased"
    >
      {/* Minimalist Grid Pattern Background with Fading Radial Mask (shadcn signature look) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Floating abstract decorative grids */}
      <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[55%] right-[-15%] w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar1 className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40" />

        {/* Hero Section */}
        <section
          ref={heroSectionRef}
          className="container mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Hero left details */}
          <div className="lg:col-span-5 flex flex-col space-y-6 text-center lg:text-left items-center lg:items-start">
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono select-none backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Convex Active Telemetry Link
            </div>

            <h1 className="hero-heading text-4xl sm:text-5xl md:text-6xl font-bold font-heading tracking-tight leading-[1.05] text-white">
              Ground Control.
              <br />
              <span className="text-zinc-500 font-light">Secure Project Telemetry.</span>
            </h1>

            <p className="hero-desc text-zinc-400 text-base md:text-lg font-light leading-relaxed max-w-lg">
              A developer-first collaborative task suite. Partition workspaces by organization, map roles to strict permission tables, enforce status state machines, and log every action to Convex audit tables.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center lg:justify-start pt-2">
              <Button size="lg" className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium group h-11" asChild>
                <a href="/sign-up" className="flex items-center justify-center gap-2">
                  Access Console
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-11"
                onClick={() => {
                  document.getElementById("interactive-telemetry")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Simulate Permissions
              </Button>
            </div>
          </div>

          {/* Hero right: Interactive Mock Widgets side-by-side */}
          <div className="lg:col-span-7 w-full flex flex-col space-y-6 hero-widgets">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Widget 1: State Machine (7cols) */}
              <div className="md:col-span-7 state-machine-widget bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-900 text-[10px] font-mono text-zinc-500 select-none">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Activity className="size-3 text-zinc-400" />
                    <span>MUTATION_STATE_MACHINE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="uppercase text-[9px] tracking-wide text-zinc-400 bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700">task_0x9a23</span>
                  </div>
                </div>

                {/* Role Toggler inside Widget */}
                <div className="p-4 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500 font-semibold uppercase">Actor Permission Role:</span>
                  <div className="flex border border-zinc-800 rounded overflow-hidden">
                    <button
                      onClick={() => {
                        setUserRole("guest")
                        addLog("ROLE_CHANGE: telemetry profile set to guest (READ_ONLY).")
                      }}
                      className={cn(
                        "px-2.5 py-1 transition-colors font-semibold",
                        userRole === "guest" ? "bg-zinc-200 text-zinc-950" : "text-zinc-500 hover:text-zinc-300 bg-zinc-950"
                      )}
                    >
                      GUEST
                    </button>
                    <button
                      onClick={() => {
                        setUserRole("member")
                        addLog("ROLE_CHANGE: telemetry profile set to member (READ_OWN, IN_PROGRESS, REVIEW).")
                      }}
                      className={cn(
                        "px-2.5 py-1 border-x border-zinc-900 transition-colors font-semibold",
                        userRole === "member" ? "bg-zinc-200 text-zinc-950" : "text-zinc-500 hover:text-zinc-300 bg-zinc-950"
                      )}
                    >
                      MEMBER
                    </button>
                    <button
                      onClick={() => {
                        setUserRole("admin")
                        addLog("ROLE_CHANGE: telemetry profile set to admin (ALL ACTIONS [*]).")
                      }}
                      className={cn(
                        "px-2.5 py-1 transition-colors font-semibold",
                        userRole === "admin" ? "bg-zinc-200 text-zinc-950" : "text-zinc-500 hover:text-zinc-300 bg-zinc-950"
                      )}
                    >
                      ADMIN
                    </button>
                  </div>
                </div>

                {/* Active Graph Vis */}
                <div className="p-5 flex flex-col space-y-5">
                  <div className="flex items-center justify-between relative px-2">
                    {/* Background Connection line */}
                    <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-zinc-800 z-0" />
                    
                    {/* Status node dots */}
                    {["Pending", "In Progress", "Under Review", "Completed"].map((status, index) => {
                      const isCompleted = ["Pending", "In Progress", "Under Review", "Completed"].indexOf(taskStatus) >= index && taskStatus !== "Cancelled"
                      const isActive = taskStatus === status
                      return (
                        <div key={status} className="flex flex-col items-center z-10 font-mono">
                          <button
                            onClick={() => handleStatusTransition(status as any)}
                            className={cn(
                              "w-7.5 h-7.5 rounded-full flex items-center justify-center border transition-all text-[11px]",
                              isActive
                                ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.3)] font-bold scale-110"
                                : isCompleted
                                ? "bg-zinc-900 text-zinc-300 border-zinc-700"
                                : "bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            {isCompleted && !isActive ? <Check className="size-3.5" /> : index + 1}
                          </button>
                          <span className={cn(
                            "text-[8px] uppercase tracking-wide mt-2 font-semibold",
                            isActive ? "text-zinc-200 font-bold" : "text-zinc-600"
                          )}>
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Operational Transition Trigger Buttons */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => handleStatusTransition("In Progress")}
                      className={cn(
                        "py-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900/60 transition-colors font-medium flex items-center justify-center gap-1.5",
                        taskStatus === "In Progress" && "border-zinc-300 text-white bg-zinc-900/50"
                      )}
                    >
                      Start Work
                    </button>
                    <button
                      onClick={() => handleStatusTransition("Under Review")}
                      className={cn(
                        "py-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900/60 transition-colors font-medium flex items-center justify-center gap-1.5",
                        taskStatus === "Under Review" && "border-zinc-300 text-white bg-zinc-900/50"
                      )}
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => handleStatusTransition("Completed")}
                      className={cn(
                        "py-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900/60 transition-colors font-medium flex items-center justify-center gap-1.5",
                        taskStatus === "Completed" && "border-zinc-300 text-white bg-zinc-900/50"
                      )}
                    >
                      Approve & Complete
                    </button>
                    <button
                      onClick={() => handleStatusTransition("Cancelled")}
                      className={cn(
                        "py-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900/60 transition-colors font-medium text-red-500/80 hover:text-red-400 flex items-center justify-center gap-1.5",
                        taskStatus === "Cancelled" && "border-red-900 text-red-400 bg-red-950/20"
                      )}
                    >
                      Cancel Task
                    </button>
                  </div>

                  {/* Audit Logs feed at bottom of widget */}
                  <div className="border border-zinc-900 bg-zinc-950 rounded-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/40 border-b border-zinc-900 text-[9px] font-mono text-zinc-500 select-none">
                      <span>CONVEX_AUDIT_LOG_TELEMETRY</span>
                      <span>ROLLING FEED</span>
                    </div>
                    <div className="p-3 h-[85px] overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1.5 leading-relaxed bg-zinc-950/50 select-text">
                      {stateLogs.map((log, idx) => (
                        <div key={idx} className={cn(
                          log.includes("⚠") ? "text-amber-500/90" : log.includes("ROLE_CHANGE") ? "text-zinc-400" : "text-zinc-500"
                        )}>
                          {log}
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Subtask checklist & Comments (5cols) */}
              <div className="md:col-span-5 flex flex-col space-y-4">
                
                {/* Subtask progress card */}
                <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
                  <CardHeader className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                    <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 select-none">
                      <span className="font-semibold uppercase flex items-center gap-1"><CheckCircle2 className="size-3 text-zinc-400" /> SUBTASK_MATRIX</span>
                      <span className="text-zinc-300 font-semibold">{progressPercent}%</span>
                    </div>
                    <CardTitle className="text-xs font-semibold text-zinc-200 mt-2">Calibrate Telemetry Antenna Cores</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-[11px] font-mono">
                    {subtasks.map(st => (
                      <div
                        key={st.id}
                        onClick={() => handleToggleSubtask(st.id)}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-900/50 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-900"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          st.completed ? "bg-zinc-100 border-zinc-100 text-zinc-950" : "border-zinc-800 text-transparent"
                        )}>
                          <Check className="size-3" />
                        </div>
                        <span className={cn(
                          st.completed ? "text-zinc-500 line-through" : "text-zinc-300"
                        )}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                    <div className="h-1 bg-zinc-900 rounded overflow-hidden mt-3">
                      <div
                        className="h-full bg-zinc-100 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Task comments card */}
                <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden flex flex-col flex-1">
                  <CardHeader className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                    <span className="font-mono text-[10px] text-zinc-500 font-semibold uppercase flex items-center gap-1 select-none">
                      <Users className="size-3 text-zinc-400" /> TASK_COMMENTS
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 max-h-[140px] overflow-y-auto space-y-2.5 bg-zinc-950/20 scrollbar-thin select-text">
                    {comments.map(c => (
                      <div key={c.id} className="comment-item flex items-start gap-2.5 text-[10px] font-mono leading-relaxed">
                        {c.author && (
                          <img src={c.author.image} alt={c.author.name} className="w-5 h-5 rounded border border-zinc-800" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-zinc-300 font-semibold">{c.author?.name || "Operator"}</span>
                            <span>{c.time}</span>
                          </div>
                          <p className="text-zinc-400">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="p-2 border-t border-zinc-900 bg-zinc-950/90">
                    <form onSubmit={handleAddComment} className="flex items-center w-full gap-1.5 px-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add updates..."
                        className="flex-1 bg-transparent text-[10px] font-mono outline-none border-none py-1 text-slate-200 placeholder-zinc-700"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 transition-colors"
                      >
                        <Send className="size-3.5" />
                      </button>
                    </form>
                  </CardFooter>
                </Card>

              </div>
            </div>
          </div>
        </section>

        {/* Real-time sync statistics counters */}
        <section
          ref={statsSectionRef}
          className="border-y border-zinc-900 bg-zinc-900/10 backdrop-blur-sm"
        >
          <div className="container mx-auto px-6 py-10 max-w-5xl">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Workspace Tasks</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.tasks}</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Real-time Sync</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.sync}%</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Audit Events Logged</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.logs}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section (Project Architecture Focused) */}
        <section className="container mx-auto px-6 py-20 lg:py-28 max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold font-heading text-white">Project Telemetry Architecture</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Explore Ground Control's underlying Convex data structures, reactive document feeds, and role authentication protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div
              className="group relative flex flex-col p-6 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 overflow-hidden cursor-default transition-all duration-300 transform-gpu preserve-3d"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-radial-glow absolute -left-20 -top-20 w-40 h-40 rounded-full bg-zinc-300 opacity-0 blur-3xl pointer-events-none transition-all duration-200" />
              <div className="translate-z-[15px] space-y-4 font-mono">
                <div className="p-2.5 w-fit rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Activity className="size-5" />
                </div>
                <h3 className="text-sm font-bold uppercase text-white tracking-wide">Audit Log Telemetry</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Automatically inserts audit logs (`taskAuditLogs`) on every mutation check (STATUS_CHANGED, ASSIGNEES_UPDATED). Seamless user profile mapping.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              className="group relative flex flex-col p-6 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 overflow-hidden cursor-default transition-all duration-300 transform-gpu preserve-3d"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-radial-glow absolute -left-20 -top-20 w-40 h-40 rounded-full bg-zinc-300 opacity-0 blur-3xl pointer-events-none transition-all duration-200" />
              <div className="translate-z-[15px] space-y-4 font-mono">
                <div className="p-2.5 w-fit rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Shield className="size-5" />
                </div>
                <h3 className="text-sm font-bold uppercase text-white tracking-wide">Permission Matrices</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Granular permission checks evaluated at mutation invocation. Restricts reading, task assignments, cancellations, and completes by member profile roles.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              className="group relative flex flex-col p-6 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 overflow-hidden cursor-default transition-all duration-300 transform-gpu preserve-3d"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-radial-glow absolute -left-20 -top-20 w-40 h-40 rounded-full bg-zinc-300 opacity-0 blur-3xl pointer-events-none transition-all duration-200" />
              <div className="translate-z-[15px] space-y-4 font-mono">
                <div className="p-2.5 w-fit rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Layers className="size-5" />
                </div>
                <h3 className="text-sm font-bold uppercase text-white tracking-wide">Workspace Partition</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Organization-level data segregation. Better Auth manages workspace membership rosters while database queries automatically filter scopes.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div
              className="group relative flex flex-col p-6 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 overflow-hidden cursor-default transition-all duration-300 transform-gpu preserve-3d"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="card-radial-glow absolute -left-20 -top-20 w-40 h-40 rounded-full bg-zinc-300 opacity-0 blur-3xl pointer-events-none transition-all duration-200" />
              <div className="translate-z-[15px] space-y-4 font-mono">
                <div className="p-2.5 w-fit rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Paperclip className="size-5" />
                </div>
                <h3 className="text-sm font-bold uppercase text-white tracking-wide">Payload Carriers</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  File uploads (`taskAttachments`) integrated directly into task cards. Cloudflare R2 bucket interfaces store images and logs with key matching.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scroll-Triggered Timeline Section */}
        <section
          ref={timelineRef}
          className="container mx-auto px-6 py-20 border-t border-zinc-900 bg-zinc-900/5"
        >
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-bold font-heading text-white">How Telemetry Sync Propagates</h2>
              <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
                Watch how Ground Control processes reactive mutations from front-end actions into immutable telemetry logs.
              </p>
            </div>

            {/* Timeline element */}
            <div className="relative pl-8 sm:pl-32 space-y-12">
              {/* Vertical line connectors */}
              <div className="absolute top-2 left-6 sm:left-20 bottom-2 w-0.5 bg-zinc-800" />
              <div className="timeline-connector-progress absolute top-2 left-6 sm:left-20 bottom-2 w-0.5 bg-zinc-200 scale-y-0" />

              {/* Node 1 */}
              <div className="timeline-card relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group">
                <div className="absolute left-[-26px] sm:left-[-116px] top-1.5 w-4 h-4 rounded-full border border-zinc-800 bg-zinc-950 group-hover:border-zinc-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300" />
                <span className="sm:w-20 text-zinc-500 font-mono text-xs uppercase tracking-widest pt-1">Stage 01</span>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-zinc-200 flex items-center gap-2">
                    <Cpu className="size-4 text-zinc-400" /> Mutation Call Triggered
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    User clicks "Start Work" in the dashboard. React triggers the `updateTaskStatus` mutation in the Convex client library.
                  </p>
                </div>
              </div>

              {/* Node 2 */}
              <div className="timeline-card relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group">
                <div className="absolute left-[-26px] sm:left-[-116px] top-1.5 w-4 h-4 rounded-full border border-zinc-800 bg-zinc-950 group-hover:border-zinc-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300" />
                <span className="sm:w-20 text-zinc-500 font-mono text-xs uppercase tracking-widest pt-1">Stage 02</span>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-zinc-200 flex items-center gap-2">
                    <Lock className="size-4 text-zinc-400" /> Auth & Role Verification
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The Convex handler calls `requireAuth(ctx)` and queries `requireMember(ctx, userId, organizationId)` to retrieve the member's profile role.
                  </p>
                </div>
              </div>

              {/* Node 3 */}
              <div className="timeline-card relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group">
                <div className="absolute left-[-26px] sm:left-[-116px] top-1.5 w-4 h-4 rounded-full border border-zinc-800 bg-zinc-950 group-hover:border-zinc-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300" />
                <span className="sm:w-20 text-zinc-500 font-mono text-xs uppercase tracking-widest pt-1">Stage 03</span>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-zinc-200 flex items-center gap-2">
                    <Shield className="size-4 text-zinc-400" /> Permission Gate Evaluation
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Evaluates permission maps (`hasPermission(ctx, orgId, role, "tasks", "complete")`). If successful, task status is patched; otherwise, it is redirected or rejected.
                  </p>
                </div>
              </div>

              {/* Node 4 */}
              <div className="timeline-card relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group">
                <div className="absolute left-[-26px] sm:left-[-116px] top-1.5 w-4 h-4 rounded-full border border-zinc-800 bg-zinc-950 group-hover:border-zinc-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300" />
                <span className="sm:w-20 text-zinc-500 font-mono text-xs uppercase tracking-widest pt-1">Stage 04</span>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-zinc-400 animate-pulse" /> Telemetry Log Logged
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Convex commits database updates and inserts an audit record (`taskAuditLogs`). Reactive subscriptions push updates to all team dashboards in 15ms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA: Interactive Diagnostic Run (Ignition Sequence Redesign) */}
        <section
          id="interactive-telemetry"
          className="container mx-auto px-6 py-20 border-t border-zinc-900 flex justify-center"
        >
          <div className="w-full max-w-2xl">
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/10 p-8 sm:p-12 backdrop-blur-md relative overflow-hidden flex flex-col items-center text-center space-y-8">
              
              {/* Decorative background grids */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                  <Terminal className="size-3 text-zinc-400 animate-pulse" />
                  Diagnostic Telemetry Suite
                </div>
                <h2 className="text-3xl font-bold font-heading text-white">Launch System Connection</h2>
                <p className="text-zinc-400 max-w-sm mx-auto text-xs sm:text-sm">
                  Run Ground Control diagnostics to check authorization handshakes, database pools, and Cloudflare attachment endpoints.
                </p>
              </div>

              {/* Progress and status logger inside diagnostic box */}
              {diagStep > 0 && (
                <div className="relative w-full border border-zinc-900 bg-zinc-950/80 rounded-lg p-5 font-mono text-[10px] text-zinc-400 text-left space-y-2 select-text w-full max-w-md">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 text-zinc-500 select-none">
                    <span>DIAGNOSTICS PROTOCOL</span>
                    <span>{diagComplete ? "COMPLETE" : `RUNNING - STEP 0${diagStep}/04`}</span>
                  </div>
                  <div className="space-y-1.5 h-[90px] overflow-y-auto">
                    {diagLogs.map((log, index) => (
                      <div key={index} className={log.includes("✔") ? "text-zinc-300 font-semibold" : "text-zinc-500"}>
                        {log}
                      </div>
                    ))}
                  </div>
                  {/* Dynamic Progress indicator */}
                  <div className="h-1 bg-zinc-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-zinc-200 transition-all duration-300"
                      style={{ width: `${(diagStep - 1) * 25}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full justify-center">
                {!diagComplete ? (
                  <Button
                    size="lg"
                    disabled={diagRunning}
                    onClick={runDiagnostics}
                    className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold h-11 px-8"
                  >
                    {diagRunning ? "Running Suite..." : "Run Diagnostic Suite"}
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <Button size="lg" className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold h-11 px-8" asChild>
                      <a href="/dashboard">Enter Console</a>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resetDiagnostics}
                      className="w-full sm:w-auto border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-11"
                    >
                      <RotateCcw className="size-4 mr-2" />
                      Reset Diagnostics
                    </Button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-900 py-8 bg-zinc-950/40">
          <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ground Control telemetry node #19 active</span>
            </div>
            <span>© {new Date().getFullYear()} Ground Control Inc. All telemetry parameters nominal.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
