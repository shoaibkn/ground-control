"use client"

import * as React from "react"
import {
  House,
  MessageSquare,
  CircleCheckBig,
  Signature,
  Bolt,
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
  SidebarSeparator,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"

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
]

const settingsNavItem: NavItem = {
  title: "Settings",
  url: "/settings",
  icon: Bolt,
  animation: "spin",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50 py-3">
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarMenuButton asChild className="border">
          <Button className="h-10" variant={"outline"}>
            Create New
          </Button>
        </SidebarMenuButton>
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
                    className="animate-icon-group group/btn h-10 rounded-lg px-3 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <AnimatedIcon
                        icon={item.icon}
                        animation={item.animation}
                        className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover/btn:text-sidebar-accent-foreground group-data-[active=true]/btn:text-sidebar-accent-foreground"
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-3 my-2" />

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(settingsNavItem.url)}
                tooltip={settingsNavItem.title}
                className="animate-icon-group group/btn h-10 rounded-lg px-3 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
              >
                <Link
                  href={settingsNavItem.url}
                  className="flex items-center gap-3"
                >
                  <AnimatedIcon
                    icon={settingsNavItem.icon}
                    animation={settingsNavItem.animation}
                    className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover/btn:text-sidebar-accent-foreground group-data-[active=true]/btn:text-sidebar-accent-foreground"
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
    </Sidebar>
  )
}
