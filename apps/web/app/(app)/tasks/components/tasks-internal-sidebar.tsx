"use client"

import { useState } from "react"
import { TaskCalendar } from "./calendar"
import { Button } from "@workspace/ui/components/button"
import {
  Calendar,
  Filter,
  Inbox,
  Clock,
  CheckCircle,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

interface TasksSidebarProps {
  activeFilter?: string
  setActiveFilter?: (filter: string) => void
}

export default function TasksSidebar({
  activeFilter: propActiveFilter,
  setActiveFilter: propSetActiveFilter,
}: TasksSidebarProps) {
  const [localActiveFilter, setLocalActiveFilter] = useState("inbox")
  const activeFilter = propActiveFilter ?? localActiveFilter
  const setActiveFilter = propSetActiveFilter ?? setLocalActiveFilter

  const mainFilters = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: 5 },
    { id: "today", label: "Today", icon: Clock, count: 2 },
    { id: "upcoming", label: "Upcoming", icon: Calendar, count: 8 },
    { id: "completed", label: "Completed", icon: CheckCircle, count: 12 },
  ]

  const tags = [
    { id: "high", label: "High Priority", color: "bg-red-500" },
    { id: "medium", label: "Medium Priority", color: "bg-amber-500" },
    { id: "low", label: "Low Priority", color: "bg-blue-500" },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 h-8 text-xs font-medium border-input/40 bg-card hover:bg-accent transition-all duration-200"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters & Schedule</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[350px] sm:w-[380px] p-6 flex flex-col h-full overflow-y-auto scrollbar-none">
        <SheetHeader className="px-0 pt-0 pb-2">
          <SheetTitle className="text-lg font-bold">Tasks Control</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Manage your schedule, filter tasks, and view by category.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col space-y-6 mt-4">
          {/* Calendar section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Schedule
            </h3>
            <div className="rounded-md border p-2 bg-muted/20">
              <TaskCalendar />
            </div>
          </div>

          {/* Filters section */}
          <div className="flex flex-col space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Filters
            </h3>
            {mainFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-all duration-200 group text-left",
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{filter.label}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs rounded px-1.5 py-0.5",
                      activeFilter === filter.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-background"
                    )}
                  >
                    {filter.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tags Section */}
          <div className="flex flex-col space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Tags
            </h3>
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-all duration-200 text-left"
              >
                <div className={cn("h-2 w-2 rounded-full", tag.color)} />
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
