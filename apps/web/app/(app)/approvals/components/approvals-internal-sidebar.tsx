"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Filter,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
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

interface ApprovalsSidebarProps {
  activeFilter?: string
  setActiveFilter?: (filter: string) => void
  counts?: {
    all: number
    pending: number
    approved: number
    declined: number
    rework: number
  }
}

export default function ApprovalsSidebar({
  activeFilter = "all",
  setActiveFilter = () => {},
  counts = { all: 0, pending: 0, approved: 0, declined: 0, rework: 0 },
}: ApprovalsSidebarProps) {
  const mainFilters = [
    { id: "all", label: "All Requests", icon: Inbox, count: counts.all, color: "text-muted-foreground" },
    { id: "pending", label: "Pending Review", icon: Clock, count: counts.pending, color: "text-sky-500" },
    { id: "approved", label: "Approved", icon: CheckCircle, count: counts.approved, color: "text-emerald-500" },
    { id: "declined", label: "Declined", icon: XCircle, count: counts.declined, color: "text-rose-500" },
    { id: "rework", label: "Needs Rework", icon: AlertTriangle, count: counts.rework, color: "text-amber-500" },
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
          <span>Filters & Stages</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[350px] sm:w-[380px] p-6 flex flex-col h-full overflow-y-auto scrollbar-none">
        <SheetHeader className="px-0 pt-0 pb-2">
          <SheetTitle className="text-lg font-bold">Approvals Hub</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Track approval requests, change review stages, and manage updates.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col space-y-6 mt-4">
          {/* Filters section */}
          <div className="flex flex-col space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Review Stages
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
                    <Icon className={cn("h-4 w-4 shrink-0", activeFilter === filter.id ? "text-primary-foreground" : filter.color)} />
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
