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
  Star,
  ChevronDown,
  Loader2,
  Columns,
  ChevronLeft,
  Archive,
  Repeat,
  SlidersHorizontal,
  Filter,
  X,
  FileText,
  CheckCircle2,
} from "lucide-react"
import TasksSidebar from "./components/tasks-internal-sidebar"
import { CreateTaskDialog } from "./components/create-task-dialog"
import TaskDetailsSheet from "./components/task-details-sheet"
import { DueDateBadge } from "./components/due-date-badge"
import { toast } from "sonner"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { getAvatarUrl, cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"
import { AvatarHoverCard } from "@/components/avatar-hover-card"
import { TaskParticipantsHoverCard } from "@/components/task-participants-hover-card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@workspace/ui/components/dropdown-menu"

interface TaskFilters {
  priorities: string[]
  statuses: string[]
  relations: string[]
  dueDates: ("overdue" | "today" | "week" | "none")[]
  recurrence: "all" | "recurring" | "non-recurring"
  starred: "all" | "starred" | "unstarred"
  peopleIds: string[]
}

const defaultFilters: TaskFilters = {
  priorities: [],
  statuses: [],
  relations: [],
  dueDates: [],
  recurrence: "all",
  starred: "all",
  peopleIds: [],
}

export default function TasksPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<"kanban" | "list" | "table">("table")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)
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

  // Fetch tasks for the current organization
  const tasks = useQuery(
    api.tasks.getTasks,
    activeOrg ? { organizationId: activeOrg.id, showArchived } : "skip"
  )

  // Fetch organization member profiles
  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // Status update mutation with optimistic UI updates
  const updateTaskStatus = useMutation(
    api.tasks.updateTaskStatus
  ).withOptimisticUpdate((localStore, args) => {
    const { taskId: targetId, status } = args
    if (activeOrg?.id) {
      const queryArgs = { organizationId: activeOrg.id, showArchived }
      const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
      if (tasksList) {
        const updatedTasks = tasksList.map((t: any) => {
          if (t._id === targetId) {
            return { ...t, status }
          }
          return t
        })
        localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
      }
    }
  })

  // Star toggle mutation with optimistic UI updates
  const toggleStarTask = useMutation(
    api.tasks.toggleStarTask
  ).withOptimisticUpdate((localStore, args) => {
    const { taskId: targetId } = args
    if (activeOrg?.id) {
      const queryArgs = { organizationId: activeOrg.id, showArchived }
      const tasksList = localStore.getQuery(api.tasks.getTasks, queryArgs)
      if (tasksList) {
        const updatedTasks = tasksList.map((t: any) => {
          if (t._id === targetId) {
            return { ...t, isStarred: !t.isStarred }
          }
          return t
        })
        localStore.setQuery(api.tasks.getTasks, queryArgs, updatedTasks)
      }
    }
  })

  // Group By states
  const [groupBy, setGroupBy] = useState<
    "none" | "priority" | "status" | "dueDate" | "starred" | "relation"
  >("none")
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  // Kanban states
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>([
    "Pending",
    "In Progress",
    "Under Review",
    "Pending Approval",
    "Completed",
    "Cancelled",
  ])
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([
    "Completed",
  ])

  const handleToggleStar = async (taskId: any) => {
    try {
      await toggleStarTask({ taskId })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to toggle starred status")
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((k) => k !== groupKey)
        : [...prev, groupKey]
    )
  }

  const getGroupedTasks = () => {
    if (!filteredTasks) return {}
    if (groupBy === "none") return { "": filteredTasks }

    const groups: Record<string, any[]> = {}

    if (groupBy === "priority") {
      filteredTasks.forEach((task: any) => {
        const key = `Priority: ${task.priority || "Normal"}`
        if (!groups[key]) groups[key] = []
        groups[key].push(task)
      })
    } else if (groupBy === "status") {
      filteredTasks.forEach((task: any) => {
        const key = `Status: ${task.status || "Pending"}`
        if (!groups[key]) groups[key] = []
        groups[key].push(task)
      })
    } else if (groupBy === "starred") {
      groups["Starred Tasks"] = []
      groups["Other Tasks"] = []
      filteredTasks.forEach((task: any) => {
        if (task.isStarred) {
          groups["Starred Tasks"]!.push(task)
        } else {
          groups["Other Tasks"]!.push(task)
        }
      })
      if (groups["Starred Tasks"]!.length === 0) delete groups["Starred Tasks"]
      if (groups["Other Tasks"]!.length === 0) delete groups["Other Tasks"]
    } else if (groupBy === "dueDate") {
      const now = new Date()
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime()
      const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
      const weekStart = todayStart + 7 * 24 * 60 * 60 * 1000

      groups["Overdue"] = []
      groups["Today"] = []
      groups["Tomorrow"] = []
      groups["This Week"] = []
      groups["Later"] = []
      groups["No Due Date"] = []

      filteredTasks.forEach((task: any) => {
        if (!task.dueDate) {
          groups["No Due Date"]!.push(task)
        } else if (task.dueDate < todayStart) {
          groups["Overdue"]!.push(task)
        } else if (task.dueDate >= todayStart && task.dueDate < tomorrowStart) {
          groups["Today"]!.push(task)
        } else if (task.dueDate >= tomorrowStart && task.dueDate < weekStart) {
          groups["Tomorrow"]!.push(task)
        } else if (
          task.dueDate >= weekStart &&
          task.dueDate < weekStart + 6 * 24 * 60 * 60 * 1000
        ) {
          groups["This Week"]!.push(task)
        } else {
          groups["Later"]!.push(task)
        }
      })

      Object.keys(groups).forEach((key) => {
        if (groups[key]!.length === 0) delete groups[key]
      })
    } else if (groupBy === "relation") {
      groups["Creator"] = []
      groups["Assignee"] = []
      groups["Collaborator"] = []
      groups["Subscriber"] = []
      groups["Other"] = []

      filteredTasks.forEach((task: any) => {
        const relation = getTaskRelation(task)
        groups[relation]!.push(task)
      })

      Object.keys(groups).forEach((key) => {
        if (groups[key]!.length === 0) delete groups[key]
      })
    }

    return groups
  }

  const handleStatusChange = async (taskId: any, newStatus: string) => {
    try {
      const result = await updateTaskStatus({
        taskId,
        status: newStatus,
      })
      toast.success(`Task status updated to ${result.newStatus}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to update task status")
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

  const getDayTaskCount = (dayTimestamp: number) => {
    if (!tasks) return 0
    const dayStart = new Date(dayTimestamp).setHours(0, 0, 0, 0)
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1
    return tasks.filter(
      (t: any) =>
        !t.isArchived &&
        t.status !== "Completed" &&
        t.status !== "Cancelled" &&
        t.dueDate &&
        t.dueDate >= dayStart &&
        t.dueDate <= dayEnd
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

  const getAssigneeDetails = (userId: string) => {
    const member = activeOrg?.members?.find((m: any) => m.userId === userId)
    return member?.user
  }

  const getAssigneeDesignation = (userId: string) => {
    const member = activeOrg?.members?.find((m: any) => m.userId === userId)
    if (!member) return undefined
    const profile = profiles?.find((p: any) => p.memberId === member.id)
    if (!profile) return undefined
    const position = profile.position
    const department = profile.department
    if (position && department) {
      return `${position}, ${department}`
    }
    return position || department
  }

  const getTaskRelation = (task: any) => {
    const currentUserId = session?.user?.id
    if (!currentUserId) return "Other"
    if (task.creatorId === currentUserId) return "Creator"
    if (task.assigneeIds?.includes(currentUserId)) return "Assignee"
    if (task.collaboratorIds?.includes(currentUserId)) return "Collaborator"
    if (task.subscriberIds?.includes(currentUserId)) return "Subscriber"
    return "Other"
  }

  const getRelationStyle = (relation: string) => {
    switch (relation) {
      case "Creator":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/30"
      case "Assignee":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/30 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/30"
      case "Collaborator":
        return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30"
      case "Subscriber":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400"
    }
  }

  const activeFiltersCount =
    filters.priorities.length +
    filters.statuses.length +
    filters.relations.length +
    filters.dueDates.length +
    filters.peopleIds.length +
    (filters.recurrence !== "all" ? 1 : 0) +
    (filters.starred !== "all" ? 1 : 0)

  // Filter tasks by search query & other active filters
  const filteredTasks = tasks?.filter((task: any) => {
    // 1. Search Query Filter
    const titleMatch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const descMatch =
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    if (!titleMatch && !descMatch) return false

    // 2. Priority Filter
    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(task.priority)
    ) {
      return false
    }

    // 3. Status Filter
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(task.status)
    ) {
      return false
    }

    // 4. Relation Filter
    if (filters.relations.length > 0) {
      const taskRelation = getTaskRelation(task)
      if (!filters.relations.includes(taskRelation)) {
        return false
      }
    }

    // 5. Recurrence Filter
    if (filters.recurrence === "recurring" && !task.recurrence) return false
    if (filters.recurrence === "non-recurring" && task.recurrence) return false

    // 6. Starred Filter
    if (filters.starred === "starred" && !task.isStarred) return false
    if (filters.starred === "unstarred" && task.isStarred) return false

    // 7. People Filter (Matches if selected people are assignees, collaborators, or subscribers)
    if (filters.peopleIds.length > 0) {
      const matchesPeople = filters.peopleIds.some(
        (id) =>
          task.assigneeIds?.includes(id) ||
          task.collaboratorIds?.includes(id) ||
          task.subscriberIds?.includes(id)
      )
      if (!matchesPeople) return false
    }

    // 8. Due Date Preset Filter
    if (filters.dueDates.length > 0 || !showAllDates || timePreset !== "all") {
      const now = new Date()
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime()
      const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1
      const dayOfWeek = now.getDay()
      const startOfWeek = startOfToday - dayOfWeek * 24 * 60 * 60 * 1000
      const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1

      if (!showAllDates && selectedTimelineDate !== null) {
        const selStart = new Date(selectedTimelineDate).setHours(0, 0, 0, 0)
        const selEnd = selStart + 24 * 60 * 60 * 1000 - 1
        if (!task.dueDate || task.dueDate < selStart || task.dueDate > selEnd) {
          return false
        }
      } else if (timePreset !== "all") {
        if (timePreset === "overdue") {
          const isOverdue =
            task.dueDate &&
            task.dueDate < startOfToday &&
            task.status !== "Completed" &&
            task.status !== "Cancelled"
          if (!isOverdue) return false
        } else if (timePreset === "today") {
          const isToday =
            task.dueDate &&
            task.dueDate >= startOfToday &&
            task.dueDate <= endOfToday
          if (!isToday) return false
        } else if (timePreset === "week") {
          const isThisWeek =
            task.dueDate &&
            task.dueDate >= startOfWeek &&
            task.dueDate <= endOfWeek
          if (!isThisWeek) return false
        } else if (timePreset === "later") {
          const isLater = task.dueDate && task.dueDate > endOfWeek
          if (!isLater) return false
        }
      } else if (filters.dueDates.length > 0) {
        const matchesAnyDate = filters.dueDates.some((dateType) => {
          if (dateType === "none") return !task.dueDate
          if (dateType === "overdue") {
            return (
              task.dueDate &&
              task.dueDate < startOfToday &&
              task.status !== "Completed" &&
              task.status !== "Cancelled"
            )
          }
          if (dateType === "today") {
            return (
              task.dueDate &&
              task.dueDate >= startOfToday &&
              task.dueDate <= endOfToday
            )
          }
          if (dateType === "week") {
            return (
              task.dueDate &&
              task.dueDate >= startOfWeek &&
              task.dueDate <= endOfWeek
            )
          }
          return false
        })
        if (!matchesAnyDate) return false
      }
    }

    return true
  })

  // Priority styling helper
  const getPriorityStyle = (priority: string) => {
    const num = parseInt(priority, 10)
    if (isNaN(num)) {
      switch (priority) {
        case "Low":
          return "bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50"
        case "Normal":
          return "bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/30"
        case "High":
          return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30"
        case "Urgent":
          return "bg-orange-50 text-orange-700 border-orange-200/30 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/30"
        case "Critical":
          return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/30 font-semibold"
        default:
          return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }
    }
    if (num <= 3) {
      return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/30"
    }
    if (num <= 7) {
      return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30"
    }
    return "bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/30 font-semibold"
  }

  // Status badge styling helper (for trigger)
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200/30 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/30"
      case "In Progress":
        return "bg-sky-50 text-sky-700 border-sky-200/30 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/30"
      case "Under Review":
        return "bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/30"
      case "Pending Approval":
        return "bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/30"
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/30"
      case "Cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 line-through"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }
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
      {/* Header Section */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            Tasks Dashboard
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage and collaborate on tasks inside {activeOrg.name}.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <TasksSidebar />

          {/* Create Task Button */}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex h-8 items-center gap-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 md:max-w-md">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-muted-foreground/75" />
            <Input
              type="search"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 border-input/60 bg-background/50 pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher */}
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

            {/* Filters Button */}
            <Button
              variant={activeFiltersCount > 0 ? "default" : "outline"}
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

            {/* Group By selector (only shown in table and list views) */}
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
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="starred">Starred</SelectItem>
                    <SelectItem value="relation">User Relation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Column Visibility selector (only shown in kanban view) */}
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
                    {[
                      "Pending",
                      "In Progress",
                      "Under Review",
                      "Pending Approval",
                      "Completed",
                      "Cancelled",
                    ].map((status) => {
                      const isVisible = visibleStatuses.includes(status)
                      return (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={isVisible}
                          onCheckedChange={(checked) => {
                            setVisibleStatuses((prev) =>
                              checked
                                ? [...prev, status]
                                : prev.filter((s) => s !== status)
                            )
                          }}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Archived Toggle */}
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
                label: "All Tasks",
                count: tasks?.filter((t) => !t.isArchived).length || 0,
              },
              {
                key: "overdue",
                label: "Overdue",
                count:
                  tasks?.filter(
                    (t) =>
                      !t.isArchived &&
                      t.status !== "Completed" &&
                      t.status !== "Cancelled" &&
                      t.dueDate &&
                      t.dueDate < new Date().setHours(0, 0, 0, 0)
                  ).length || 0,
                className:
                  "text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200 dark:border-red-900/30",
              },
              {
                key: "today",
                label: "Today",
                count:
                  tasks?.filter(
                    (t) =>
                      !t.isArchived &&
                      t.dueDate &&
                      t.dueDate >= new Date().setHours(0, 0, 0, 0) &&
                      t.dueDate <
                        new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
                  ).length || 0,
                className:
                  "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-200 dark:border-amber-900/30",
              },
              {
                key: "week",
                label: "This Week",
                count:
                  tasks?.filter((t) => {
                    const startOfWeek =
                      new Date().setHours(0, 0, 0, 0) -
                      new Date().getDay() * 24 * 60 * 60 * 1000
                    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000
                    return (
                      !t.isArchived &&
                      t.dueDate &&
                      t.dueDate >= startOfWeek &&
                      t.dueDate < endOfWeek
                    )
                  }).length || 0,
                className:
                  "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30",
              },
              {
                key: "later",
                label: "Later",
                count:
                  tasks?.filter((t) => {
                    const startOfWeek =
                      new Date().setHours(0, 0, 0, 0) -
                      new Date().getDay() * 24 * 60 * 60 * 1000
                    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000
                    return !t.isArchived && t.dueDate && t.dueDate >= endOfWeek
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
                  const dayTaskCount = getDayTaskCount(dayTimestamp)
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
                      {dayTaskCount > 0 && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-0.5 text-[8px] font-bold",
                            isSelected && !showAllDates
                              ? "border-primary bg-amber-500 text-white"
                              : "border-card bg-primary text-primary-foreground"
                          )}
                        >
                          {dayTaskCount}
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
              className={cn(
                "flex h-6 items-center gap-1 rounded-full px-2 text-[10px]",
                getStatusStyle(status)
              )}
            >
              <span>Status: {status}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    statuses: prev.statuses.filter((s) => s !== status),
                  }))
                }
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}

          {/* Priorities */}
          {filters.priorities.map((priority) => (
            <Badge
              key={priority}
              variant="outline"
              className={cn(
                "flex h-6 items-center gap-1 rounded-full px-2 text-[10px]",
                getPriorityStyle(priority)
              )}
            >
              <span>Priority: {priority}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    priorities: prev.priorities.filter((p) => p !== priority),
                  }))
                }
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}

          {/* Relations */}
          {filters.relations.map((relation) => (
            <Badge
              key={relation}
              variant="outline"
              className={cn(
                "flex h-6 items-center gap-1 rounded-full px-2 text-[10px]",
                getRelationStyle(relation)
              )}
            >
              <span>Role: {relation}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    relations: prev.relations.filter((r) => r !== relation),
                  }))
                }
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}

          {/* Due Dates */}
          {filters.dueDates.map((dateKey) => {
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
                className="flex h-6 items-center gap-1 rounded-full border-red-500/20 bg-red-500/10 px-2 text-[10px] text-red-500 dark:border-red-500/10 dark:bg-red-500/20 dark:text-red-300"
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

          {/* Recurrence */}
          {filters.recurrence !== "all" && (
            <Badge
              variant="outline"
              className="flex h-6 items-center gap-1 rounded-full border-blue-500/20 bg-blue-500/10 px-2 text-[10px] text-blue-500 dark:border-blue-500/10 dark:bg-blue-500/20 dark:text-blue-300"
            >
              <span>
                Recurrence:{" "}
                {filters.recurrence === "recurring" ? "Recurring" : "One-off"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    recurrence: "all",
                  }))
                }
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}

          {/* Starred */}
          {filters.starred !== "all" && (
            <Badge
              variant="outline"
              className="flex h-6 items-center gap-1 rounded-full border-amber-500/20 bg-amber-500/10 px-2 text-[10px] text-amber-500 dark:border-amber-500/10 dark:bg-amber-500/20 dark:text-amber-300"
            >
              <span>
                Starred:{" "}
                {filters.starred === "starred"
                  ? "Starred Only"
                  : "Unstarred Only"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    starred: "all",
                  }))
                }
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}

          {/* People */}
          {filters.peopleIds.map((memberId) => {
            const member = activeOrg?.members?.find(
              (m: any) => m.id === memberId
            )
            const name = member?.user?.name || "Unknown Member"
            return (
              <Badge
                key={memberId}
                variant="outline"
                className="flex h-6 items-center gap-1 rounded-full border-purple-500/20 bg-purple-500/10 px-2 text-[10px] text-purple-600 dark:text-purple-400"
              >
                <span>Person: {name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      peopleIds: prev.peopleIds.filter((p) => p !== memberId),
                    }))
                  }
                  className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            )
          })}

          {/* Clear All Button */}
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

      {/* Filters Sheet - Slide out from the left */}
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
                  Narrow down tasks by specific criteria.
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

          {/* Scrollable Filters Container */}
          <div className="flex-1 scrollbar-thin space-y-6 overflow-y-auto p-6">
            {/* 1. Status Filter */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Status
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Pending",
                  "In Progress",
                  "Under Review",
                  "Pending Approval",
                  "Completed",
                  "Cancelled",
                ].map((status) => {
                  const selected = filters.statuses.includes(status)
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          statuses: selected
                            ? prev.statuses.filter((s) => s !== status)
                            : [...prev.statuses, status],
                        }))
                      }}
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all hover:scale-[1.02]",
                        selected
                          ? getStatusStyle(status) +
                              " scale-[1.02] border-primary/20"
                          : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Priority Filter */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Priority
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {["Low", "Normal", "High", "Urgent", "Critical"].map(
                  (priority) => {
                    const selected = filters.priorities.includes(priority)
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            priorities: selected
                              ? prev.priorities.filter((p) => p !== priority)
                              : [...prev.priorities, priority],
                          }))
                        }}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all hover:scale-[1.02]",
                          selected
                            ? getPriorityStyle(priority) +
                                " scale-[1.02] border-primary/20"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {priority}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* 3. Due Date Filter */}
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
                  const selected = filters.dueDates.includes(item.key)
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
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all hover:scale-[1.02]",
                        selected
                          ? "scale-[1.02] border-red-500/30 bg-red-500/10 text-red-500 dark:border-red-500/20 dark:bg-red-500/20 dark:text-red-300"
                          : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Recurrence & Starred Filters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Recurrence */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Recurrence
                </h4>
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: "all", label: "All Tasks" },
                    { key: "recurring", label: "Recurring Only" },
                    { key: "non-recurring", label: "One-off Only" },
                  ].map((opt) => {
                    const active = filters.recurrence === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            recurrence: opt.key as any,
                          }))
                        }
                        className={cn(
                          "w-full cursor-pointer rounded-lg border p-1.5 px-2 text-left text-[10px] font-medium transition-all",
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Starred */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
                <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Starred
                </h4>
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: "all", label: "All Tasks" },
                    { key: "starred", label: "Starred Only" },
                    { key: "unstarred", label: "Unstarred Only" },
                  ].map((opt) => {
                    const active = filters.starred === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            starred: opt.key as any,
                          }))
                        }
                        className={cn(
                          "w-full cursor-pointer rounded-lg border p-1.5 px-2 text-left text-[10px] font-medium transition-all",
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 5. User Relation Filter */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Your Relation (Role)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {["Creator", "Assignee", "Collaborator", "Subscriber"].map(
                  (relation) => {
                    const selected = filters.relations.includes(relation)
                    return (
                      <button
                        key={relation}
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            relations: selected
                              ? prev.relations.filter((r) => r !== relation)
                              : [...prev.relations, relation],
                          }))
                        }}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all hover:scale-[1.02]",
                          selected
                            ? getRelationStyle(relation) +
                                " scale-[1.02] border-primary/20"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {relation}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* 6. People Filter (Matches Assignees, Collaborators, or Subscribers) */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
              <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                People
              </h4>
              <div className="max-h-48 scrollbar-thin space-y-1.5 overflow-y-auto pr-1">
                {activeOrg?.members?.map((member: any) => {
                  const selected = filters.peopleIds.includes(member.id)
                  const name = member.user?.name || "Unknown Member"
                  const email = member.user?.email || ""
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          peopleIds: selected
                            ? prev.peopleIds.filter((id) => id !== member.id)
                            : [...prev.peopleIds, member.id],
                        }))
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border p-1.5 text-left transition-all hover:bg-muted/40",
                        selected
                          ? "border-primary/20 bg-primary/5 text-foreground"
                          : "border-transparent bg-transparent text-muted-foreground"
                      )}
                    >
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage
                          src={getAvatarUrl(member.user?.image, name)}
                        />
                        <AvatarFallback className="text-[8px] font-bold">
                          {name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] leading-none font-semibold text-foreground">
                          {name}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] leading-none text-muted-foreground">
                          {email}
                        </p>
                      </div>
                      {selected && (
                        <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                          ✓
                        </div>
                      )}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden rounded-xl border border-border/80 bg-card/45 shadow-xs backdrop-blur-xs">
        {tasks === undefined ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading organization tasks...
            </p>
          </div>
        ) : view === "table" ? (
          isMobile ? (
            <div className="flex flex-col divide-y divide-border/40">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-muted/5"
                  >
                    {/* Title and Description */}
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 text-sm font-semibold text-foreground">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(
                              `#${task._id.slice(-4)}`
                            )
                            toast.success(
                              `Copied Task ID #${task._id.slice(-4)} to clipboard!`
                            )
                          }}
                          className="mr-1 cursor-pointer font-mono text-[10px] font-medium text-muted-foreground/60 transition-colors select-all hover:text-foreground"
                        >
                          #{task._id.slice(-4)}
                        </span>{" "}
                        {task.title}
                      </span>
                      {(task.description || task.recurrence) && (
                        <span className="line-clamp-3 text-xs text-muted-foreground">
                          {task.recurrence && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="mr-1.5 inline-block align-middle">
                                  <Repeat className="size-3 cursor-help text-blue-500" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="rounded border bg-popover p-1.5 px-2 text-[10px] text-popover-foreground shadow-md">
                                <span>Repeats {task.recurrence.frequency}</span>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {task.description}
                        </span>
                      )}
                    </div>

                    {/* Badges: Priority & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`border px-2 py-0.5 text-[10px] font-medium ${getPriorityStyle(task.priority)}`}
                        >
                          Priority: {task.priority}
                        </Badge>
                        {getTaskRelation(task) !== "Other" && (
                          <Badge
                            variant="outline"
                            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-medium select-none ${getRelationStyle(getTaskRelation(task))}`}
                          >
                            {getTaskRelation(task)}
                          </Badge>
                        )}
                        {task.formId && !task.formResponseId && (
                          <Badge
                            variant="outline"
                            className="flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 transition-all hover:bg-amber-500/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTaskId(task._id)
                            }}
                          >
                            <FileText className="h-2.5 w-2.5 shrink-0" />
                            <span>Fill Form</span>
                          </Badge>
                        )}
                        {task.formId && task.formResponseId && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 select-none"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                            <span>Submitted</span>
                          </Badge>
                        )}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={task.status}
                          onValueChange={(val) =>
                            handleStatusChange(task._id, val)
                          }
                        >
                          <SelectTrigger
                            className={`h-7 w-[120px] cursor-pointer rounded-full border px-2 py-0 text-[10px] font-medium transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}
                          >
                            <SelectValue placeholder={task.status} />
                          </SelectTrigger>
                          <SelectContent position="popper" className="text-xs">
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="Under Review">
                              Under Review
                            </SelectItem>
                            <SelectItem
                              value="Pending Approval"
                              disabled={!!task.formId && !task.formResponseId}
                            >
                              Pending Approval
                            </SelectItem>
                            <SelectItem
                              value="Completed"
                              disabled={!!task.formId && !task.formResponseId}
                            >
                              Completed
                            </SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Metrics: Files, Comments, and Last Activity */}
                    <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1">
                      <div className="flex items-center gap-3">
                        {/* Files Count */}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{task.documentCount || 0} files</span>
                        </div>

                        {/* Comments Count */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare
                              className={`h-3.5 w-3.5 ${task.unreadCommentCount > 0 ? "fill-blue-500/10 text-blue-500" : "text-muted-foreground/60"}`}
                            />
                            <span
                              className={
                                task.unreadCommentCount > 0
                                  ? "font-semibold text-foreground"
                                  : ""
                              }
                            >
                              {task.commentCount || 0}
                            </span>
                          </div>
                          {task.unreadCommentCount > 0 && (
                            <Badge
                              variant="default"
                              className="h-4 shrink-0 scale-90 border-none bg-blue-500 px-1 text-[9px] font-semibold text-white hover:bg-blue-600"
                            >
                              {task.unreadCommentCount} new
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <AvatarHoverCard
                          user={task.lastActivity?.actor}
                          userId={task.lastActivity?.actorId}
                        >
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage
                              src={getAvatarUrl(
                                task.lastActivity?.actor?.image,
                                task.lastActivity?.actor?.name
                              )}
                            />
                            <AvatarFallback className="bg-accent text-[7px] font-semibold text-accent-foreground">
                              {task.lastActivity?.actor?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </AvatarHoverCard>
                        <span className="max-w-[150px] truncate text-[9px] text-muted-foreground">
                          {formatAction(task.lastActivity?.action)} •{" "}
                          {formatTimeAgo(task.lastActivity?.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Date and Assignees */}
                    <div className="flex items-center justify-between border-t border-dashed border-border/40 pt-2.5 text-[10px] text-muted-foreground">
                      <DueDateBadge
                        dueDate={task.dueDate}
                        timeOfDay={task.timeOfDay}
                        status={task.status}
                      />

                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assigneeIds && task.assigneeIds.length > 0 ? (
                          task.assigneeIds.map((userId: string) => (
                            <UserAvatar
                              key={userId}
                              userId={userId}
                              avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs hover:translate-y-[-2px] transition-transform"
                            />
                          ))
                        ) : (
                          <span className="text-[10px] italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  No tasks found. Try creating a new task to get started!
                </div>
              )}
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[4%] text-center">
                      <Star className="mx-auto h-3 w-3 text-muted-foreground/40" />
                    </TableHead>
                    <TableHead className="w-[18%]">Task Title</TableHead>
                    <TableHead className="w-[10%]">Priority</TableHead>
                    <TableHead className="w-[13%]">Status</TableHead>
                    <TableHead className="w-[12%]">Due Date</TableHead>
                    <TableHead className="w-[13%]">Assignees</TableHead>
                    <TableHead className="w-[6%]">Files</TableHead>
                    <TableHead className="w-[8%]">Comments</TableHead>
                    <TableHead className="w-[16%]">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks && filteredTasks.length > 0 ? (
                    Object.entries(getGroupedTasks()).map(
                      ([groupKey, groupTasks]) => {
                        const isCollapsed = collapsedGroups.includes(groupKey)
                        return (
                          <React.Fragment key={groupKey}>
                            {/* Group Header Row */}
                            {groupKey && (
                              <TableRow
                                className="cursor-pointer border-y border-border/60 bg-muted/40 select-none hover:bg-muted/50"
                                onClick={() => toggleGroupCollapse(groupKey)}
                              >
                                <TableCell
                                  colSpan={9}
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
                                      {groupTasks.length}{" "}
                                      {groupTasks.length === 1
                                        ? "task"
                                        : "tasks"}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}

                            {/* Group Task Rows */}
                            {!isCollapsed &&
                              groupTasks.map((task: any) => (
                                <TableRow
                                  key={task._id}
                                  className={`cursor-pointer transition-colors hover:bg-muted/15 ${task.isArchived ? "bg-muted/5 opacity-60" : ""}`}
                                  onClick={() => setSelectedTaskId(task._id)}
                                >
                                  {/* Star toggle */}
                                  <TableCell
                                    className="w-[4%] text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      disabled={task.isArchived}
                                      onClick={() =>
                                        !task.isArchived &&
                                        handleToggleStar(task._id)
                                      }
                                      className={`transition-colors focus:outline-none ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                    >
                                      <Star
                                        className={`h-3.5 w-3.5 transition-all ${
                                          task.isStarred
                                            ? "scale-110 fill-amber-400 text-amber-400 drop-shadow-xs filter"
                                            : "text-muted-foreground/35 hover:scale-105 hover:text-amber-400"
                                        }`}
                                      />
                                    </button>
                                  </TableCell>

                                  {/* Title & Desc */}
                                  <TableCell className="w-[18%]">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="line-clamp-1 text-xs font-semibold text-foreground">
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigator.clipboard.writeText(
                                                `#${task._id.slice(-4)}`
                                              )
                                              toast.success(
                                                `Copied Task ID #${task._id.slice(-4)} to clipboard!`
                                              )
                                            }}
                                            className="mr-1 cursor-pointer font-mono text-[10px] font-medium text-muted-foreground/60 transition-colors select-all hover:text-foreground"
                                          >
                                            #{task._id.slice(-4)}
                                          </span>{" "}
                                          {task.title}
                                        </span>
                                        {getTaskRelation(task) !== "Other" && (
                                          <Badge
                                            variant="outline"
                                            className={`h-4 shrink-0 rounded-md border px-1.5 py-0 text-[9px] font-medium select-none ${getRelationStyle(getTaskRelation(task))}`}
                                          >
                                            {getTaskRelation(task)}
                                          </Badge>
                                        )}
                                        {task.formId &&
                                          !task.formResponseId && (
                                            <Badge
                                              variant="outline"
                                              className="flex h-4 cursor-pointer items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[9px] font-semibold text-amber-600 transition-all hover:bg-amber-500/20"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedTaskId(task._id)
                                              }}
                                            >
                                              <FileText className="h-2.5 w-2.5 shrink-0" />
                                              <span>Fill Form</span>
                                            </Badge>
                                          )}
                                        {task.formId && task.formResponseId && (
                                          <Badge
                                            variant="outline"
                                            className="flex h-4 items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-semibold text-emerald-600 select-none"
                                          >
                                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                                            <span>Submitted</span>
                                          </Badge>
                                        )}
                                        {task.isArchived && (
                                          <Badge
                                            variant="secondary"
                                            className="h-4 shrink-0 px-1.5 py-0 text-[8px] font-normal opacity-85 select-none"
                                          >
                                            Archived
                                          </Badge>
                                        )}
                                      </div>
                                      {(task.description ||
                                        task.recurrence) && (
                                        <span className="line-clamp-1 text-[10px] text-muted-foreground">
                                          {task.recurrence && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="mr-1.5 inline-block align-middle">
                                                  <Repeat className="size-2.5 cursor-help text-blue-500" />
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent className="rounded border bg-popover p-1.5 px-2 text-[10px] text-popover-foreground shadow-md">
                                                <span>
                                                  Repeats{" "}
                                                  {task.recurrence.frequency}
                                                </span>
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {task.description}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Priority Badge */}
                                  <TableCell className="w-[10%]">
                                    <Badge
                                      variant="outline"
                                      className={`h-5 border px-2 py-0 text-[10px] font-medium ${getPriorityStyle(task.priority)}`}
                                    >
                                      Priority: {task.priority}
                                    </Badge>
                                  </TableCell>

                                  {/* Status Select */}
                                  <TableCell
                                    className="w-[13%]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      value={task.status}
                                      onValueChange={(val) =>
                                        handleStatusChange(task._id, val)
                                      }
                                      disabled={task.isArchived}
                                    >
                                      <SelectTrigger
                                        className={`h-6 w-[120px] cursor-pointer rounded-full border px-2 py-0 text-[10px] font-medium transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}
                                      >
                                        <SelectValue
                                          placeholder={task.status}
                                        />
                                      </SelectTrigger>
                                      <SelectContent
                                        position="popper"
                                        className="text-xs"
                                      >
                                        <SelectItem value="Pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="In Progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="Under Review">
                                          Under Review
                                        </SelectItem>
                                        <SelectItem
                                          value="Pending Approval"
                                          disabled={
                                            !!task.formId &&
                                            !task.formResponseId
                                          }
                                        >
                                          Pending Approval
                                        </SelectItem>
                                        <SelectItem
                                          value="Completed"
                                          disabled={
                                            !!task.formId &&
                                            !task.formResponseId
                                          }
                                        >
                                          Completed
                                        </SelectItem>
                                        <SelectItem value="Cancelled">
                                          Cancelled
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>

                                  {/* Due Date */}
                                  <TableCell className="w-[12%]">
                                    <DueDateBadge
                                      dueDate={task.dueDate}
                                      timeOfDay={task.timeOfDay}
                                      status={task.status}
                                    />
                                  </TableCell>

                                  {/* Assignees Avatars */}
                                  <TableCell
                                    className="w-[13%]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                                      {task.assigneeIds &&
                                      task.assigneeIds.length > 0 ? (
                                        task.assigneeIds
                                          .slice(0, 3)
                                          .map((userId: string) => (
                                            <UserAvatar
                                              key={userId}
                                              userId={userId}
                                              avatarClassName="h-5.5 w-5.5 border-2 border-card shadow-xs transition-transform hover:translate-y-[-2px]"
                                            />
                                          ))
                                      ) : (
                                        <span className="pr-1.5 text-[10px] text-muted-foreground italic">
                                          Unassigned
                                        </span>
                                      )}
                                      <TaskParticipantsHoverCard task={task} />
                                    </div>
                                  </TableCell>

                                  {/* Files */}
                                  <TableCell className="w-[6%]">
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                      <span>{task.documentCount || 0}</span>
                                    </div>
                                  </TableCell>

                                  {/* Comments */}
                                  <TableCell className="w-[8%]">
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MessageSquare
                                          className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "fill-blue-500/10 text-blue-500" : "text-muted-foreground/60"}`}
                                        />
                                        <span
                                          className={
                                            task.unreadCommentCount > 0
                                              ? "font-semibold text-foreground"
                                              : ""
                                          }
                                        >
                                          {task.commentCount || 0}
                                        </span>
                                      </div>
                                      {task.unreadCommentCount > 0 && (
                                        <Badge
                                          variant="default"
                                          className="h-4 shrink-0 scale-90 border-none bg-blue-500 px-1 text-[9px] font-semibold text-white hover:bg-blue-600"
                                        >
                                          {task.unreadCommentCount} new
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Last Activity */}
                                  <TableCell className="w-[16%]">
                                    <div className="flex items-center gap-2">
                                      <AvatarHoverCard
                                        user={task.lastActivity?.actor}
                                        userId={task.lastActivity?.actorId}
                                      >
                                        <Avatar className="h-4.5 w-4.5 shrink-0">
                                          <AvatarImage
                                            src={getAvatarUrl(
                                              task.lastActivity?.actor?.image,
                                              task.lastActivity?.actor?.name
                                            )}
                                          />
                                          <AvatarFallback className="bg-accent text-[8px] font-semibold text-accent-foreground">
                                            {task.lastActivity?.actor?.name?.charAt(
                                              0
                                            ) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      </AvatarHoverCard>
                                      <div className="flex min-w-0 flex-col select-none">
                                        <span
                                          className="max-w-[110px] truncate text-[10px] font-medium text-foreground"
                                          title={formatAction(
                                            task.lastActivity?.action
                                          )}
                                        >
                                          {formatAction(
                                            task.lastActivity?.action
                                          )}
                                        </span>
                                        <span className="truncate text-[9px] text-muted-foreground">
                                          {formatTimeAgo(
                                            task.lastActivity?.timestamp
                                          )}
                                        </span>
                                      </div>
                                    </div>
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
                        colSpan={9}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No tasks found. Try creating a new task to get started!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )
        ) : view === "list" ? (
          <div className="max-h-[calc(100vh-220px)] w-full overflow-auto p-4">
            {filteredTasks && filteredTasks.length > 0 ? (
              Object.entries(getGroupedTasks()).map(
                ([groupKey, groupTasks]) => {
                  const isCollapsed = collapsedGroups.includes(groupKey)
                  return (
                    <React.Fragment key={groupKey}>
                      {/* Group Header banner */}
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
                            {groupTasks.length}{" "}
                            {groupTasks.length === 1 ? "task" : "tasks"}
                          </Badge>
                        </div>
                      )}

                      {/* Group Card Grid */}
                      {!isCollapsed && (
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {groupTasks.map((task: any) => (
                            <div
                              key={task._id}
                              className={`group flex min-h-[190px] cursor-pointer flex-col justify-between rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:bg-card/85 hover:shadow-md dark:hover:bg-card/75 ${task.isArchived ? "bg-muted/5 opacity-60" : ""}`}
                              onClick={() => setSelectedTaskId(task._id)}
                            >
                              {/* Card Top Row: Star toggle & Priority Badge */}
                              <div className="mb-2.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={task.isArchived}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!task.isArchived)
                                        handleToggleStar(task._id)
                                    }}
                                    className={`transition-colors focus:outline-none ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                  >
                                    <Star
                                      className={`h-4 w-4 transition-all ${
                                        task.isStarred
                                          ? "scale-110 fill-amber-400 text-amber-400 drop-shadow-xs filter"
                                          : "text-muted-foreground/35 hover:scale-105 hover:text-amber-400"
                                      }`}
                                    />
                                  </button>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigator.clipboard.writeText(
                                        `#${task._id.slice(-4)}`
                                      )
                                      toast.success(
                                        `Copied Task ID #${task._id.slice(-4)} to clipboard!`
                                      )
                                    }}
                                    className="cursor-pointer font-mono text-[9px] font-medium text-muted-foreground/60 transition-colors select-all hover:text-foreground"
                                  >
                                    #{task._id.slice(-4)}
                                  </span>
                                  {getTaskRelation(task) !== "Other" && (
                                    <Badge
                                      variant="outline"
                                      className={`h-4 shrink-0 rounded-md border px-1.5 py-0 text-[9px] font-medium select-none ${getRelationStyle(getTaskRelation(task))}`}
                                    >
                                      {getTaskRelation(task)}
                                    </Badge>
                                  )}
                                  {task.formId && !task.formResponseId && (
                                    <Badge
                                      variant="outline"
                                      className="flex h-4 cursor-pointer items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[9px] font-semibold text-amber-600 transition-all hover:bg-amber-500/20"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTaskId(task._id)
                                      }}
                                    >
                                      <FileText className="h-2.5 w-2.5 shrink-0" />
                                      <span>Fill Form</span>
                                    </Badge>
                                  )}
                                  {task.formId && task.formResponseId && (
                                    <Badge
                                      variant="outline"
                                      className="flex h-4 items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-semibold text-emerald-600 select-none"
                                    >
                                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                                      <span>Submitted</span>
                                    </Badge>
                                  )}
                                </div>

                                <Badge
                                  variant="outline"
                                  className={`h-5 border px-2 py-0 text-[9px] font-medium ${getPriorityStyle(task.priority)}`}
                                >
                                  {task.priority}
                                </Badge>
                              </div>

                              {/* Card Middle: Title & Description */}
                              <div className="mb-3 flex flex-1 flex-col gap-1.5">
                                <div className="flex w-full items-center justify-between gap-1.5">
                                  <span className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                                    {task.title}
                                  </span>
                                  {task.isArchived && (
                                    <Badge
                                      variant="secondary"
                                      className="h-4 shrink-0 px-1.5 py-0 text-[8px] font-normal opacity-85 select-none"
                                    >
                                      Archived
                                    </Badge>
                                  )}
                                </div>
                                {(task.description || task.recurrence) && (
                                  <span className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                    {task.recurrence && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="mr-1.5 inline-block align-middle">
                                            <Repeat className="size-2.5 cursor-help text-blue-500" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded border bg-popover p-1.5 px-2 text-[10px] text-popover-foreground shadow-md">
                                          <span>
                                            Repeats {task.recurrence.frequency}
                                          </span>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {task.description}
                                  </span>
                                )}
                              </div>

                              {/* Card Details: Status & Due Date */}
                              <div className="mb-3 flex flex-col gap-2 border-t border-dashed border-border/40 pt-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    Status:
                                  </span>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={task.status}
                                      onValueChange={(val) =>
                                        handleStatusChange(task._id, val)
                                      }
                                      disabled={task.isArchived}
                                    >
                                      <SelectTrigger
                                        className={`h-6 w-[110px] cursor-pointer rounded-full border px-2 py-0 text-[9px] font-medium transition-all hover:brightness-95 ${getStatusStyle(task.status)}`}
                                      >
                                        <SelectValue
                                          placeholder={task.status}
                                        />
                                      </SelectTrigger>
                                      <SelectContent
                                        position="popper"
                                        className="text-xs"
                                      >
                                        <SelectItem value="Pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="In Progress">
                                          In Progress
                                        </SelectItem>
                                        <SelectItem value="Under Review">
                                          Under Review
                                        </SelectItem>
                                        <SelectItem
                                          value="Pending Approval"
                                          disabled={
                                            !!task.formId &&
                                            !task.formResponseId
                                          }
                                        >
                                          Pending Approval
                                        </SelectItem>
                                        <SelectItem
                                          value="Completed"
                                          disabled={
                                            !!task.formId &&
                                            !task.formResponseId
                                          }
                                        >
                                          Completed
                                        </SelectItem>
                                        <SelectItem value="Cancelled">
                                          Cancelled
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span className="font-medium">Due Date:</span>
                                  <DueDateBadge
                                    dueDate={task.dueDate}
                                    timeOfDay={task.timeOfDay}
                                    status={task.status}
                                  />
                                </div>
                              </div>

                              {/* Card Footer: Metrics (Comments/Files) & Assignees */}
                              <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-2.5">
                                  {/* Files Count */}
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                    <span>{task.documentCount || 0}</span>
                                  </div>

                                  {/* Comments Count */}
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <MessageSquare
                                      className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "fill-blue-500/10 text-blue-500" : "text-muted-foreground/60"}`}
                                    />
                                    <span
                                      className={
                                        task.unreadCommentCount > 0
                                          ? "font-semibold text-foreground"
                                          : ""
                                      }
                                    >
                                      {task.commentCount || 0}
                                    </span>
                                    {task.unreadCommentCount > 0 && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                </div>

                                {/* Assignee avatars */}
                                <div
                                  className="flex items-center -space-x-1.5 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {task.assigneeIds &&
                                  task.assigneeIds.length > 0 ? (
                                    task.assigneeIds
                                      .slice(0, 3)
                                      .map((userId: string) => (
                                        <UserAvatar
                                          key={userId}
                                          userId={userId}
                                          avatarClassName="h-5 w-5 border-2 border-card shadow-xs transition-transform hover:translate-y-[-1px]"
                                        />
                                      ))
                                  ) : (
                                    <span className="pr-1 text-[9px] text-muted-foreground italic">
                                      Unassigned
                                    </span>
                                  )}
                                  <TaskParticipantsHoverCard task={task} />
                                </div>
                              </div>

                              {/* Micro last activity row */}
                              <div className="mt-2.5 flex items-center gap-1.5 border-t border-dashed border-border/30 pt-1.5 text-[9px] text-muted-foreground">
                                <AvatarHoverCard
                                  user={task.lastActivity?.actor}
                                  userId={task.lastActivity?.actorId}
                                >
                                  <Avatar className="h-4 w-4 shrink-0">
                                    <AvatarImage
                                      src={getAvatarUrl(
                                        task.lastActivity?.actor?.image,
                                        task.lastActivity?.actor?.name
                                      )}
                                    />
                                    <AvatarFallback className="bg-accent text-[7px] font-semibold text-accent-foreground">
                                      {task.lastActivity?.actor?.name?.charAt(
                                        0
                                      ) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </AvatarHoverCard>
                                <span className="max-w-[170px] truncate">
                                  {formatAction(task.lastActivity?.action)} •{" "}
                                  {formatTimeAgo(task.lastActivity?.timestamp)}
                                </span>
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
                No tasks found. Try creating a new task to get started!
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[calc(100vh-220px)] w-full items-stretch gap-4 overflow-x-auto p-4 select-none">
            {visibleStatuses.map((status) => {
              const isCollapsed = collapsedColumns.includes(status)
              const statusTasks =
                filteredTasks?.filter((t: any) => t.status === status) || []

              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault()
              }

              const handleDrop = async (e: React.DragEvent) => {
                e.preventDefault()
                const taskId = e.dataTransfer.getData("taskId")
                if (!taskId) return
                // Find task to see if it changed
                const task = filteredTasks?.find((t: any) => t._id === taskId)
                if (task && task.status !== status) {
                  if (
                    task.formId &&
                    !task.formResponseId &&
                    (status === "Completed" || status === "Pending Approval")
                  ) {
                    toast.warning(
                      "You must submit the required form before completing this task.",
                      {
                        action: {
                          label: "Fill Form",
                          onClick: () => setSelectedTaskId(task._id),
                        },
                      }
                    )
                    return
                  }
                  await handleStatusChange(taskId, status)
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
                      {statusTasks.length}
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
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between border-b border-border/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          status === "Pending"
                            ? "bg-yellow-400"
                            : status === "In Progress"
                              ? "bg-sky-400"
                              : status === "Under Review"
                                ? "bg-purple-400"
                                : status === "Pending Approval"
                                  ? "bg-amber-400"
                                  : status === "Completed"
                                    ? "bg-emerald-400"
                                    : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-foreground/90">
                        {status}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4.5 px-1.5 py-0 text-[10px] font-medium text-muted-foreground/80"
                      >
                        {statusTasks.length}
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

                  {/* Task Cards List */}
                  <div className="flex-1 scrollbar-thin space-y-2.5 overflow-y-auto py-1 pr-1">
                    {statusTasks.length > 0 ? (
                      statusTasks.map((task: any) => (
                        <div
                          key={task._id}
                          draggable={!task.isArchived}
                          onDragStart={(e) => {
                            if (task.isArchived) return
                            e.dataTransfer.setData("taskId", task._id)
                            e.dataTransfer.effectAllowed = "move"
                          }}
                          className={`group rounded-xl border border-border/50 bg-card/65 p-3 shadow-xs backdrop-blur-xs transition-all hover:border-primary/20 hover:bg-card hover:shadow-md dark:hover:bg-card/85 ${task.isArchived ? "cursor-not-allowed bg-muted/5 opacity-60" : "cursor-grab active:cursor-grabbing"}`}
                          onClick={() => setSelectedTaskId(task._id)}
                        >
                          {/* Card Top Row: Star & Priority */}
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={task.isArchived}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!task.isArchived)
                                    handleToggleStar(task._id)
                                }}
                                className={`transition-colors focus:outline-none ${task.isArchived ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 transition-all ${
                                    task.isStarred
                                      ? "scale-110 fill-amber-400 text-amber-400 drop-shadow-xs filter"
                                      : "text-muted-foreground/35 hover:scale-105 hover:text-amber-400"
                                  }`}
                                />
                              </button>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(
                                    `#${task._id.slice(-4)}`
                                  )
                                  toast.success(
                                    `Copied Task ID #${task._id.slice(-4)} to clipboard!`
                                  )
                                }}
                                className="cursor-pointer font-mono text-[9px] font-medium text-muted-foreground/60 transition-colors select-all hover:text-foreground"
                              >
                                #{task._id.slice(-4)}
                              </span>
                              {getTaskRelation(task) !== "Other" && (
                                <Badge
                                  variant="outline"
                                  className={`h-4 shrink-0 rounded-md border px-1.5 py-0 text-[8px] font-medium select-none ${getRelationStyle(getTaskRelation(task))}`}
                                >
                                  {getTaskRelation(task)}
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`h-4.5 border px-1.5 py-0 text-[8px] font-medium ${getPriorityStyle(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>

                          {/* Card Info */}
                          <div className="mb-2 flex flex-col gap-0.5">
                            <div className="flex w-full items-center justify-between gap-1.5">
                              <span className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                                {task.title}
                              </span>
                              {task.isArchived && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 shrink-0 px-1.5 py-0 text-[8px] font-normal opacity-85 select-none"
                                >
                                  Archived
                                </Badge>
                              )}
                            </div>
                            {(task.description || task.recurrence) && (
                              <span className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                {task.recurrence && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="mr-1.5 inline-block align-middle">
                                        <Repeat className="size-2.5 cursor-help text-blue-500" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded border bg-popover p-1.5 px-2 text-[10px] text-popover-foreground shadow-md">
                                      <span>
                                        Repeats {task.recurrence.frequency}
                                      </span>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {task.description}
                              </span>
                            )}
                          </div>

                          {/* Card Due Date */}
                          <div className="mb-2.5">
                            <DueDateBadge
                              dueDate={task.dueDate}
                              timeOfDay={task.timeOfDay}
                              status={task.status}
                              className="h-6 w-full justify-start rounded-md p-1 px-1.5"
                            />
                          </div>

                          {/* Card Footer */}
                          <div className="flex items-center justify-between border-t border-border/30 pt-2 text-[9px] text-muted-foreground">
                            {/* Metrics */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                                <span>{task.documentCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <MessageSquare
                                  className={`h-3 w-3 ${task.unreadCommentCount > 0 ? "fill-blue-500/10 text-blue-500" : "text-muted-foreground/60"}`}
                                />
                                <span
                                  className={
                                    task.unreadCommentCount > 0
                                      ? "font-semibold text-foreground"
                                      : ""
                                  }
                                >
                                  {task.commentCount || 0}
                                </span>
                              </div>
                            </div>

                            {/* Assignees */}
                            <div
                              className="flex items-center -space-x-1.5 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.assigneeIds &&
                              task.assigneeIds.length > 0 ? (
                                task.assigneeIds
                                  .slice(0, 3)
                                  .map((userId: string) => (
                                    <UserAvatar
                                      key={userId}
                                      userId={userId}
                                      avatarClassName="h-4.5 w-4.5 border border-card shadow-xs"
                                    />
                                  ))
                              ) : (
                                <span className="pr-0.5 text-[8px] text-muted-foreground italic">
                                  Unassigned
                                </span>
                              )}
                              <TaskParticipantsHoverCard task={task} />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border/30 p-2 text-center text-[10px] text-muted-foreground/60">
                        No tasks in this status
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog for creating tasks */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
      />

      {/* Sheet for displaying task details */}
      <TaskDetailsSheet
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}

const formatAction = (action?: string) => {
  if (!action) return "No activity"
  switch (action) {
    case "TASK_CREATED":
      return "Task created"
    case "STATUS_CHANGED":
      return "Status updated"
    case "TASK_UPDATED":
      return "Task updated"
    case "ASSIGNEES_UPDATED":
      return "Assignees updated"
    case "COLLABORATORS_UPDATED":
      return "Collaborators updated"
    case "SUBSCRIBERS_UPDATED":
      return "Subscribers updated"
    case "SUBTASK_CREATED":
      return "Subtask added"
    case "SUBTASK_TOGGLED":
      return "Subtask toggled"
    case "ATTACHMENT_ADDED":
      return "File attached"
    case "ATTACHMENT_DELETED":
      return "File deleted"
    case "COMMENT_ADDED":
      return "Comment added"
    default:
      return action
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return ""
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
