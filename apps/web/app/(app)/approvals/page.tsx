"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@workspace/ui/components/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Plus,
  Kanban,
  List,
  Table as TableIcon,
  Search,
  Calendar,
  Paperclip,
  MessageSquare,
  ChevronDown,
  Loader2,
  Columns,
  ChevronLeft,
  Archive,
  SlidersHorizontal,
  Filter,
  X,
  Check,
} from "lucide-react"
import ApprovalsSidebar from "./components/approvals-internal-sidebar"
import { CreateApprovalDialog } from "./components/create-approval-dialog"
import ApprovalDetailsSheet from "./components/approval-details-sheet"
import { toast } from "sonner"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@workspace/ui/components/dropdown-menu"

interface ApprovalFilters {
  statuses: string[]
  relations: string[]
  peopleIds: string[]
  dueDates: ("overdue" | "today" | "week" | "none")[]
}

const defaultFilters: ApprovalFilters = {
  statuses: [],
  relations: [],
  peopleIds: [],
  dueDates: [],
}

export default function ApprovalsPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<"kanban" | "list" | "table">("table")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedApprovalId, setSelectedApprovalId] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [filters, setFilters] = useState<ApprovalFilters>(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [timePreset, setTimePreset] = useState<
    "all" | "overdue" | "today" | "week" | "later"
  >("all")
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<
    number | null
  >(new Date().setHours(0, 0, 0, 0))
  const [showAllDates, setShowAllDates] = useState(false)
  const [daysCount, setDaysCount] = useState(30)
  const [pastDaysCount, setPastDaysCount] = useState(7)
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: session } = authClient.useSession()

  // Fetch approvals for the current organization
  const approvals = useQuery(
    api.approvals.getApprovals,
    activeOrg ? { organizationId: activeOrg.id, showArchived } : "skip"
  )

  // Fetch organization member profiles (if any exist)
  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  const updateApprovalStatus = useMutation(api.approvals.updateApprovalStatus)
  const addChat = useMutation(api.approvalChats.addChat)

  // Group By state
  const [groupBy, setGroupBy] = useState<"none" | "status" | "relation">("none")
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  // Kanban column visibility
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>([
    "Pending",
    "Approved",
    "Declined",
    "Rework",
  ])
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([])

  const currentUserId = session?.user?.id

  const getApprovalRelation = (approval: any) => {
    if (!currentUserId) return "Other"
    if (approval.creatorId === currentUserId) return "Creator"
    if (approval.approverIds?.includes(currentUserId)) return "Approver"
    if (approval.subscriberIds?.includes(currentUserId)) return "Subscriber"
    return "Other"
  }

  const getRelationStyle = (relation: string) => {
    switch (relation) {
      case "Creator":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30"
      case "Approver":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/30 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30"
      case "Subscriber":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "Declined":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      case "Rework":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      default:
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((k) => k !== groupKey)
        : [...prev, groupKey]
    )
  }

  const handleStatusChange = async (approvalId: any, nextStatus: string) => {
    try {
      await updateApprovalStatus({
        approvalId,
        status: nextStatus,
        comment: "Status changed from list view",
      })

      // Send status change into chat
      await addChat({
        approvalId,
        content: `changed status to ${nextStatus}. Comment: Status changed from list view`,
        statusChange: nextStatus,
      })

      toast.success(`Approval status updated to ${nextStatus}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  const getTimelineDays = () => {
    const list = []
    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    for (let i = -pastDaysCount; i < daysCount; i++) {
      list.push(startOfToday + i * 24 * 60 * 60 * 1000)
    }
    return list
  }

  const getDayApprovalCount = (dayTimestamp: number) => {
    if (!approvals) return 0
    const dayStart = new Date(dayTimestamp).setHours(0, 0, 0, 0)
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1
    return approvals.filter(
      (a: any) =>
        !a.isArchived &&
        a.status !== "Approved" &&
        a.status !== "Declined" &&
        a.dueDate &&
        a.dueDate >= dayStart &&
        a.dueDate <= dayEnd
    ).length
  }

  const updateVisibleMonth = (container: HTMLDivElement | null) => {
    if (!container) return
    const children = container.children
    if (!children || children.length === 0) return

    const containerRect = container.getBoundingClientRect()
    const targetX = containerRect.left + 80 // slightly offset from left edge

    let closestChild: Element | null = null
    let minDistance = Infinity

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      const childRect = child.getBoundingClientRect()
      const centerX = childRect.left + childRect.width / 2
      const distance = Math.abs(centerX - targetX)
      if (distance < minDistance) {
        minDistance = distance
        closestChild = child
      }
    }

    if (closestChild) {
      const timestampAttr = closestChild.getAttribute("data-timestamp")
      if (timestampAttr) {
        const timestamp = parseInt(timestampAttr, 10)
        const date = new Date(timestamp)
        const monthYear = date.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
        setCurrentVisibleMonth(monthYear)
      }
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollRight =
      target.scrollWidth - target.scrollLeft - target.clientWidth
    if (scrollRight < 200) {
      setDaysCount((prev) => prev + 14)
    }
    if (target.scrollLeft < 100) {
      const prevScrollWidth = target.scrollWidth
      setPastDaysCount((prev) => prev + 14)
      setTimeout(() => {
        const diff = target.scrollWidth - prevScrollWidth
        target.scrollLeft += diff
      }, 0)
    }
    updateVisibleMonth(target)
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayStart = new Date().setHours(0, 0, 0, 0)
      const todayBtn = scrollContainerRef.current.querySelector(
        `[data-timestamp="${todayStart}"]`
      )
      if (todayBtn) {
        todayBtn.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center",
        })
      }
      updateVisibleMonth(scrollContainerRef.current)
    }
  }, [scrollContainerRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFiltersCount =
    filters.statuses.length +
    filters.relations.length +
    filters.peopleIds.length +
    (filters.dueDates?.length || 0)

  const filteredApprovals = approvals?.filter((app: any) => {
    // 1. Text Search Query
    const titleMatch = app.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const descMatch =
      app.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    if (!titleMatch && !descMatch) return false

    // 2. Status Filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
      return false
    }

    // 3. Relation Filter
    if (filters.relations.length > 0) {
      const relation = getApprovalRelation(app)
      if (!filters.relations.includes(relation)) {
        return false
      }
    }

    // 4. People Filter (Approvers or Subscribers)
    if (filters.peopleIds.length > 0) {
      const isMemberMatched = filters.peopleIds.some(
        (pid) =>
          app.approverIds.includes(pid) || app.subscriberIds?.includes(pid)
      )
      if (!isMemberMatched) return false
    }

    // 5. Due Date Preset Filter
    if (filters.dueDates && filters.dueDates.length > 0) {
      const now = Date.now()
      const startOfToday = new Date(now).setHours(0, 0, 0, 0)
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1
      const dayOfWeek = new Date(now).getDay()
      const startOfWeek = startOfToday - dayOfWeek * 24 * 60 * 60 * 1000
      const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1

      const matchesAnyDate = filters.dueDates.some((dateType) => {
        if (dateType === "none") return !app.dueDate
        if (dateType === "overdue") {
          return (
            app.dueDate &&
            app.dueDate < startOfToday &&
            app.status !== "Approved" &&
            app.status !== "Declined"
          )
        }
        if (dateType === "today") {
          return (
            app.dueDate &&
            app.dueDate >= startOfToday &&
            app.dueDate <= endOfToday
          )
        }
        if (dateType === "week") {
          return (
            app.dueDate &&
            app.dueDate >= startOfWeek &&
            app.dueDate <= endOfWeek
          )
        }
        return false
      })
      if (!matchesAnyDate) return false
    }

    return true
  })

  const getGroupedApprovals = () => {
    if (!filteredApprovals) return {}
    if (groupBy === "none") return { "": filteredApprovals }

    const groups: Record<string, any[]> = {}

    if (groupBy === "status") {
      filteredApprovals.forEach((app: any) => {
        const key = `Stage: ${app.status}`
        if (!groups[key]) groups[key] = []
        groups[key].push(app)
      })
    } else if (groupBy === "relation") {
      groups["Creator"] = []
      groups["Approver"] = []
      groups["Subscriber"] = []
      groups["Other"] = []

      filteredApprovals.forEach((app: any) => {
        const rel = getApprovalRelation(app)
        groups[rel]!.push(app)
      })

      Object.keys(groups).forEach((key) => {
        if (groups[key]!.length === 0) delete groups[key]
      })
    }

    return groups
  }

  const getCountsForSidebar = () => {
    if (!approvals)
      return { all: 0, pending: 0, approved: 0, declined: 0, rework: 0 }
    return {
      all: approvals.length,
      pending: approvals.filter((a) => a.status === "Pending").length,
      approved: approvals.filter((a) => a.status === "Approved").length,
      declined: approvals.filter((a) => a.status === "Declined").length,
      rework: approvals.filter((a) => a.status === "Rework").length,
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase()
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (!activeOrg) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Please select or create an organization first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col space-y-4">
      {/* Header bar */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            Approval Requests
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Submit documents, coordinate reviews, and track sign-offs.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* Main Filters & Stages trigger */}
          <ApprovalsSidebar
            counts={getCountsForSidebar()}
            activeFilter={filters.statuses[0] || "all"}
            setActiveFilter={(status) => {
              if (status === "all") {
                setFilters((prev) => ({ ...prev, statuses: [] }))
              } else {
                setFilters((prev) => ({
                  ...prev,
                  statuses: [status.charAt(0).toUpperCase() + status.slice(1)],
                }))
              }
            }}
          />

          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex h-8 items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </Button>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 md:max-w-md">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-muted-foreground/75" />
            <Input
              placeholder="Search approval requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 border-input/60 bg-background/50 pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode controls */}
            <ButtonGroup>
              <Button
                variant={view === "table" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setView("table")}
              >
                <TableIcon className="mr-1 h-3.5 w-3.5" />
                <span>Table</span>
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setView("list")}
              >
                <List className="mr-1 h-3.5 w-3.5" />
                <span>Cards</span>
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setView("kanban")}
              >
                <Kanban className="mr-1 h-3.5 w-3.5" />
                <span>Kanban</span>
              </Button>
            </ButtonGroup>

            {/* Advanced Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-1.5 border-input/40 bg-input/10 text-xs transition-all dark:bg-input/20",
                activeFiltersCount > 0 &&
                  "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary-foreground px-1 text-[9px] font-bold text-primary"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Group By Selector */}
            {(view === "table" || view === "list") && (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Group By:
                </span>
                <Select
                  value={groupBy}
                  onValueChange={(val: any) => setGroupBy(val)}
                >
                  <SelectTrigger className="h-8 w-[120px] border-input/40 bg-input/10 text-xs dark:bg-input/20">
                    <SelectValue placeholder="Group By" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="relation">User Relation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Columns Toggle for Kanban view */}
            {view === "kanban" && (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Columns:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex h-8 items-center gap-1.5 border-input/40 bg-input/10 text-xs dark:bg-input/20"
                    >
                      <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>View Columns</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider uppercase">
                      Toggle Columns
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["Pending", "Approved", "Declined", "Rework"].map((st) => {
                      const isVisible = visibleStatuses.includes(st)
                      return (
                        <DropdownMenuCheckboxItem
                          key={st}
                          checked={isVisible}
                          onCheckedChange={(checked) => {
                            setVisibleStatuses((prev) =>
                              checked
                                ? [...prev, st]
                                : prev.filter((s) => s !== st)
                            )
                          }}
                        >
                          {st}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Archive Filter button */}
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived((prev) => !prev)}
              className={cn(
                "flex h-8 items-center gap-1.5 text-xs transition-colors",
                showArchived
                  ? "text-primary-foreground"
                  : "border-input/40 bg-input/10 text-muted-foreground hover:text-foreground dark:bg-input/20"
              )}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>{showArchived ? "Hide Archived" : "Show Archived"}</span>
            </Button>
          </div>
        </div>

        {/* Quick Time Horizon Filter Bar & Weekly Calendar Strip */}
        <div className="flex shrink-0 flex-col items-stretch justify-between gap-4 rounded-xl border border-border/40 bg-card p-3 shadow-xs lg:flex-row lg:items-center">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Due presets:
            </span>
            {[
              {
                key: "all",
                label: "All Requests",
                count: approvals?.filter((a) => !a.isArchived).length || 0,
              },
              {
                key: "overdue",
                label: "Overdue",
                count:
                  approvals?.filter(
                    (a) =>
                      !a.isArchived &&
                      a.status !== "Approved" &&
                      a.status !== "Declined" &&
                      a.dueDate &&
                      a.dueDate < new Date().setHours(0, 0, 0, 0)
                  ).length || 0,
                className:
                  "text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200 dark:border-red-900/30",
              },
              {
                key: "today",
                label: "Today",
                count:
                  approvals?.filter(
                    (a) =>
                      !a.isArchived &&
                      a.dueDate &&
                      a.dueDate >= new Date().setHours(0, 0, 0, 0) &&
                      a.dueDate <
                        new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
                  ).length || 0,
                className:
                  "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-200 dark:border-amber-900/30",
              },
              {
                key: "week",
                label: "This Week",
                count:
                  approvals?.filter((a) => {
                    const startOfWeek =
                      new Date().setHours(0, 0, 0, 0) -
                      new Date().getDay() * 24 * 60 * 60 * 1000
                    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000
                    return (
                      !a.isArchived &&
                      a.dueDate &&
                      a.dueDate >= startOfWeek &&
                      a.dueDate < endOfWeek
                    )
                  }).length || 0,
                className:
                  "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30",
              },
              {
                key: "later",
                label: "Later",
                count:
                  approvals?.filter((a) => {
                    const startOfWeek =
                      new Date().setHours(0, 0, 0, 0) -
                      new Date().getDay() * 24 * 60 * 60 * 1000
                    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000
                    return !a.isArchived && a.dueDate && a.dueDate >= endOfWeek
                  }).length || 0,
              },
            ].map((preset) => {
              const isActive =
                timePreset === preset.key &&
                (showAllDates || selectedTimelineDate === null)
              return (
                <Button
                  key={preset.key}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 cursor-pointer rounded-full border px-2.5 text-[10px] font-semibold transition-all duration-200",
                    !isActive &&
                      (preset.className ||
                        "border-border/40 bg-muted/10 hover:bg-muted/20")
                  )}
                  onClick={() => {
                    setTimePreset(preset.key as any)
                    setShowAllDates(true)
                  }}
                >
                  <span>{preset.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold",
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    )}
                  >
                    {preset.count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Sliding 14-day strip */}
          <div className="flex flex-1 flex-col gap-1 overflow-hidden lg:max-w-md xl:max-w-lg">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Horizon
              </span>
              <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary transition-all duration-200 select-none dark:bg-primary/20">
                {currentVisibleMonth}
              </span>
            </div>
            <div className="flex w-full items-center gap-3 overflow-hidden">
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex max-w-full flex-1 items-center gap-1.5 overflow-x-auto px-0.5 py-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {getTimelineDays().map((dayTimestamp) => {
                  const date = new Date(dayTimestamp)
                  const isSelected =
                    selectedTimelineDate !== null &&
                    new Date(selectedTimelineDate).setHours(0, 0, 0, 0) ===
                      new Date(dayTimestamp).setHours(0, 0, 0, 0)
                  const dayName = date.toLocaleDateString(undefined, {
                    weekday: "narrow",
                  })
                  const dayNum = date.getDate()
                  const dayApprovalCount = getDayApprovalCount(dayTimestamp)
                  return (
                    <button
                      key={dayTimestamp}
                      type="button"
                      data-timestamp={dayTimestamp}
                      onClick={() => {
                        setSelectedTimelineDate(dayTimestamp)
                        setShowAllDates(false)
                      }}
                      className={cn(
                        "relative flex h-10 w-10 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full border text-[9px] font-bold transition-all active:scale-95",
                        isSelected && !showAllDates
                          ? "scale-105 border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/20 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <span className="text-[8px] font-normal opacity-75">
                        {dayName}
                      </span>
                      <span className="mt-0.5 text-[10px] leading-none">
                        {dayNum}
                      </span>
                      {dayApprovalCount > 0 && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-0.5 text-[8px] font-bold",
                            isSelected && !showAllDates
                              ? "border-primary bg-amber-500 text-white"
                              : "border-card bg-primary text-primary-foreground"
                          )}
                        >
                          {dayApprovalCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 border-l border-border/50 py-1 pl-3">
                <Switch
                  id="show-all-dates"
                  checked={showAllDates}
                  onCheckedChange={setShowAllDates}
                  className="scale-90"
                />
                <Label
                  htmlFor="show-all-dates"
                  className="cursor-pointer text-[10px] font-medium text-muted-foreground select-none"
                >
                  Show All
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            <span className="mr-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Active Filters:
            </span>

            {/* Statuses */}
            {filters.statuses.map((status) => (
              <Badge
                key={status}
                variant="outline"
                className="h-6 gap-1 border-sky-500/15 bg-sky-500/5 pr-1 pl-2.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400"
              >
                <span>Stage: {status}</span>
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      statuses: f.statuses.filter((s) => s !== status),
                    }))
                  }
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}

            {/* Relations */}
            {filters.relations.map((rel) => (
              <Badge
                key={rel}
                variant="outline"
                className="h-6 gap-1 border-indigo-500/15 bg-indigo-500/5 pr-1 pl-2.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400"
              >
                <span>Relation: {rel}</span>
                <button
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      relations: f.relations.filter((r) => r !== rel),
                    }))
                  }
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}

            {/* Members */}
            {filters.peopleIds.map((pid) => {
              const mem = activeOrg.members?.find((m: any) => m.userId === pid)
              return (
                <Badge
                  key={pid}
                  variant="outline"
                  className="h-6 gap-1 border-border bg-slate-500/5 pr-1 pl-2 text-[10px] font-semibold text-foreground/80"
                >
                  <div className="flex items-center gap-1">
                    <UserAvatar userId={pid} avatarClassName="h-3.5 w-3.5" />
                    <span>{mem?.user?.name || pid.slice(-4)}</span>
                  </div>
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        peopleIds: f.peopleIds.filter((p) => p !== pid),
                      }))
                    }
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )
            })}

            {/* Due Dates */}
            {filters.dueDates?.map((dateKey) => {
              const label =
                dateKey === "overdue"
                  ? "Overdue"
                  : dateKey === "today"
                    ? "Due Today"
                    : dateKey === "week"
                      ? "Due This Week"
                      : "No Due Date"
              return (
                <Badge
                  key={dateKey}
                  variant="outline"
                  className="flex h-6 items-center gap-1 rounded-full border-red-500/20 bg-red-500/10 px-2 text-[10px] font-semibold text-red-500 dark:border-red-500/10 dark:bg-red-500/20 dark:text-red-300"
                >
                  <span>Due: {label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        dueDates: prev.dueDates.filter((d) => d !== dateKey),
                      }))
                    }
                    className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(defaultFilters)}
              className="flex h-6 items-center gap-1 px-2 text-[10px] font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Left-floating filters sheet */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="!fixed !top-4 !bottom-4 !left-4 z-50 flex !h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-md duration-300 outline-none sm:!max-w-md"
          >
            <SheetHeader className="border-b border-border/40 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="flex items-center gap-2 text-sm font-bold">
                    <SlidersHorizontal className="size-4 text-primary" />
                    Advanced Filters
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-[10px] text-muted-foreground">
                    Narrow down approval requests by specific criteria.
                  </SheetDescription>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setFiltersOpen(false)}
                  className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 scrollbar-thin space-y-6 overflow-y-auto p-6">
              {/* Status */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  Status
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Pending", "Approved", "Declined", "Rework"].map((st) => {
                    const isSelected = filters.statuses.includes(st)
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            statuses: isSelected
                              ? f.statuses.filter((s) => s !== st)
                              : [...f.statuses, st],
                          }))
                        }}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {st}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Relation */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  Your Relation
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Creator", "Approver", "Subscriber"].map((rel) => {
                    const isSelected = filters.relations.includes(rel)
                    return (
                      <button
                        key={rel}
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            relations: isSelected
                              ? f.relations.filter((r) => r !== rel)
                              : [...f.relations, rel],
                          }))
                        }}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {rel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Due Date Presets */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Due Date Presets
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "overdue", label: "Overdue" },
                    { key: "today", label: "Due Today" },
                    { key: "week", label: "Due This Week" },
                    { key: "none", label: "No Due Date" },
                  ].map((item: any) => {
                    const selected = filters.dueDates?.includes(item.key)
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            dueDates: selected
                              ? prev.dueDates.filter((d) => d !== item.key)
                              : [...prev.dueDates, item.key],
                          }))
                        }}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Members */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  People Involved
                </h4>
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {activeOrg.members?.map((m: any) => {
                    const isSelected = filters.peopleIds.includes(m.userId)
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            peopleIds: isSelected
                              ? f.peopleIds.filter((id) => id !== m.userId)
                              : [...f.peopleIds, m.userId],
                          }))
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors",
                          isSelected
                            ? "border border-primary/20 bg-primary/5"
                            : "border border-transparent hover:bg-accent/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            userId={m.userId}
                            avatarClassName="h-5.5 w-5.5"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {m.user?.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {m.user?.email}
                            </span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <SheetFooter className="mt-auto flex flex-row items-center gap-3 border-t border-border/40 bg-muted/5 p-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(defaultFilters)
                  setFiltersOpen(false)
                }}
                className="flex-1 text-xs"
              >
                Reset All
              </Button>
              <Button
                size="sm"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 text-xs"
              >
                Done
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content grid */}
      <div className="flex-1 overflow-hidden rounded-xl border border-border/80 bg-card/45 shadow-xs backdrop-blur-xs">
        {approvals === undefined ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading approvals...
            </p>
          </div>
        ) : view === "table" ? (
          isMobile ? (
            <div className="flex flex-col divide-y divide-border/40">
              {filteredApprovals && filteredApprovals.length > 0 ? (
                filteredApprovals.map((app: any) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApprovalId(app._id)}
                    className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-muted/5"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        <span className="mr-1 font-mono text-[10px] text-muted-foreground/60">
                          #{app._id.slice(-4)}
                        </span>
                        {app.title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`border px-2.5 py-0.5 text-[10px] font-bold ${getStatusColor(app.status)}`}
                      >
                        {app.status}
                      </Badge>

                      <div className="flex -space-x-1 overflow-hidden">
                        {app.approverIds.map((userId: string) => (
                          <UserAvatar
                            key={userId}
                            userId={userId}
                            avatarClassName="h-5.5 w-5.5 border border-background shadow-xs"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center p-4 text-xs text-muted-foreground">
                  No approval requests found.
                </div>
              )}
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[18%]">Title</TableHead>
                    <TableHead className="w-[10%] text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[10%]">Relation</TableHead>
                    <TableHead className="w-[12%]">Due Date</TableHead>
                    <TableHead className="w-[13%]">Approvers</TableHead>
                    <TableHead className="w-[6%] text-center">Files</TableHead>
                    <TableHead className="w-[8%] text-center">Chats</TableHead>
                    <TableHead className="w-[16%]">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals && filteredApprovals.length > 0 ? (
                    Object.entries(getGroupedApprovals()).map(
                      ([groupKey, groupApps]) => {
                        const isCollapsed = collapsedGroups.includes(groupKey)
                        return (
                          <React.Fragment key={groupKey}>
                            {groupKey && (
                              <TableRow
                                className="cursor-pointer border-y border-border/60 bg-muted/40 select-none hover:bg-muted/50"
                                onClick={() => toggleGroupCollapse(groupKey)}
                              >
                                <TableCell
                                  colSpan={7}
                                  className="px-3 py-2 text-xs font-semibold text-foreground/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronDown
                                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90 text-muted-foreground/60" : "text-foreground/70"}`}
                                    />
                                    <span>{groupKey}</span>
                                    <Badge
                                      variant="secondary"
                                      className="h-4.5 px-1.5 py-0 text-[10px] font-normal text-muted-foreground/80"
                                    >
                                      {groupApps.length}{" "}
                                      {groupApps.length === 1
                                        ? "request"
                                        : "requests"}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {!isCollapsed &&
                              groupApps.map((app: any) => (
                                <TableRow
                                  key={app._id}
                                  className={`cursor-pointer transition-colors hover:bg-muted/15 ${app.isArchived ? "bg-muted/5 opacity-60" : ""}`}
                                  onClick={() => setSelectedApprovalId(app._id)}
                                >
                                  <TableCell className="text-xs font-semibold text-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <span className="cursor-pointer font-mono text-[10px] font-medium text-muted-foreground/60 select-all">
                                        #{app._id.slice(-4)}
                                      </span>
                                      <span>{app.title}</span>
                                    </div>
                                  </TableCell>

                                  <TableCell
                                    className="text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      value={app.status}
                                      onValueChange={(val) =>
                                        handleStatusChange(app._id, val)
                                      }
                                    >
                                      <SelectTrigger
                                        className={`mx-auto h-6 w-[110px] cursor-pointer rounded-full border px-2 py-0 text-[10px] font-bold transition-all ${getStatusColor(app.status)}`}
                                      >
                                        <SelectValue placeholder={app.status} />
                                      </SelectTrigger>
                                      <SelectContent className="text-xs">
                                        <SelectItem value="Pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="Approved">
                                          Approved
                                        </SelectItem>
                                        <SelectItem value="Declined">
                                          Declined
                                        </SelectItem>
                                        <SelectItem value="Rework">
                                          Rework
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>

                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={`h-5 border px-2 py-0 text-[9px] font-medium ${getRelationStyle(getApprovalRelation(app))}`}
                                    >
                                      {getApprovalRelation(app)}
                                    </Badge>
                                  </TableCell>

                                  <TableCell>
                                    {(() => {
                                      if (app.dueDate) {
                                        const now = Date.now()
                                        const startOfToday =
                                          new Date().setHours(0, 0, 0, 0)
                                        const isOverdue =
                                          app.dueDate < startOfToday &&
                                          app.status !== "Approved" &&
                                          app.status !== "Declined"
                                        const dateStr = new Date(
                                          app.dueDate
                                        ).toLocaleDateString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                        if (isOverdue) {
                                          const diffTime = now - app.dueDate
                                          const delayDays = Math.ceil(
                                            diffTime / (1000 * 60 * 60 * 24)
                                          )
                                          return (
                                            <div className="flex flex-col gap-0.5 text-[10px] font-semibold text-red-500">
                                              <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                <span>{dateStr}</span>
                                              </div>
                                              <span className="text-[9px]">
                                                ({delayDays}d delayed)
                                              </span>
                                            </div>
                                          )
                                        }
                                        return (
                                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                            <span>{dateStr}</span>
                                          </div>
                                        )
                                      } else {
                                        const now = Date.now()
                                        const diffTime = now - app._creationTime
                                        const ageDays = Math.floor(
                                          diffTime / (1000 * 60 * 60 * 24)
                                        )
                                        return (
                                          <div className="text-[10px] text-muted-foreground/60 italic">
                                            {ageDays === 0
                                              ? "Created today"
                                              : `${ageDays}d old`}
                                          </div>
                                        )
                                      }
                                    })()}
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                                      {app.approverIds.map((userId: string) => (
                                        <UserAvatar
                                          key={userId}
                                          userId={userId}
                                          avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs"
                                        />
                                      ))}
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                      <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                      <span>{app.documentCount || 0}</span>
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-[10px]">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MessageSquare
                                          className={`h-3 w-3 ${app.unreadChatCount > 0 ? "fill-blue-500/10 text-blue-500" : "text-muted-foreground/60"}`}
                                        />
                                        <span
                                          className={
                                            app.unreadChatCount > 0
                                              ? "font-semibold text-foreground"
                                              : ""
                                          }
                                        >
                                          {app.chatCount || 0}
                                        </span>
                                      </div>
                                      {app.unreadChatCount > 0 && (
                                        <Badge className="h-4 shrink-0 scale-90 border-none bg-blue-500 px-1 text-[9px] font-semibold text-white hover:bg-blue-600">
                                          {app.unreadChatCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    {app.lastActivity ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-4.5 w-4.5 shrink-0">
                                          <AvatarImage
                                            src={getAvatarUrl(
                                              app.lastActivity.actor?.image,
                                              app.lastActivity.actor?.name
                                            )}
                                          />
                                          <AvatarFallback className="bg-accent text-[8px] font-semibold text-accent-foreground">
                                            {app.lastActivity.actor?.name?.charAt(
                                              0
                                            ) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-col select-none">
                                          <span
                                            className="max-w-[100px] truncate text-[10px] font-medium text-foreground"
                                            title={formatAction(
                                              app.lastActivity.action
                                            )}
                                          >
                                            {formatAction(
                                              app.lastActivity.action
                                            )}
                                          </span>
                                          <span className="truncate text-[9px] text-muted-foreground">
                                            {formatTimeAgo(
                                              app.lastActivity.timestamp
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic">
                                        No logs
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        )
                      }
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No approval requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )
        ) : view === "list" ? (
          <div className="max-h-[calc(100vh-220px)] w-full overflow-auto p-4">
            {filteredApprovals && filteredApprovals.length > 0 ? (
              Object.entries(getGroupedApprovals()).map(
                ([groupKey, groupApps]) => {
                  const isCollapsed = collapsedGroups.includes(groupKey)
                  return (
                    <React.Fragment key={groupKey}>
                      {groupKey && (
                        <div
                          className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground/80 select-none hover:bg-muted/50"
                          onClick={() => toggleGroupCollapse(groupKey)}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90 text-muted-foreground/60" : "text-foreground/70"}`}
                          />
                          <span>{groupKey}</span>
                          <Badge
                            variant="secondary"
                            className="h-4.5 px-1.5 py-0 text-[10px] font-normal text-muted-foreground/80"
                          >
                            {groupApps.length}{" "}
                            {groupApps.length === 1 ? "request" : "requests"}
                          </Badge>
                        </div>
                      )}

                      {!isCollapsed && (
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {groupApps.map((app: any) => (
                            <div
                              key={app._id}
                              className={`group flex min-h-[160px] cursor-pointer flex-col justify-between rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:bg-card/85 hover:shadow-md dark:hover:bg-card/75 ${app.isArchived ? "bg-muted/5 opacity-60" : ""}`}
                              onClick={() => setSelectedApprovalId(app._id)}
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="font-mono text-[9px] font-medium text-muted-foreground/60 select-all">
                                  #{app._id.slice(-4)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`border px-2 py-0.5 text-[9px] font-bold ${getStatusColor(app.status)}`}
                                >
                                  {app.status}
                                </Badge>
                              </div>

                              <div className="mb-3 flex flex-1 flex-col gap-1.5">
                                <span className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                                  {app.title}
                                </span>
                                {app.description && (
                                  <span className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                    {app.description}
                                  </span>
                                )}
                              </div>

                              {/* Card Due Date / Age */}
                              <div className="mb-2.5 flex items-center gap-1.5 rounded-md border border-border/20 bg-muted/30 p-1 px-1.5 text-[9px] text-muted-foreground dark:bg-muted/10">
                                {(() => {
                                  if (app.dueDate) {
                                    const now = Date.now()
                                    const startOfToday = new Date().setHours(
                                      0,
                                      0,
                                      0,
                                      0
                                    )
                                    const isOverdue =
                                      app.dueDate < startOfToday &&
                                      app.status !== "Approved" &&
                                      app.status !== "Declined"
                                    const dateStr = new Date(
                                      app.dueDate
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                    if (isOverdue) {
                                      const diffTime = now - app.dueDate
                                      const delayDays = Math.ceil(
                                        diffTime / (1000 * 60 * 60 * 24)
                                      )
                                      return (
                                        <div className="flex items-center gap-1 font-semibold text-red-500">
                                          <Calendar className="h-3 w-3 shrink-0" />
                                          <span>
                                            Due: {dateStr} ({delayDays}d
                                            overdue)
                                          </span>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        <span>Due: {dateStr}</span>
                                      </div>
                                    )
                                  } else {
                                    const now = Date.now()
                                    const diffTime = now - app._creationTime
                                    const ageDays = Math.floor(
                                      diffTime / (1000 * 60 * 60 * 24)
                                    )
                                    return (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        <span>
                                          Age:{" "}
                                          {ageDays === 0
                                            ? "Created today"
                                            : `${ageDays} days old`}
                                        </span>
                                      </div>
                                    )
                                  }
                                })()}
                              </div>

                              <div className="flex items-center justify-between border-t border-dashed border-border/40 pt-2 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1 rounded border border-border/40 bg-muted/10 px-2 py-0.5">
                                  <span className="text-[9px]">
                                    Relation: {getApprovalRelation(app)}
                                  </span>
                                </div>
                                <div className="flex items-center -space-x-1.5 overflow-hidden">
                                  {app.approverIds.map((userId: string) => (
                                    <UserAvatar
                                      key={userId}
                                      userId={userId}
                                      avatarClassName="h-5.5 w-5.5 border border-card shadow-xs"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  )
                }
              )
            ) : (
              <div className="flex h-32 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                No approval requests found.
              </div>
            )}
          </div>
        ) : (
          /* Kanban View */
          <div className="flex h-[calc(100vh-220px)] w-full items-stretch gap-4 overflow-x-auto p-4 select-none">
            {visibleStatuses.map((status) => {
              const isCollapsed = collapsedColumns.includes(status)
              const statusApps =
                filteredApprovals?.filter((a: any) => a.status === status) || []

              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault()
              }

              const handleDrop = async (e: React.DragEvent) => {
                e.preventDefault()
                const approvalId = e.dataTransfer.getData("approvalId")
                if (!approvalId) return
                const app = filteredApprovals?.find(
                  (a: any) => a._id === approvalId
                )
                if (app && app.status !== status) {
                  await handleStatusChange(approvalId, status)
                }
              }

              if (isCollapsed) {
                return (
                  <div
                    key={status}
                    onClick={() =>
                      setCollapsedColumns((prev) =>
                        prev.filter((s) => s !== status)
                      )
                    }
                    className="group flex h-full w-12 shrink-0 cursor-pointer flex-col items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-3 transition-all hover:bg-muted/15"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground/60 transition-colors group-hover:text-foreground hover:bg-muted/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCollapsedColumns((prev) =>
                            prev.filter((s) => s !== status)
                          )
                        }}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                      </button>
                      <div className="h-px w-full bg-border/40" />
                      <span
                        className="text-xs font-bold tracking-wider whitespace-nowrap text-muted-foreground/80"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                        }}
                      >
                        {status}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="h-4.5 px-1.5 py-0 text-[9px] font-normal text-muted-foreground/60"
                    >
                      {statusApps.length}
                    </Badge>
                  </div>
                )
              }

              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex h-full max-w-[340px] min-w-[280px] flex-1 shrink-0 flex-col rounded-xl border border-border/40 bg-muted/20 p-3 transition-colors duration-200"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-border/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          status === "Pending"
                            ? "bg-sky-400"
                            : status === "Approved"
                              ? "bg-emerald-400"
                              : status === "Declined"
                                ? "bg-rose-400"
                                : "bg-amber-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-foreground/90">
                        {status}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4.5 px-1.5 py-0 text-[10px] font-medium text-muted-foreground/80"
                      >
                        {statusApps.length}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedColumns((prev) => [...prev, status])
                      }
                      className="cursor-pointer rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted/30 hover:text-foreground"
                      title="Collapse Column"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 scrollbar-thin space-y-2.5 overflow-y-auto py-1 pr-1">
                    {statusApps.length > 0 ? (
                      statusApps.map((app: any) => (
                        <div
                          key={app._id}
                          draggable={!app.isArchived}
                          onDragStart={(e) => {
                            if (app.isArchived) return
                            e.dataTransfer.setData("approvalId", app._id)
                            e.dataTransfer.effectAllowed = "move"
                          }}
                          className={`group rounded-xl border border-border/50 bg-card/65 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/20 hover:bg-card hover:shadow-md dark:hover:bg-card/85 ${app.isArchived ? "cursor-not-allowed bg-muted/5 opacity-60" : "cursor-grab active:cursor-grabbing"}`}
                          onClick={() => setSelectedApprovalId(app._id)}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-mono text-[9px] font-medium text-muted-foreground/60 select-all">
                              #{app._id.slice(-4)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`h-4.5 border px-1.5 py-0 text-[8px] font-medium ${getRelationStyle(getApprovalRelation(app))}`}
                            >
                              {getApprovalRelation(app)}
                            </Badge>
                          </div>

                          <div className="mb-2 flex flex-col gap-0.5">
                            <span className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                              {app.title}
                            </span>
                            {app.description && (
                              <span className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                {app.description}
                              </span>
                            )}
                          </div>

                          {/* Card Due Date / Age */}
                          <div className="mb-2 flex items-center gap-1.5 rounded-md border border-border/20 bg-muted/30 p-1 px-1.5 text-[9px] text-muted-foreground dark:bg-muted/10">
                            {(() => {
                              if (app.dueDate) {
                                const now = Date.now()
                                const startOfToday = new Date().setHours(
                                  0,
                                  0,
                                  0,
                                  0
                                )
                                const isOverdue =
                                  app.dueDate < startOfToday &&
                                  app.status !== "Approved" &&
                                  app.status !== "Declined"
                                const dateStr = new Date(
                                  app.dueDate
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                                if (isOverdue) {
                                  const diffTime = now - app.dueDate
                                  const delayDays = Math.ceil(
                                    diffTime / (1000 * 60 * 60 * 24)
                                  )
                                  return (
                                    <div className="flex items-center gap-1 font-semibold text-red-500">
                                      <Calendar className="h-3 w-3 shrink-0" />
                                      <span>
                                        Due: {dateStr} ({delayDays}d overdue)
                                      </span>
                                    </div>
                                  )
                                }
                                return (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>Due: {dateStr}</span>
                                  </div>
                                )
                              } else {
                                const now = Date.now()
                                const diffTime = now - app._creationTime
                                const ageDays = Math.floor(
                                  diffTime / (1000 * 60 * 60 * 24)
                                )
                                return (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>
                                      Age:{" "}
                                      {ageDays === 0
                                        ? "Created today"
                                        : `${ageDays} days old`}
                                    </span>
                                  </div>
                                )
                              }
                            })()}
                          </div>

                          <div className="flex items-center justify-between border-t border-dashed border-border/40 pt-2 text-[9px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <UserAvatar
                                userId={app.creatorId}
                                avatarClassName="h-4.5 w-4.5"
                              />
                            </div>
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {app.approverIds.map((userId: string) => (
                                <UserAvatar
                                  key={userId}
                                  userId={userId}
                                  avatarClassName="h-5.5 w-5.5 border border-card shadow-xs"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border/40 text-center text-[10px] text-muted-foreground italic">
                        No approvals in this stage
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Approval Dialog */}
      <CreateApprovalDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
      />

      {/* Approval Details Slide-out Sheet */}
      <ApprovalDetailsSheet
        approvalId={selectedApprovalId}
        isOpen={selectedApprovalId !== null}
        onClose={() => setSelectedApprovalId(null)}
      />
    </div>
  )
}
