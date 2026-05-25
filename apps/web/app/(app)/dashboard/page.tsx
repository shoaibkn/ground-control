"use client"

import { useState } from "react"
import {
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Activity,
  CheckSquare,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { usePageTitle } from "@/hooks/use-page-title"

interface Task {
  id: string
  title: string
  status: "Pending" | "In Progress" | "Completed"
  priority: "High" | "Medium" | "Low"
  dueDate: string
}

interface ActivityItem {
  id: string
  user: string
  action: string
  target: string
  time: string
  type: "task" | "approval" | "chat"
}

export default function DashboardPage() {
  usePageTitle("Dashboard")

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review marketing launch campaign assets",
      status: "In Progress",
      priority: "High",
      dueDate: "Today, 5:00 PM",
    },
    {
      id: "2",
      title: "Approve development sprint budget expansion",
      status: "Pending",
      priority: "Medium",
      dueDate: "Tomorrow",
    },
    {
      id: "3",
      title: "Set up analytics tracking for new onboard flow",
      status: "Completed",
      priority: "Low",
      dueDate: "Completed",
    },
    {
      id: "4",
      title: "Update security compliance documentation",
      status: "Pending",
      priority: "High",
      dueDate: "May 25",
    },
  ])

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "1",
      user: "Sarah Jenkins",
      action: "created task",
      target: "Design UI prototype components",
      time: "10m ago",
      type: "task",
    },
    {
      id: "2",
      user: "Michael Chen",
      action: "requested approval for",
      target: "Sprint 4 deploy guidelines",
      time: "42m ago",
      type: "approval",
    },
    {
      id: "3",
      user: "Alex Rivera",
      action: "posted a message in",
      target: "#product-launch",
      time: "2 hours ago",
      type: "chat",
    },
  ])

  const stats = [
    {
      title: "Active Tasks",
      value: tasks.filter((t) => t.status !== "Completed").length.toString(),
      description: "2 high priority items",
      icon: CheckSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Approvals",
      value: "3",
      description: "Requires action from you",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Active Chats",
      value: "8",
      description: "12 unread notifications",
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Team Velocity",
      value: "+18.4%",
      description: "Compared to last sprint",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ]

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const newStatus = t.status === "Completed" ? "Pending" : "Completed"
          return { ...t, status: newStatus }
        }
        return t
      })
    )
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-6 text-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-40 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-primary/50 text-primary-foreground bg-primary/10 text-xs px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                <Sparkles className="size-3.5 mr-1 animate-pulse text-amber-400" />
                V2 Layout Active
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Welcome back, John!
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Here is what is happening across your projects today.
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-primary/20 transition-all gap-1 text-xs">
            <Plus className="size-3.5" /> Quick Action
          </Button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="overflow-hidden border border-border/60 hover:border-border transition-all duration-300 shadow-xs hover:shadow-md">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {stat.description}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Grid: Tasks & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Task List (Left column group) */}
        <Card className="md:col-span-7 border border-border/60 shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Action Items Checklist
              </CardTitle>
              <CardDescription className="text-[10px]">
                Your assignments and active work requests.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  task.status === "Completed"
                    ? "border-muted/50 bg-muted/20 opacity-70"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="mt-0.5">
                  <div className={`flex size-4 items-center justify-center rounded-sm border ${
                    task.status === "Completed"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/40 hover:border-primary"
                  }`}>
                    {task.status === "Completed" && <CheckCircle2 className="size-3 fill-emerald-500 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold leading-tight truncate ${
                    task.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"
                  }`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {task.dueDate}
                    </span>
                    <Badge
                      variant={
                        task.priority === "High"
                          ? "destructive"
                          : task.priority === "Medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-[9px] px-1.5 py-0 rounded-md"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Feed (Right column group) */}
        <Card className="md:col-span-5 border border-border/60 shadow-xs flex flex-col justify-between">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Recent Feed
            </CardTitle>
            <CardDescription className="text-[10px]">
              Updates from members of your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 flex-1 space-y-4">
            {activities.map((item, idx) => (
              <div key={item.id} className="relative flex gap-3 text-xs">
                {idx !== activities.length - 1 && (
                  <div className="absolute left-[9px] top-6 bottom-[-20px] w-0.5 bg-border" />
                )}
                <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-muted border text-[9px] font-semibold">
                  {item.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs leading-normal">
                    <span className="font-semibold text-foreground">{item.user}</span>{" "}
                    {item.action}{" "}
                    <span className="font-semibold text-foreground">{item.target}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/10">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground text-[10px]">3 connected integrations</span>
              <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                All Systems Normal
              </Badge>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
