"use client"

import * as React from "react"
import {
  House,
  MessageSquare,
  CircleCheckBig,
  Signature,
  Bolt,
  Plus,
  FileText,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { TeamSwitcher } from "./team-switcher"
import { NavUser } from "./nav-user"
import { AnimatedIcon, type AnimationType } from "./animated-icon"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { CreateTaskDialog } from "../../app/(app)/tasks/components/create-task-dialog"

interface NavItem {
  title: string
  url: string
  icon: typeof House
  animation: AnimationType
}

const mainNavItems: NavItem[] = [
  {
    title: "Home",
    url: "/dashboard",
    icon: House,
    animation: "bounce",
  },
  {
    title: "Inbox",
    url: "/chats",
    icon: MessageSquare,
    animation: "wiggle",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CircleCheckBig,
    animation: "pop",
  },
  {
    title: "Approvals",
    url: "/approvals",
    icon: Signature,
    animation: "wiggle",
  },
  {
    title: "Forms",
    url: "/forms",
    icon: FileText,
    animation: "bounce",
  },
]

const settingsNavItem: NavItem = {
  title: "Settings",
  url: "/settings",
  icon: Bolt,
  animation: "spin",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [isCreateMenuOpen, setIsCreateMenuOpen] = React.useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false)

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50 py-3">
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent className="py-2">
        <div className="px-3 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsCreateMenuOpen(true)}
                tooltip="Create New"
                className="animate-icon-group group/btn flex h-10 cursor-pointer items-center justify-start gap-3 rounded-lg border border-primary/25 bg-primary/5 shadow-xs transition-all duration-300 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:scale-[1.01] hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors duration-300 group-hover/btn:bg-background group-hover/btn:text-primary">
                  <AnimatedIcon
                    icon={Plus}
                    animation="spin"
                    className="size-4 shrink-0"
                  />
                </div>
                <span className="text-xs font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
                  Create New
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarGroup>
          {/* <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground/75 uppercase tracking-wider">
            Platform
          </SidebarGroupLabel> */}
          <SidebarMenu className="mt-1 gap-1">
            {mainNavItems.map((item) => {
              const isActive = pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="animate-icon-group group/btn h-10 rounded-lg px-3 transition-all duration-200 hover:bg-primary/8 hover:text-primary data-[active=true]:bg-primary/12 data-[active=true]:text-primary"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <AnimatedIcon
                        icon={item.icon}
                        animation={item.animation}
                        className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover/btn:text-primary group-data-[active=true]/btn:text-primary"
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(settingsNavItem.url)}
                tooltip={settingsNavItem.title}
                className="animate-icon-group group/btn h-10 rounded-lg px-3 transition-all duration-200 hover:bg-primary/8 hover:text-primary data-[active=true]:bg-primary/12 data-[active=true]:text-primary"
              >
                <Link
                  href={settingsNavItem.url}
                  className="flex items-center gap-3"
                >
                  <AnimatedIcon
                    icon={settingsNavItem.icon}
                    animation={settingsNavItem.animation}
                    className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover/btn:text-primary group-data-[active=true]/btn:text-primary"
                  />
                  <span className="font-medium">{settingsNavItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 py-3">
        <NavUser
          user={{
            name: "User",
            email: "user@groundcontrol.com",
            avatar: "https://github.com/shadcn.png",
          }}
        />
      </SidebarFooter>
      <SidebarRail />

      {/* Create New Selection Dialog */}
      <Dialog open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
        <DialogContent className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-md sm:max-w-[480px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-base font-bold">
              Create New
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose what you would like to create in this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Create Task */}
            <button
              onClick={() => {
                setIsCreateMenuOpen(false)
                setIsCreateTaskOpen(true)
              }}
              className="group/item flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-5 text-center transition-all duration-200 outline-none hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="rounded-xl bg-primary/10 p-3.5 text-primary transition-transform duration-200 group-hover/item:scale-110">
                <CircleCheckBig className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Task
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Create to-do items
                </span>
              </div>
            </button>

            {/* Create Approval */}
            <button
              onClick={() => {
                setIsCreateMenuOpen(false)
                toast.info("Approvals creation coming soon!")
              }}
              className="group/item flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-5 text-center transition-all duration-200 outline-none hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="rounded-xl bg-primary/10 p-3.5 text-primary transition-transform duration-200 group-hover/item:scale-110">
                <Signature className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Approval
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Request sign-off
                </span>
              </div>
            </button>

            {/* Create Chat */}
            <button
              onClick={() => {
                setIsCreateMenuOpen(false)
                toast.info("New chat creation coming soon!")
              }}
              className="group/item flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-5 text-center transition-all duration-200 outline-none hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="rounded-xl bg-primary/10 p-3.5 text-primary transition-transform duration-200 group-hover/item:scale-110">
                <MessageSquare className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Chat
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Start a channel
                </span>
              </div>
            </button>

            {/* Create Form */}
            <Link
              href="/forms/new"
              onClick={() => setIsCreateMenuOpen(false)}
              className="group/item flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-5 text-center transition-all duration-200 outline-none hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="rounded-xl bg-primary/10 p-3.5 text-primary transition-transform duration-200 group-hover/item:scale-110">
                <FileText className="size-6" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Form
                </span>
                <span className="text-[9px] text-muted-foreground">
                  Build custom form
                </span>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Creation Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        setIsOpen={setIsCreateTaskOpen}
      />
    </Sidebar>
  )
}
