"use client"

import { useState } from "react"
import { TaskCalendar } from "./calendar"
import { Button } from "@workspace/ui/components/button"
import { Calendar, Filter, Inbox, Clock, CheckCircle } from "lucide-react"
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
          className="flex h-8 items-center gap-1.5 border-input/40 bg-card text-xs font-medium transition-all duration-200 hover:bg-accent"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters & Schedule</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-full w-[350px] scrollbar-none flex-col overflow-y-auto p-6 sm:w-[380px]"
      >
        <SheetHeader className="px-0 pt-0 pb-2">
          <SheetTitle className="text-lg font-bold">Tasks Control</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Manage your schedule, filter tasks, and view by category.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col space-y-6">
          {/* Calendar section */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Schedule
            </h3>
            <div className="rounded-md border bg-muted/20 p-2">
              <TaskCalendar />
            </div>
          </div>

          {/* Filters section */}
          <div className="flex flex-col space-y-1">
            <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Filters
            </h3>
            {mainFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-all duration-200",
                    activeFilter === filter.id
                      ? "bg-primary font-medium text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{filter.label}</span>
                  </div>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs",
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
            <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Tags
            </h3>
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
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
