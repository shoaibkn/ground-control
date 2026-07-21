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
  ClipboardList,
  FileText,
  Bell,
  MessageSquare,
  Repeat,
  ArrowRight,
  Sparkles,
  Kanban,
} from "lucide-react"

import { Navbar1 } from "@/components/landing/header"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

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

// Features data
const FEATURES = [
  {
    icon: <CheckCircle2 className="size-5" />,
    title: "Task Management",
    description:
      "Multi-view task management with table, kanban, and list views. Status state machine with Pending → In Progress → Under Review → Completed workflows, priority levels, due dates, subtasks, and recurring task schedules.",
  },
  {
    icon: <ClipboardList className="size-5" />,
    title: "Approval Workflows",
    description:
      "Create approvals linked to tasks, assign multiple approvers, and track decision status (Pending, Approved, Declined, Rework). Full audit trail with chat threads and file attachments on every approval.",
  },
  {
    icon: <FileText className="size-5" />,
    title: "Forms Builder",
    description:
      "Dynamic form builder with text, textarea, radio, checkbox, select, date, number, file, and image field types. Share forms externally and link responses directly to tasks and approvals.",
  },
  {
    icon: <Shield className="size-5" />,
    title: "Role-Based Permissions",
    description:
      "Granular permission matrices per organization. Admin, member, and guest roles with configurable action scopes. Every mutation is gate-checked against permission tables before execution.",
  },
  {
    icon: <MessageSquare className="size-5" />,
    title: "Real-Time Collaboration",
    description:
      "In-task and in-approval chat threads with rich message editing, deletion, and system messages. File attachments stored on Cloudflare R2, emoji reactions, read receipts, and @mentions.",
  },
  {
    icon: <Activity className="size-5" />,
    title: "Audit Trail & Notifications",
    description:
      "Comprehensive audit logging on every status change, assignee update, and permission event. Overdue task monitoring crons, in-app notification inbox, and transactional emails via Resend.",
  },
]

// Timeline steps
const TIMELINE_STEPS = [
  {
    stage: "01",
    icon: <Cpu className="size-4 text-zinc-400" />,
    title: "Create & Assign Tasks",
    description:
      "Create tasks with titles, descriptions, priorities, and due dates. Assign team members, add collaborators, and attach forms for structured data collection.",
  },
  {
    stage: "02",
    icon: <Shield className="size-4 text-zinc-400" />,
    title: "Permission-Gated Workflows",
    description:
      "Every action passes through role-based permission checks. Members can start work and submit for review; admins can approve, complete, or cancel.",
  },
  {
    stage: "03",
    icon: <Users className="size-4 text-zinc-400" />,
    title: "Collaborate in Real-Time",
    description:
      "Team members discuss progress in real-time chat threads. Upload attachments, react with emojis, and track who has read the latest updates.",
  },
  {
    stage: "04",
    icon: <CheckCircle2 className="size-4 text-zinc-400 animate-pulse" />,
    title: "Track, Audit & Notify",
    description:
      "Every action is logged to immutable audit tables. Overdue tasks trigger notifications automatically. The dashboard gives real-time visibility across all workspace activity.",
  },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLDivElement>(null)

  // Interactive demo state (preserved from existing page)
  const [userRole, setUserRole] = useState<"guest" | "member" | "admin">("member")
  const [taskStatus, setTaskStatus] = useState<"Pending" | "In Progress" | "Under Review" | "Completed" | "Cancelled">("Pending")
  const [stateLogs, setStateLogs] = useState<string[]>([
    "[14:40:02] DB_INIT: Convex connection stable.",
    "[14:40:05] AUTH_SYNC: betterAuth resolved active session.",
    "[14:40:08] SYSTEM: task_0x9a23 loaded in workspace organization context.",
    ""
  ])

  // Subtask & Comments
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

  // Stats counters
  const [statCounts, setStatCounts] = useState({ tasks: 0, orgs: 0, uptime: 0 })

  // Beta form state
  const [betaName, setBetaName] = useState("")
  const [betaEmail, setBetaEmail] = useState("")
  const [betaSubmitted, setBetaSubmitted] = useState(false)
  const [betaSubmitting, setBetaSubmitting] = useState(false)

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

      // Stats numbers reveal tween
      const statTarget = { tasks: 0, orgs: 0, uptime: 0 }
      gsap.to(statTarget, {
        tasks: 2400,
        orgs: 180,
        uptime: 99.9,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsSectionRef.current,
          start: "top 85%",
        },
        onUpdate: () => {
          setStatCounts({
            tasks: Math.floor(statTarget.tasks),
            orgs: Math.floor(statTarget.orgs),
            uptime: Math.round(statTarget.uptime * 10) / 10
          })
        }
      })

      // Staggered feature card reveals
      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.08,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          }
        )
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

      // Beta section reveal
      gsap.fromTo(
        ".beta-section",
        { opacity: 0, y: 50, scale: 0.98 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8,
          scrollTrigger: {
            trigger: ".beta-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          }
        }
      )

    }, containerRef)

    return () => ctx.revert()
  }, [])

  // 3D Tilt Hover effect on Feature Cards
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2
    const maxRotate = 5
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

  // State Machine handlers
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
    setStateLogs(prev => [...prev, `[${time}] ${msg}`])
  }

  const triggerWidgetWarning = () => {
    gsap.fromTo(
      ".state-machine-widget",
      { x: -6 },
      { x: 0, ease: "elastic.out(1, 0.25)", duration: 0.5 }
    )
  }

  const handleStatusTransition = (targetStatus: typeof taskStatus) => {
    if (userRole === "guest") {
      triggerWidgetWarning()
      addLog(`⚠ ACCESS_DENIED: Guest role has read_only permission scope. Mutation blocked.`)
      return
    }

    if (userRole === "member") {
      if (targetStatus === "In Progress") {
        setTaskStatus("In Progress")
        addLog(`MUTATION: task_0x9a23 status patched to IN_PROGRESS by Member_Sarah (assignee).`)
      } else if (targetStatus === "Under Review") {
        setTaskStatus("Under Review")
        addLog(`MUTATION: task_0x9a23 status patched to UNDER_REVIEW by Member_Sarah (submitted for approval).`)
      } else if (targetStatus === "Completed") {
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

  // Subtask toggle
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

  const completedSubtasksCount = subtasks.filter(s => s.completed).length
  const progressPercent = Math.round((completedSubtasksCount / subtasks.length) * 100)

  // Beta form submit
  const handleBetaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!betaName.trim() || !betaEmail.trim()) return
    setBetaSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      setBetaSubmitting(false)
      setBetaSubmitted(true)

      // Animate success
      gsap.fromTo(
        ".beta-success",
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.4)" }
      )
    }, 1200)
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-x-hidden font-sans antialiased"
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Floating decorative blurs */}
      <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[55%] right-[-15%] w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar1 className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40" />

        {/* =============== HERO SECTION =============== */}
        <section
          ref={heroSectionRef}
          className="container mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-36 flex flex-col items-center text-center"
        >
          <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-xs font-mono select-none backdrop-blur-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now in Beta — Join Early Access
          </div>

          <h1 className="hero-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading tracking-tight leading-[1.05] text-white max-w-4xl">
            Ground Control.
            <br />
            <span className="text-zinc-500 font-light">Task Management, Reinvented.</span>
          </h1>

          <p className="hero-desc text-zinc-400 text-base md:text-lg font-light leading-relaxed max-w-2xl mt-6">
            A collaborative project management platform with real-time task tracking, approval workflows, dynamic forms, role-based permissions, and comprehensive audit trails — all powered by a reactive backend.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium group h-12 px-8" asChild>
              <a
                href="#beta"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById("beta")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                Join the Beta
                <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-12 px-8"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Explore Features
            </Button>
          </div>
        </section>

        {/* =============== STATS BAR =============== */}
        <section
          ref={statsSectionRef}
          className="border-y border-zinc-900 bg-zinc-900/10 backdrop-blur-sm"
        >
          <div className="container mx-auto px-6 py-10 max-w-5xl">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Tasks Managed</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.tasks.toLocaleString()}+</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Organizations</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.orgs}+</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-semibold">Uptime</span>
                <span className="text-3xl sm:text-4xl font-bold text-white mt-1 block">{statCounts.uptime}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* =============== FEATURES GRID =============== */}
        <section id="features" className="container mx-auto px-6 py-20 lg:py-28 max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
              <Layers className="size-3" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">Everything You Need to Ship</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Ground Control brings together task management, approvals, forms, and team collaboration into one unified workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="feature-card group relative flex flex-col p-6 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 overflow-hidden cursor-default transition-all duration-300 transform-gpu"
                style={{ transformStyle: "preserve-3d" }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="card-radial-glow absolute -left-20 -top-20 w-40 h-40 rounded-full bg-zinc-300 opacity-0 blur-3xl pointer-events-none transition-all duration-200" />
                <div className="space-y-4" style={{ transform: "translateZ(15px)" }}>
                  <div className="p-2.5 w-fit rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-bold uppercase text-white tracking-wide font-mono">
                    {feature.title}
                  </h3>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =============== INTERACTIVE DEMO =============== */}
        <section className="border-t border-zinc-900 bg-zinc-900/5">
          <div className="container mx-auto px-6 py-20 lg:py-28 max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                <Terminal className="size-3" />
                Interactive Demo
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">Try the Permission Engine</h2>
              <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Switch between roles and see how Ground Control&apos;s permission system controls task state transitions in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* State Machine Widget */}
              <div className="lg:col-span-7 state-machine-widget bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-900 text-[10px] font-mono text-zinc-500 select-none">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Activity className="size-3 text-zinc-400" />
                    <span>MUTATION_STATE_MACHINE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="uppercase text-[9px] tracking-wide text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700">task_0x9a23</span>
                  </div>
                </div>

                {/* Role Toggler */}
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

                {/* Status Graph */}
                <div className="p-5 flex flex-col space-y-5">
                  <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-zinc-800 z-0" />
                    {["Pending", "In Progress", "Under Review", "Completed"].map((status, index) => {
                      const isCompleted = ["Pending", "In Progress", "Under Review", "Completed"].indexOf(taskStatus) >= index && taskStatus !== "Cancelled"
                      const isActive = taskStatus === status
                      return (
                        <div key={status} className="flex flex-col items-center z-10 font-mono">
                          <button
                            onClick={() => handleStatusTransition(status as typeof taskStatus)}
                            className={cn(
                              "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all text-[11px]",
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
                            "text-[7px] sm:text-[8px] uppercase tracking-wide mt-2 font-semibold",
                            isActive ? "text-zinc-200 font-bold" : "text-zinc-600"
                          )}>
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Transition Buttons */}
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

                  {/* Audit Logs */}
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

              {/* Subtask & Comments Widget */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {/* Subtask progress */}
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

                {/* Comments */}
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

        {/* =============== HOW IT WORKS TIMELINE =============== */}
        <section
          id="how-it-works"
          ref={timelineRef}
          className="container mx-auto px-6 py-20 border-t border-zinc-900"
        >
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                <Compass className="size-3" />
                Workflow
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">How It Works</h2>
              <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
                From task creation to completion, every step is tracked, permission-gated, and audited in real-time.
              </p>
            </div>

            <div className="relative pl-8 sm:pl-32 space-y-12">
              <div className="absolute top-2 left-6 sm:left-20 bottom-2 w-0.5 bg-zinc-800" />
              <div className="timeline-connector-progress absolute top-2 left-6 sm:left-20 bottom-2 w-0.5 bg-zinc-200 scale-y-0" />

              {TIMELINE_STEPS.map((step) => (
                <div key={step.stage} className="timeline-card relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group">
                  <div className="absolute left-[-26px] sm:left-[-116px] top-1.5 w-4 h-4 rounded-full border border-zinc-800 bg-zinc-950 group-hover:border-zinc-300 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300" />
                  <span className="sm:w-20 text-zinc-500 font-mono text-xs uppercase tracking-widest pt-1">Stage {step.stage}</span>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-zinc-200 flex items-center gap-2">
                      {step.icon} {step.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =============== BETA PROGRAMME CTA =============== */}
        <section
          id="beta"
          className="container mx-auto px-6 py-20 border-t border-zinc-900 flex justify-center"
        >
          <div className="beta-section w-full max-w-2xl">
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/10 p-8 sm:p-12 backdrop-blur-md relative overflow-hidden">
              {/* Grid decoration */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
              {/* Glassmorphism glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-zinc-500/5 rounded-full blur-[100px] pointer-events-none" />

              {!betaSubmitted ? (
                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                    <Sparkles className="size-3 text-emerald-400" />
                    Beta Programme
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white">
                    Get Early Access
                  </h2>
                  <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Join the Ground Control Beta Programme and be among the first to experience the future of team task management. Get priority access and help shape the product.
                  </p>

                  <form onSubmit={handleBetaSubmit} className="w-full max-w-md space-y-3 mt-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={betaName}
                        onChange={(e) => setBetaName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
                      />
                      <input
                        type="email"
                        value={betaEmail}
                        onChange={(e) => setBetaEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={betaSubmitting}
                      size="lg"
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold h-12"
                    >
                      {betaSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="size-4" />
                          Request Beta Access
                        </span>
                      )}
                    </Button>
                  </form>

                  <p className="text-[10px] text-zinc-600 font-mono">
                    By joining, you agree to our{" "}
                    <Link href="/privacy" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300 transition-colors">
                      Privacy Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/terms" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300 transition-colors">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <div className="beta-success relative z-10 flex flex-col items-center text-center space-y-6 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="size-8 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">You&apos;re on the List!</h3>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      Thanks, {betaName}! We&apos;ll send early access details to <span className="text-zinc-300 font-medium">{betaEmail}</span> when we&apos;re ready to launch.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                    onClick={() => {
                      setBetaSubmitted(false)
                      setBetaName("")
                      setBetaEmail("")
                    }}
                  >
                    <RotateCcw className="size-3.5 mr-2" />
                    Submit Another
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============== FOOTER =============== */}
        <footer className="mt-auto border-t border-zinc-900 py-10 bg-zinc-950/40">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold tracking-tight text-zinc-200">Ground Control</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
                  Collaborative project management with real-time task tracking, approval workflows, and comprehensive audit trails.
                </p>
              </div>

              {/* Product Links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Product</h4>
                <div className="flex flex-col gap-2">
                  <a href="#features" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Features</a>
                  <a href="#how-it-works" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">How It Works</a>
                  <a href="#beta" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Join Beta</a>
                </div>
              </div>

              {/* Legal Links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">Legal</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/privacy" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Terms of Service</Link>
                  <Link href="/data-deletion" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Data Deletion</Link>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-600">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
              <span>© {new Date().getFullYear()} Ground Control. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
