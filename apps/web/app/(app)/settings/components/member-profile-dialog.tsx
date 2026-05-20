"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

export function MemberProfileDialog({
  isOpen,
  setIsOpen,
  memberId,
  organizationId,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  memberId: string | null
  organizationId: string | null
}) {
  const isMobile = useIsMobile()

  // Use Convex hooks
  const profile = useQuery(
    api.memberProfiles.getProfile,
    memberId && organizationId ? { memberId, organizationId } : "skip"
  )
  const upsertProfile = useMutation(api.memberProfiles.upsertProfile)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    address: "",
    position: "",
    department: "",
    phoneNumber: "",
  })
  const [integrations, setIntegrations] = useState({
    sms: false,
    rcs: false,
    whatsapp: false,
  })

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        address: profile.address || "",
        position: profile.position || "",
        department: profile.department || "",
        phoneNumber: profile.phoneNumber || "",
      })
      setIntegrations({
        sms: profile.integrations?.sms || false,
        rcs: profile.integrations?.rcs || false,
        whatsapp: profile.integrations?.whatsapp || false,
      })
    } else {
      setFormData({
        address: "",
        position: "",
        department: "",
        phoneNumber: "",
      })
      setIntegrations({ sms: false, rcs: false, whatsapp: false })
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId || !organizationId) return

    setIsLoading(true)
    try {
      await upsertProfile({
        memberId,
        organizationId,
        address: formData.address,
        position: formData.position,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        integrations,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to update profile", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntegrationChange = (
    key: keyof typeof integrations,
    checked: boolean
  ) => {
    setIntegrations((prev) => ({ ...prev, [key]: checked }))
  }

  const content = (
    <>
      <form
        id="member-profile-form"
        onSubmit={handleSave}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            placeholder="e.g. Engineering"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="+1 234 567 890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="123 Main St"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-4 text-sm font-semibold">Integrations</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="sms-integration"
                className="flex flex-col items-start gap-1"
              >
                <span>SMS</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Enable SMS notifications
                </span>
              </Label>
              <Switch
                id="sms-integration"
                checked={integrations.sms}
                onCheckedChange={(checked) =>
                  handleIntegrationChange("sms", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="rcs-integration"
                className="flex flex-col items-start gap-1"
              >
                <span>RCS</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Enable RCS messages
                </span>
              </Label>
              <Switch
                id="rcs-integration"
                checked={integrations.rcs}
                onCheckedChange={(checked) =>
                  handleIntegrationChange("rcs", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="whatsapp-integration"
                className="flex flex-col items-start gap-1"
              >
                <span>WhatsApp</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Enable WhatsApp integration
                </span>
              </Label>
              <Switch
                id="whatsapp-integration"
                checked={integrations.whatsapp}
                onCheckedChange={(checked) =>
                  handleIntegrationChange("whatsapp", checked)
                }
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Manage Member Profile</SheetTitle>
            <SheetDescription>
              Update member details and manage their active integrations.
            </SheetDescription>
          </SheetHeader>
          {profile === undefined && memberId ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            content
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Member Profile</DialogTitle>
          <DialogDescription>
            Update member details and manage their active integrations.
          </DialogDescription>
        </DialogHeader>
        {profile === undefined && memberId ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          content
        )}
      </DialogContent>
    </Dialog>
  )
}
