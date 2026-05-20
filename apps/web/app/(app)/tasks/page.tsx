"use client"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { TaskCalendar } from "./components/calendar"
import { Kanban, List, Table } from "lucide-react"
import { useState } from "react"
import TasksSidebar from "./components/tasks-internal-sidebar"

export default function TasksPage() {
  const [view, setView] = useState<"kanban" | "list" | "table">("kanban")

  return (
    <div className="flex flex-row items-start">
      <TasksSidebar />
      <div className="mt-2 mr-2 ml-4 flex h-full w-full flex-col">
        <div className="mb-4 flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <ButtonGroup>
            <Button
              size={"icon-lg"}
              variant={view === "kanban" ? "default" : "outline"}
              onClick={() => setView("kanban")}
            >
              <Kanban />
            </Button>
            <Button
              size={"icon-lg"}
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setView("list")}
            >
              <List />
            </Button>
            <Button
              size={"icon-lg"}
              variant={view === "table" ? "default" : "outline"}
              onClick={() => setView("table")}
            >
              <Table />
            </Button>
          </ButtonGroup>
        </div>
        <div className="h-24 w-96 rounded-xl border"></div>
      </div>
    </div>
  )
}
