"use client"
import { Building, CreditCard, Users, Loader2 } from "lucide-react"
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
import { Toaster } from "@workspace/ui/components/sonner"
import { router } from "better-auth/api"
import { useRouter, useSearchParams } from "next/navigation"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

type PageProps = {
  searchParams: Promise<{
    tab?: string
  }>
}

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
      {/* <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div> */}

      <Tabs
        defaultValue={tab || "organization"}
        value={tab}
        onValueChange={handleTabChange}
        className="space-y-2"
      >
        <TabsList
          className={cn(
            "min-h-12 w-full max-w-md [scrollbar-width:none] scrollbar-none flex-nowrap justify-start overflow-x-auto [-ms-overflow-style:none] md:min-h-fit md:w-fit [&::-webkit-scrollbar]:hidden",
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
            value="subscription"
            className="flex shrink-0 items-center gap-2"
          >
            <CreditCard
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span className="">Organization</span>}
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="flex shrink-0 items-center gap-2"
          >
            <Users
              className={cn("h-4 w-4", { "size-4": isMobile })}
              strokeWidth={1}
            />
            {!isMobile && <span className="">Organization</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-2">
          <OrganisationSettings />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <MemberSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
