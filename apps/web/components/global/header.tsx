"use client"

import { useState } from "react"
import {
  Bell,
  Check,
  Circle,
  Info,
  User,
  Settings,
  AlertTriangle,
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

interface Notification {
  id: string
  title: string
  description: string
  time: string
  type: "info" | "success" | "user" | "alert"
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to Ground Control",
    description: "Get started by checking out your organization settings.",
    time: "2 mins ago",
    type: "info",
    read: false,
  },
  {
    id: "2",
    title: "Profile Updated",
    description: "Sarah Jenkins updated her position to Lead Developer.",
    time: "1 hour ago",
    type: "user",
    read: false,
  },
  {
    id: "3",
    title: "WhatsApp Integrated",
    description: "The WhatsApp integration has been successfully connected.",
    time: "3 hours ago",
    type: "success",
    read: true,
  },
  {
    id: "4",
    title: "Subscription Renewal",
    description: "Your Starter Plan subscription was successfully renewed.",
    time: "Yesterday",
    type: "success",
    read: true,
  },
]

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    )
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <Check className="h-4 w-4 text-emerald-500" />
      case "user":
        return <User className="h-4 w-4 text-orange-500" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />
    }
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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <DropdownMenuLabel className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Notifications</span>
                <span className="text-xs font-normal text-muted-foreground">
                  You have {unreadCount} unread message{unreadCount !== 1 && "s"}
                </span>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs text-primary hover:text-primary"
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            <ScrollArea className="max-h-80 overflow-y-auto">
              <DropdownMenuGroup className="divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs text-muted-foreground">
                      We'll let you know when something arrives.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => toggleRead(notification.id)}
                      className={`flex items-start gap-3 p-4 focus:bg-accent/50 ${
                        !notification.read ? "bg-accent/20" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 rounded-full border bg-background p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-1.5 shrink-0">
                          <Circle className="h-2 w-2 fill-primary text-primary" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </div>
  )
}