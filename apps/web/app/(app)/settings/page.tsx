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

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-1 md:p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="organization" className="space-y-2">
        <TabsList className="w-full justify-start md:w-fit">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
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
      </Tabs>
    </div>
  )
}
