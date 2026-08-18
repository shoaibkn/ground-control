"use client"

import { useState, Fragment } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  Bell,
  Check,
  Circle,
  Info,
  User,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "./theme-toggle"
import { AnimatedIcon } from "./animated-icon"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Badge } from "@workspace/ui/components/badge"
import Link from "next/link"

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  const { data: activeOrg } = authClient.useActiveOrganization()
  const orgId = activeOrg?.id || ""

  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Convex Reactive Notification Queries & Mutations
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    orgId ? { organizationId: orgId, category: activeCategory } : "skip"
  )
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    orgId ? { organizationId: orgId } : "skip"
  ) ?? 0

  const markReadMutation = useMutation(api.notifications.markNotificationRead)
  const markAllReadMutation = useMutation(api.notifications.markAllNotificationsRead)
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification)
  const clearAllReadMutation = useMutation(api.notifications.clearAllReadNotifications)

  const getSegmentLabel = (segment: string) => {
    const mapping: Record<string, string> = {
      dashboard: "Home",
      chats: "Inbox",
      tasks: "Tasks",
      approvals: "Approvals",
      settings: "Settings",
      forms: "Forms",
    }
    return (
      mapping[segment.toLowerCase()] ||
      segment.charAt(0).toUpperCase() + segment.slice(1)
    )
  }

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markReadMutation({ notificationId: notif._id })
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const getNotificationIcon = (type: string) => {
    if (type.startsWith("task_") || type === "task") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    }
    if (type.startsWith("approval_") || type === "approval") {
      return <ClipboardList className="h-4 w-4 text-purple-500" />
    }
    if (type.includes("comment") || type.includes("chat")) {
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
    if (type.startsWith("form_") || type === "form") {
      return <FileText className="h-4 w-4 text-orange-500" />
    }
    return <Info className="h-4 w-4 text-sky-500" />
  }

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left side: Navigation / Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Ground Control</BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const url = `/${pathSegments.slice(0, index + 1).join("/")}`
              const isLast = index === pathSegments.length - 1
              const label = getSegmentLabel(segment)

              return (
                <Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={url}>{label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="animate-icon-group group/btn relative h-8 w-8"
            >
              <AnimatedIcon
                icon={Bell}
                animation="wiggle"
                className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover/btn:text-foreground"
              />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-88 sm:w-96 p-0 shadow-xl">
            {/* Header */}
            <DropdownMenuLabel className="flex items-center justify-between p-3.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => orgId && markAllReadMutation({ organizationId: orgId })}
                    className="h-7 px-2 text-xs text-primary hover:text-primary"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/settings?tab=notifications" title="Notification Settings">
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </DropdownMenuLabel>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/10 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory("tasks")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === "tasks"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveCategory("approvals")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === "approvals"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Approvals
              </button>
              <button
                onClick={() => setActiveCategory("comments")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeCategory === "comments"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Comments
              </button>
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-96 overflow-y-auto">
              <DropdownMenuGroup className="divide-y divide-border">
                {notifications === undefined ? (
                  <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="mb-2 h-7 w-7 text-muted-foreground/40" />
                    <p className="text-xs font-semibold">No notifications</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      You're all caught up on your workspace updates.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification: any) => (
                    <DropdownMenuItem
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-3.5 focus:bg-accent/50 cursor-pointer ${
                        !notification.isRead ? "bg-accent/25" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 rounded-full border bg-background p-1.5 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate text-foreground">
                            {notification.title}
                          </p>
                          <span className="text-[10px] whitespace-nowrap text-muted-foreground font-mono">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-1.5 shrink-0">
                          <Circle className="h-2 w-2 fill-primary text-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </ScrollArea>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
              <div className="p-2 border-t border-border flex items-center justify-between bg-muted/10 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => orgId && clearAllReadMutation({ organizationId: orgId })}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear read
                </Button>
                <Link
                  href="/settings?tab=notifications"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium pr-2"
                >
                  Preferences
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </div>
  )
}
