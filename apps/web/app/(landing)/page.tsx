"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
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
  Radio,
  Flame,
  Smartphone,
  Globe,
  Database,
  Cloud,
  Code2,
  Zap,
} from "lucide-react"

import { LandingHeader } from "@/components/landing/header"
import { CockpitPreview } from "@/components/landing/cockpit-preview"
import { CommandShowcase } from "@/components/landing/command-showcase"
import { RbacSimulator } from "@/components/landing/rbac-simulator"
import { BoardingPass } from "@/components/landing/boarding-pass"
import { LandingFooter } from "@/components/landing/footer"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

// Register ScrollTrigger safely in browser context
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// 6 Core Architectural Capabilities
const CAPABILITIES = [
  {
    icon: Zap,
    color: "cyan",
    title: "Convex Reactive Engine",
    description:
      "Instant WebSocket-driven state sync with zero polling. Every task update, comment, and approval decision propagates across all client dashboards in under 12 milliseconds.",
    badge: "Reactive DB",
  },
  {
    icon: ClipboardList,
    color: "emerald",
    title: "Multi-Stage Approval Gates",
    description:
      "Mandate formal sign-offs before critical tasks resolve. Supports Pending, Approved, Declined, and Rework states with dedicated discussion threads and full audit logging.",
    badge: "Decision Pipeline",
  },
  {
    icon: Smartphone,
    color: "amber",
    title: "Sent.dm Omnichannel Dispatch",
    description:
      "Enterprise SMS, verified WhatsApp business notifications, and interactive RCS messages. Powered by Sent.dm with 9 pre-approved templates and custom org API keys.",
    badge: "SMS • WhatsApp • RCS",
  },
  {
    icon: FileText,
    color: "violet",
    title: "Dynamic Form Builder",
    description:
      "Build structured intake forms with 10+ field types. Share standalone public links (/shared-forms/[formId]) that immediately pipe incoming responses into verified tasks.",
    badge: "Public Intake",
  },
  {
    icon: Shield,
    color: "emerald",
    title: "Fine-Grained RBAC & Security",
    description:
      "Granular role matrices per organization. Admin, Member, and Guest roles with action scoping. Every mutation is gate-checked at the database boundary before execution.",
    badge: "Better Auth + RBAC",
  },
  {
    icon: Globe,
    color: "cyan",
    title: "Native Mobile Companion",
    description:
      "Full native mobile experience built on Expo SDK 56 with Uniwind. Shared types, background push notifications, and offline-resilient task workflows on iOS and Android.",
    badge: "Expo SDK 56",
  },
]

// 4 Flight Plan Workflow Stages
const WORKFLOW_STAGES = [
  {
    stage: "01",
    title: "Intake & Structured Capture",
    description:
      "Create high-velocity tasks or ingest structured incident reports via shareable dynamic forms. Define priorities, due dates, and recurrence engines.",
    icon: FileText,
    tag: "CAPTURE",
  },
  {
    stage: "02",
    title: "Permission-Gated Execution",
    description:
      "Assigned operators execute subtask matrices. Real-time in-task discussions with Cloudflare R2 attachments keep distributed teams aligned with live read receipts.",
    icon: Cpu,
    tag: "ORCHESTRATE",
  },
  {
    stage: "03",
    title: "Mandated Sign-Off & Approvals",
    description:
      "Tasks flagged with 'requires approval' automatically lock completion until authorized by designated Flight Directors. Reviewers can approve, decline, or request rework.",
    icon: Shield,
    tag: "AUTHORIZE",
  },
  {
    stage: "04",
    title: "Omnichannel Dispatch & Audit",
    description:
      "Sent.dm routes instant WhatsApp, SMS, and RCS alerts while Resend delivers email receipts. Every state transition is permanently archived in immutable Convex audit logs.",
    icon: Radio,
    tag: "AUDIT & DISPATCH",
  },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const statsSectionRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Animated Telemetry Stats Counters
  const [stats, setStats] = useState({
    tasks: 0,
    latency: 0,
    routes: 0,
    uptime: 0,
  })

  // GSAP Animations Context
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } })
      heroTl
        .fromTo(
          ".hero-badge",
          { opacity: 0, y: -20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 }
        )
        .fromTo(
          ".hero-headline",
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.3"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ".hero-actions",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-cockpit",
          { opacity: 0, y: 50, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" },
          "-=0.2"
        )

      // 2. Animated Stats Counter Tween with ScrollTrigger
      const statTargets = { tasks: 0, latency: 0, routes: 0, uptime: 0 }
      gsap.to(statTargets, {
        tasks: 24800,
        latency: 12,
        routes: 9,
        uptime: 99.99,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: statsSectionRef.current,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          setStats({
            tasks: Math.floor(statTargets.tasks),
            latency: Math.floor(statTargets.latency),
            routes: Math.floor(statTargets.routes),
            uptime: Math.round(statTargets.uptime * 100) / 100,
          })
        },
      })

      // 3. Staggered Capability Cards Reveal
      gsap.utils.toArray<HTMLElement>(".capability-card").forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: (index % 3) * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        )
      })

      // 4. Timeline Vertical Connector Line Scrub
      gsap.fromTo(
        ".timeline-scrub-line",
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top 70%",
            end: "bottom 75%",
            scrub: true,
          },
        }
      )

      // 5. Timeline Step Cards Stagger
      gsap.utils.toArray<HTMLElement>(".timeline-step").forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // 3D Card Hover Tilt Effect
  const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const maxRotate = 4
    const rotateY = ((x - centerX) / centerX) * maxRotate
    const rotateX = -((y - centerY) / centerY) * maxRotate

    gsap.to(card, {
      rotateX,
      rotateY,
      transformPerspective: 1000,
      ease: "power2.out",
      duration: 0.3,
      overwrite: "auto",
    })
  }

  const handleCardTiltReset = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      ease: "power3.out",
      duration: 0.5,
      overwrite: "auto",
    })
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden bg-[#07080a] font-sans text-zinc-100 selection:bg-cyan-500 selection:text-black antialiased"
    >
      {/* Background Engineering Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Ambient Radial Lights */}
      <div className="pointer-events-none absolute top-[-5%] left-1/2 z-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[160px]" />
      <div className="pointer-events-none absolute top-[40%] right-[-10%] z-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[160px]" />
      <div className="pointer-events-none absolute top-[70%] left-[-10%] z-0 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[160px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation Header */}
        <LandingHeader />

        {/* =============== HERO SECTION =============== */}
        <section className="container mx-auto flex flex-col items-center px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-28 lg:pt-28">
          {/* Telemetry Status Pill */}
          <div className="hero-badge mb-6 inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1.5 font-mono text-xs text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400">MISSION STATUS:</span>
            <span className="font-semibold text-white">ORBITAL BETA ACTIVE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] text-zinc-400">LAT 28.57° N</span>
          </div>

          {/* Primary Headline */}
          <h1 className="hero-headline max-w-5xl font-heading text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-7xl">
            Precision Operations for{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              High-Velocity Teams
            </span>
          </h1>

          {/* Subtitle Value Prop */}
          <p className="hero-subtitle mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base md:text-lg">
            Ground Control unifies intelligent task management, multi-stage approval gateways, dynamic forms, and carrier-grade Sent.dm notifications into one real-time reactive command deck.
          </p>

          {/* CTA Action Buttons */}
          <div className="hero-actions mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-emerald-500 px-7 font-mono text-xs font-bold text-zinc-950 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
            >
              <Link href="/sign-up" className="flex items-center gap-2">
                <Radio className="size-4" />
                <span>Deploy Free Workspace</span>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById("command-center")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="h-12 rounded-xl border-white/[0.12] bg-white/[0.02] px-6 font-mono text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              <Compass className="mr-2 size-4 text-cyan-400" />
              Explore Command Deck
            </Button>
          </div>

          {/* Hero 3D Cockpit Preview */}
          <div className="hero-cockpit mt-14 w-full">
            <CockpitPreview />
          </div>
        </section>

        {/* =============== TELEMETRY STATS TICKER =============== */}
        <section
          ref={statsSectionRef}
          className="border-y border-white/[0.08] bg-[#090b10]/80 py-10 backdrop-blur-xl"
        >
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              <div className="text-center font-mono">
                <span className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Tasks Dispatched
                </span>
                <span className="mt-1 block font-heading text-3xl font-extrabold text-white sm:text-4xl">
                  {stats.tasks.toLocaleString()}+
                </span>
                <span className="mt-0.5 block text-[10px] text-cyan-400">Zero state desync</span>
              </div>

              <div className="text-center font-mono">
                <span className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Reactive Latency
                </span>
                <span className="mt-1 block font-heading text-3xl font-extrabold text-white sm:text-4xl">
                  &lt; {stats.latency}ms
                </span>
                <span className="mt-0.5 block text-[10px] text-emerald-400">Convex WebSocket</span>
              </div>

              <div className="text-center font-mono">
                <span className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Omnichannel Routes
                </span>
                <span className="mt-1 block font-heading text-3xl font-extrabold text-white sm:text-4xl">
                  {stats.routes} Channels
                </span>
                <span className="mt-0.5 block text-[10px] text-amber-400">Sent.dm + Resend</span>
              </div>

              <div className="text-center font-mono">
                <span className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  System Reliability
                </span>
                <span className="mt-1 block font-heading text-3xl font-extrabold text-white sm:text-4xl">
                  {stats.uptime}%
                </span>
                <span className="mt-0.5 block text-[10px] text-emerald-400">Immutable Audit</span>
              </div>
            </div>
          </div>
        </section>

        {/* =============== INTERACTIVE COMMAND SHOWCASE =============== */}
        <CommandShowcase />

        {/* =============== CORE CAPABILITIES GRID =============== */}
        <section id="capabilities" className="relative border-t border-white/[0.08] bg-[#07080a] py-24 sm:py-32">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
                <Layers className="size-3" />
                SYSTEM CAPABILITIES
              </div>

              <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Engineered for Complete Operational Control
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Everything required to coordinate complex workflows, enforce mandatory sign-offs, and maintain absolute visibility across team operations.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon
                return (
                  <div
                    key={cap.title}
                    onMouseMove={handleCardTilt}
                    onMouseLeave={handleCardTiltReset}
                    className="capability-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090b10] p-7 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Subtle corner crosshair */}
                    <div className="pointer-events-none absolute top-3 right-3 font-mono text-[9px] text-zinc-700">
                      +
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] text-cyan-400 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 transition-colors">
                          <Icon className="size-5" />
                        </div>
                        <Badge variant="outline" className="border-white/[0.08] bg-white/[0.02] font-mono text-[9px] text-zinc-400">
                          {cap.badge}
                        </Badge>
                      </div>

                      <h3 className="font-heading text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {cap.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-zinc-400">
                        {cap.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 group-hover:text-cyan-400 transition-colors">
                      <span>LEARN SUBSYSTEM</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* =============== RBAC & PERMISSION SIMULATOR =============== */}
        <RbacSimulator />

        {/* =============== 4-STAGE FLIGHT PLAN WORKFLOW =============== */}
        <section id="workflow" ref={timelineRef} className="relative border-t border-white/[0.08] bg-[#07080a] py-24 sm:py-32">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
                <Compass className="size-3" />
                OPERATIONAL SEQUENCE
              </div>

              <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                The Ground Control Trajectory
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                How work progresses safely through the Ground Control lifecycle from intake to permanent audit.
              </p>
            </div>

            {/* Vertical Timeline Track */}
            <div className="relative mt-16 pl-8 sm:pl-28">
              {/* Background Track Line */}
              <div className="absolute top-2 bottom-2 left-4 w-0.5 bg-white/[0.08] sm:left-14" />
              {/* Scrubbed Progress Line */}
              <div className="timeline-scrub-line absolute top-2 bottom-2 left-4 w-0.5 bg-gradient-to-b from-cyan-400 via-emerald-400 to-teal-400 sm:left-14" />

              <div className="space-y-12">
                {WORKFLOW_STAGES.map((step) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={step.stage}
                      className="timeline-step group relative flex flex-col items-start gap-3 sm:flex-row sm:gap-8"
                    >
                      {/* Node Bullet Marker */}
                      <div className="absolute top-1 left-[-22px] flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.2] bg-[#07080a] group-hover:border-cyan-400 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all sm:left-[-62px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      </div>

                      {/* Stage Identifier */}
                      <div className="pt-0.5 font-mono text-xs font-bold text-cyan-400 sm:w-20">
                        PHASE {step.stage}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#090b10] p-6 transition-all hover:border-white/[0.15]">
                        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase">
                          <Icon className="size-3.5 text-zinc-400" />
                          <span>{step.tag}</span>
                        </div>
                        <h3 className="mt-1 font-heading text-lg font-bold text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =============== TECH STACK & OPEN ARCHITECTURE =============== */}
        <section className="relative border-t border-white/[0.08] bg-[#050608] py-20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center font-mono">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                BUILT ON INDUSTRY-LEADING FOUNDATIONS
              </span>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Next.js 16 (App Router)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Convex Reactive Cloud
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Better Auth RBAC
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Expo SDK 56 (Mobile)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Sent.dm Omnichannel
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Cloudflare R2 Storage
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =============== BETA FLIGHT CLEARANCE BOARDING PASS =============== */}
        <BoardingPass />

        {/* =============== MISSION CONTROL FOOTER =============== */}
        <LandingFooter />
      </div>
    </div>
  )
}
