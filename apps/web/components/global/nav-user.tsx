"use client"

import { useState } from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Building,
  Plus,
  Check,
  Sun,
  Moon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@workspace/ui/components/sheet"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

const dummyNotifications = [
  {
    id: "1",
    title: "Welcome to Ground Control",
    description: "Get started by checking out your organization settings.",
    time: "2 mins ago",
  },
  {
    id: "2",
    title: "Profile Updated",
    description: "Sarah Jenkins updated her position to Lead Developer.",
    time: "1 hour ago",
  },
]

export function NavUser({
  user: initialUser,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  const { data: organizations } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const user = (session?.user ?? initialUser) as any

  const [showNotifications, setShowNotifications] = useState(false)
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [showOrgDialog, setShowOrgDialog] = useState(false)
  const [notifications, setNotifications] = useState(dummyNotifications)

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in")
        },
      },
    })
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image ?? user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <Sparkles className="size-4" />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <BadgeCheck className="size-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="size-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotifications(true)} className="cursor-pointer">
                  <Bell className="size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowThemeDialog(true)} className="cursor-pointer">
                  {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  Theme Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowOrgDialog(true)} className="cursor-pointer">
                  <Building className="size-4" />
                  Switch Organization
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Notifications Sheet */}
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent className="flex h-full w-80 flex-col p-6 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <span>Recent Notifications</span>
            </SheetTitle>
            <SheetDescription>
              Stay updated with your latest task and organization events.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                <Bell className="mb-2 size-8 opacity-50" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No new notifications.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="cursor-pointer space-y-1 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-xs text-foreground">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs leading-normal text-muted-foreground">
                    {n.description}
                  </p>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <SheetFooter className="mt-auto border-t pt-4">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setNotifications([])}
              >
                Clear All Notifications
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Theme Selection Dialog */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resolvedTheme === "dark" ? (
                <Moon className="size-5 text-primary" />
              ) : (
                <Sun className="size-5 text-primary" />
              )}
              <span>Select Theme</span>
            </DialogTitle>
            <DialogDescription>
              Customize the appearance of the application. Choose between light,
              dark, or system modes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {[
              { id: "light", name: "Light", icon: Sun },
              { id: "dark", name: "Dark", icon: Moon },
              { id: "system", name: "System", icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon
              const isSelected =
                resolvedTheme === t.id ||
                (t.id === "system" &&
                  !["light", "dark"].includes(resolvedTheme || ""))
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all hover:bg-accent hover:text-accent-foreground",
                    isSelected
                      ? "border-primary bg-primary/5 font-medium text-primary"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-xs">{t.name}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Switch Organization Dialog */}
      <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="size-5 text-primary" />
              <span>Switch Organization</span>
            </DialogTitle>
            <DialogDescription>
              Switch between your workspaces or create a new organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto py-4 pr-1">
            {organizations?.map((org) => {
              const isSelected = activeOrg?.id === org.id
              return (
                <button
                  key={org.id}
                  onClick={async () => {
                    await authClient.organization.setActive({
                      organizationId: org.id,
                    })
                    setShowOrgDialog(false)
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all hover:bg-accent",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border text-sm font-semibold",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {org.name?.[0]?.toUpperCase() || "O"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {org.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {org.slug}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
          <div className="border-t pt-4">
            <Button
              onClick={() => {
                setShowOrgDialog(false)
                router.push("/onboarding")
              }}
              variant="outline"
              className="w-full gap-2 text-xs"
            >
              <Plus className="size-4" />
              <span>Create New Organization</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
