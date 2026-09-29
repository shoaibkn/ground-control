"use client"
import { Building, CreditCard, Users, Bell, AlarmClock } from "lucide-react"
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
import RemindersSettings from "./components/settings-reminders"
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
    <div className="flex flex-1 flex-col gap-4 p-1 md:p-2">
      <Toaster />

      <Tabs
        defaultValue={tab || "organization"}
        value={tab}
        onValueChange={handleTabChange}
        className="flex flex-col gap-2"
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
            <Building className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Organization</span>}
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="flex shrink-0 items-center gap-2"
          >
            <Users className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Members</span>}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex shrink-0 items-center gap-2"
          >
            <Bell className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Notifications</span>}
          </TabsTrigger>
          <TabsTrigger
            value="reminders"
            className="flex shrink-0 items-center gap-2"
          >
            <AlarmClock className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Task Reminders</span>}
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="flex shrink-0 items-center gap-2"
          >
            <Users className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Permissions</span>}
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="flex shrink-0 items-center gap-2"
          >
            <CreditCard className="size-4" strokeWidth={1.5} />
            {!isMobile && <span>Subscription</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="flex flex-col gap-2">
          <OrganisationSettings />
        </TabsContent>

        <TabsContent value="members" className="flex flex-col gap-4">
          <MemberSettings />
        </TabsContent>

        <TabsContent value="notifications" className="flex flex-col gap-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="reminders" className="flex flex-col gap-4">
          <RemindersSettings />
        </TabsContent>

        <TabsContent value="permissions" className="flex flex-col gap-4">
          <PermissionsSettings />
        </TabsContent>

        <TabsContent value="subscription" className="flex flex-col gap-4">
          <SubscriptionSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
