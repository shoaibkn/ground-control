"use client"
import { Building, CreditCard, Users, Bell } from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import OrganisationSettings from "./components/settings-organisation"
import MemberSettings from "./components/settings-member"
import SubscriptionSettings from "./components/settings-subscription"
import PermissionsSettings from "./components/settings-permissions"
import NotificationSettings from "./components/settings-notifications"
import { Toaster } from "@workspace/ui/components/sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

export default function SettingsPage() {
  const searchParams = useSearchParams()

  const tab = searchParams.get("tab") || "organization"
  const isMobile = useIsMobile()

  const router = useRouter()
  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`)
  }

  return (
    <div className="flex-1 space-y-4 p-1 md:p-2">
      <Toaster />

      <Tabs
        defaultValue={tab || "organization"}
        value={tab}
        onValueChange={handleTabChange}
        className="space-y-2"
      >
        <TabsList
          className={cn(
            "min-h-12 w-full max-w-2xl [scrollbar-width:none] scrollbar-none flex-nowrap justify-start overflow-x-auto [-ms-overflow-style:none] md:min-h-fit md:w-fit [&::-webkit-scrollbar]:hidden",
            { "mx-auto": isMobile }
          )}
        >
          <TabsTrigger
            value="organization"
            className="flex shrink-0 items-center gap-2 md:h-fit"
          >
            <Building
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span>Organization</span>}
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="flex shrink-0 items-center gap-2"
          >
            <Users
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span>Members</span>}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex shrink-0 items-center gap-2"
          >
            <Bell
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span>Notifications</span>}
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="flex shrink-0 items-center gap-2"
          >
            <Users
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span>Permissions</span>}
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="flex shrink-0 items-center gap-2"
          >
            <CreditCard
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span>Subscription</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-2">
          <OrganisationSettings />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <MemberSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
