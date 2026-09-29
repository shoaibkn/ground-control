"use client"

import React, { useState } from "react"
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Radio,
  Repeat,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Send,
  Check,
  X,
  RotateCcw,
  Clock,
  Flame,
  Smartphone,
  MessageSquare,
  Users,
  Eye,
  ExternalLink,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

type TabKey = "tasks" | "approvals" | "forms" | "sentdm"

export function CommandShowcase() {
  const [activeTab, setActiveTab] = useState<TabKey>("tasks")

  // Approvals demo state
  const [approvalDecision, setApprovalDecision] = useState<"pending" | "approved" | "rework" | "declined">("pending")
  const [decisionNote, setDecisionNote] = useState("")

  // Form demo state
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formValues, setFormValues] = useState({
    title: "Propulsion Loop Thermal Anomaly",
    severity: "High",
    department: "Telemetry & Avionics",
    notes: "Telemetry indicates pressure variance outside standard operating envelope.",
  })

  // Sent.dm message simulator state
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "sms" | "rcs">("whatsapp")

  return (
    <section id="command-center" className="relative border-t border-white/[0.08] bg-[#07080a] py-24 sm:py-32">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.06),transparent_60%)]" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-400 uppercase tracking-widest">
            <Radio className="size-3 animate-pulse" />
            OPERATIONAL ARCHITECTURE
          </div>

          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Command Deck Capabilities
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Engineered from first principles for mission-critical collaboration. Explore the four core subsystems powering Ground Control.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {[
            {
              id: "tasks" as TabKey,
              label: "Task & Recurrence Engine",
              icon: CheckCircle2,
              badge: "Reactive Sync",
            },
            {
              id: "approvals" as TabKey,
              label: "Approval Gateways",
              icon: ClipboardList,
              badge: "Multi-Stage",
            },
            {
              id: "forms" as TabKey,
              label: "Dynamic Forms & Intake",
              icon: FileText,
              badge: "Public Links",
            },
            {
              id: "sentdm" as TabKey,
              label: "Sent.dm Omnichannel Router",
              icon: Smartphone,
              badge: "SMS • WhatsApp • RCS",
            },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl border px-4 py-2.5 font-mono text-xs font-medium transition-all duration-300",
                  isActive
                    ? "border-cyan-500/60 bg-gradient-to-r from-cyan-950/60 to-emerald-950/40 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15] hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "hidden rounded px-1.5 py-0.2 text-[9px] sm:inline-block",
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-white/[0.04] text-zinc-600 group-hover:text-zinc-500"
                  )}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Display */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#090b10] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          {/* TAB 1: TASK & RECURRENCE ENGINE */}
          {activeTab === "tasks" && (
            <div className="grid grid-cols-1 p-6 lg:grid-cols-12 lg:p-10">
              <div className="space-y-6 lg:col-span-5 lg:pr-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Repeat className="size-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      RECURRENCE & PRIORITY DISPATCH
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
                    Intelligent Lifecycle & Recurrence Rules
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    Automate repetitive operational checkouts with customizable recurrence intervals (daily, weekly, monthly, quarterly). Set exact times of day, due dates, subtask checklists, and mandatory sign-offs.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>Convex Cron automation detects due dates automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>Granular priorities: Urgent, High, Medium, Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>Multiple assignees, collaborators, and starred task feeds</span>
                  </div>
                </div>
              </div>

              {/* Interactive Task Matrix Card */}
              <div className="mt-8 space-y-3 lg:col-span-7 lg:mt-0">
                {[
                  {
                    id: "TK-101",
                    title: "Calibrate Cryogenic Fuel Valve Pressure",
                    priority: "Urgent",
                    recurrence: "Every Monday at 08:00 UTC",
                    status: "In Progress",
                    subtasks: "3/4 Done",
                    assignee: "Sarah Connor",
                  },
                  {
                    id: "TK-102",
                    title: "Avionics Firmware Checksum Verification",
                    priority: "High",
                    recurrence: "Daily at 00:00 UTC",
                    status: "Under Review",
                    subtasks: "5/5 Done",
                    assignee: "John Glen",
                  },
                  {
                    id: "TK-103",
                    title: "Atmospheric Scrubber Filter Replacement",
                    priority: "Medium",
                    recurrence: "Bi-Weekly",
                    status: "Pending",
                    subtasks: "0/2 Done",
                    assignee: "Alex Vance",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-cyan-500/40 hover:bg-white/[0.04] sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-zinc-500">
                          {item.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[9px]",
                            item.priority === "Urgent" && "border-rose-500/40 text-rose-400",
                            item.priority === "High" && "border-amber-500/40 text-amber-400",
                            item.priority === "Medium" && "border-cyan-500/40 text-cyan-400"
                          )}
                        >
                          {item.priority}
                        </Badge>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <Repeat className="size-2.5 text-zinc-400" />
                          {item.recurrence}
                        </span>
                      </div>
                      <h4 className="font-heading text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-zinc-500">{item.subtasks}</span>
                      <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-cyan-300">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: APPROVAL GATEWAYS */}
          {activeTab === "approvals" && (
            <div className="grid grid-cols-1 p-6 lg:grid-cols-12 lg:p-10">
              <div className="space-y-6 lg:col-span-5 lg:pr-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ClipboardList className="size-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      SIGN-OFF AUDIT ENGINE
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
                    Multi-Stage Approval Pipeline
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    Prevent mission drift with verified approval workflows. Assign multiple approvers, mandate sign-offs before tasks can resolve, and track decisions across Pending, Approved, Declined, and Rework states.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 font-mono text-xs space-y-2">
                  <div className="text-zinc-500 uppercase text-[10px]">Active Decision Status</div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    {approvalDecision === "pending" && <span className="text-amber-400">● PENDING DECISION</span>}
                    {approvalDecision === "approved" && <span className="text-emerald-400">✓ FLIGHT CLEARANCE APPROVED</span>}
                    {approvalDecision === "rework" && <span className="text-cyan-400">↺ REWORK REQUESTED</span>}
                    {approvalDecision === "declined" && <span className="text-rose-400">✕ REQUEST DECLINED</span>}
                  </div>
                  {decisionNote && (
                    <div className="text-zinc-400 text-[11px] italic">
                      &quot;{decisionNote}&quot;
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Approval Simulator */}
              <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/40 p-6 lg:col-span-7 lg:mt-0">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-zinc-500">APPROVAL-GATE-09</span>
                    <h4 className="font-heading text-base font-bold text-white">
                      Orbital Insertion Burn Clearance
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono text-[10px]">
                    STAGE 3 APPROVAL
                  </Badge>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-zinc-300">
                  Telemetry verification complete. Delta-v margin measured at 342 m/s. Requesting authorization from Flight Director to proceed with primary thruster ignition.
                </p>

                {/* Interactive Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2.5 font-mono text-xs">
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovalDecision("approved")
                      setDecisionNote("All telemetry within green tolerances. Burn authorized.")
                    }}
                    className="bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400"
                  >
                    <Check className="size-3.5 mr-1" />
                    Approve Clearance
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setApprovalDecision("rework")
                      setDecisionNote("Please re-run chamber pressure telemetry scan.")
                    }}
                    className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    Request Rework
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setApprovalDecision("declined")
                      setDecisionNote("Abort burn. Thermal anomalies observed on gimbal.")
                    }}
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  >
                    <X className="size-3.5 mr-1" />
                    Decline Request
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC FORMS & PUBLIC INTAKE */}
          {activeTab === "forms" && (
            <div className="grid grid-cols-1 p-6 lg:grid-cols-12 lg:p-10">
              <div className="space-y-6 lg:col-span-5 lg:pr-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-violet-400">
                    <FileText className="size-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      EXTERNAL INTAKE ENGINE
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
                    Dynamic Form Builder & Public Sharing
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    Build dynamic forms with 10+ field types (text, selects, files, numbers, checkboxes). Share standalone links (`/shared-forms/[formId]`) with clients or ground crews who don&apos;t have accounts. Submissions instantly spawn tasks or approval requests.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-violet-400" />
                    <span>Public shareable URL with live validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-violet-400" />
                    <span>Pipes responses directly into task workflows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-violet-400" />
                    <span>Automatic notification to form creator upon submission</span>
                  </div>
                </div>
              </div>

              {/* Interactive Form Simulator */}
              <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/40 p-6 lg:col-span-7 lg:mt-0">
                {!formSubmitted ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setFormSubmitted(true)
                    }}
                    className="space-y-4 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div>
                        <span className="text-[10px] text-zinc-500">PUBLIC MISSION INTAKE FORM</span>
                        <h4 className="text-sm font-bold text-white">Incident & Anomaly Report</h4>
                      </div>
                      <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400 font-semibold">
                        SHAREABLE LINK
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase">Incident Title</label>
                      <input
                        type="text"
                        value={formValues.title}
                        onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase">Severity Level</label>
                        <select
                          value={formValues.severity}
                          onChange={(e) => setFormValues({ ...formValues, severity: e.target.value })}
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090b10] px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                        >
                          <option>Urgent</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase">Department</label>
                        <input
                          type="text"
                          value={formValues.department}
                          onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                          className="w-full rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                        >
                        </input>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase">Diagnostic Notes</label>
                      <textarea
                        rows={2}
                        value={formValues.notes}
                        onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-violet-600 text-white font-semibold hover:bg-violet-500">
                      Submit Incident Response
                    </Button>
                  </form>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Check className="size-6 stroke-[3]" />
                    </div>
                    <div className="space-y-1 font-mono">
                      <h4 className="text-base font-bold text-white">Intake Successfully Ingested!</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Response automatically synthesized into Task <span className="text-cyan-400 font-bold">#TK-9021</span>. Assigned to Telemetry & Avionics team.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormSubmitted(false)}
                      className="border-white/[0.1] text-zinc-300 font-mono text-xs"
                    >
                      Reset Form Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SENT.DM OMNICHANNEL ROUTER */}
          {activeTab === "sentdm" && (
            <div className="grid grid-cols-1 p-6 lg:grid-cols-12 lg:p-10">
              <div className="space-y-6 lg:col-span-5 lg:pr-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Smartphone className="size-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      SENT.DM TELEMETRY ROUTER
                    </span>
                  </div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
                    Carrier-Grade Omnichannel Notifications
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    Never miss a critical approval or overdue deadline. Ground Control routes alerts over SMS, WhatsApp verified business templates, RCS interactive messaging, and transactional email via Resend.
                  </p>
                </div>

                {/* Channel Switcher */}
                <div className="space-y-2">
                  <div className="font-mono text-[10px] text-zinc-500 uppercase">Select Channel Simulation:</div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {(["whatsapp", "sms", "rcs"] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setActiveChannel(ch)}
                        className={cn(
                          "rounded-lg border py-2 font-semibold uppercase transition-all",
                          activeChannel === ch
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "border-white/[0.08] bg-black/40 text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="font-mono text-xs text-zinc-400 space-y-1.5 pt-2">
                  <p>• 9 Pre-approved transactional notification templates</p>
                  <p>• Organizations can bring their own custom Sent.dm keys</p>
                  <p>• Real-time delivery callbacks and read receipts</p>
                </div>
              </div>

              {/* Simulated Mobile Device Preview */}
              <div className="mt-8 flex justify-center lg:col-span-7 lg:mt-0">
                <div className="w-full max-w-sm rounded-[2.5rem] border-4 border-zinc-800 bg-[#06080b] p-3 shadow-2xl">
                  {/* Phone Notch & Status */}
                  <div className="flex items-center justify-between px-4 py-2 font-mono text-[10px] text-zinc-400">
                    <span>09:41</span>
                    <div className="h-3.5 w-16 rounded-full bg-zinc-800" />
                    <span>5G • 100%</span>
                  </div>

                  {/* App Screen Content */}
                  <div className="mt-3 rounded-2xl border border-white/[0.08] bg-zinc-950 p-4 font-sans text-xs">
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Radio className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-bold text-white">
                          <span>Ground Control</span>
                          {activeChannel === "whatsapp" && (
                            <span className="text-emerald-400 text-[10px]">✓ Verified</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {activeChannel.toUpperCase()} DISPATCH
                        </span>
                      </div>
                    </div>

                    {/* Chat Bubble Notification */}
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-zinc-900/80 p-3.5 text-zinc-200 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span className="font-bold text-cyan-400">TASK ASSIGNED</span>
                        <span>Just now</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Ground Control: You have been assigned to <span className="font-semibold text-white">&quot;Calibrate Sat-Com Phased Array&quot;</span> by Flight Director Sarah. Due date: Today 18:00 UTC.
                      </p>
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px]">
                        <span className="text-zinc-500">Sent.dm Router</span>
                        <span className="text-emerald-400">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
