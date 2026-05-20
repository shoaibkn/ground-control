"use client"

import { useState } from "react"
import { TaskCalendar } from "./calendar"
import { Button } from "@workspace/ui/components/button"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Inbox,
  Clock,
  CheckCircle,
  Tag,
  Hash,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export default function TasksSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeFilter, setActiveFilter] = useState("inbox")

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
    <div
      className={cn(
        "relative h-[calc(100dvh-78px)] transition-all duration-300 ease-in-out border flex flex-col rounded-md bg-card shadow-sm",
        isOpen ? "w-96 p-4" : "w-14 p-2 items-center"
      )}
    >
      {/* Toggle button - Notion/Linear style floating on the border */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute top-4 z-20 h-6 w-6 rounded-full border shadow-sm bg-background hover:bg-accent transition-all duration-200",
          isOpen ? "-right-3" : "right-3.5"
        )}
      >
        {isOpen ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      {/* Expanded Sidebar Content */}
      <div
        className={cn(
          "flex flex-col space-y-6 w-full transition-opacity duration-200 h-full overflow-y-auto scrollbar-none",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none hidden"
        )}
      >
        {/* Calendar section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Schedule
          </h3>
          <TaskCalendar />
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
                  "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-all duration-200 group",
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

      {/* Collapsed Sidebar Content (Visual Indicators) */}
      {!isOpen && (
        <div className="flex flex-col space-y-6 mt-14 items-center w-full">
          {/* Calendar trigger indicator */}
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <span className="absolute left-full ml-2 top-1.5 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
              Schedule
            </span>
          </div>

          <div className="w-8 border-t border-muted" />

          {/* Quick filter icons */}
          <div className="flex flex-col space-y-2">
            {mainFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <div key={filter.id} className="group relative">
                  <Button
                    variant={activeFilter === filter.id ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "h-9 w-9 rounded-md hover:bg-accent",
                      activeFilter === filter.id
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                  <span className="absolute left-full ml-2 top-1.5 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                    {filter.label} ({filter.count})
                  </span>
                </div>
              )
            })}
          </div>

          <div className="w-8 border-t border-muted" />

          {/* Tag indicators */}
          <div className="flex flex-col space-y-3 py-1">
            {tags.map((tag) => (
              <div key={tag.id} className="group relative flex items-center justify-center">
                <div className={cn("h-2 w-2 rounded-full cursor-pointer hover:scale-125 transition-transform", tag.color)} />
                <span className="absolute left-full ml-3 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                  {tag.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
