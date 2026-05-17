"use client"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function OrganisationSettings() {
  const { data: activeOrg, isPending: isOrgPending } =
    authClient.useActiveOrganization()
  const { data: activeMember, isPending: isMemberPending } =
    authClient.useActiveMember()
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false)

  const isOwner = activeMember?.role === "owner"
  const isPending = isOrgPending || isMemberPending

  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name)
      setOrgSlug(activeOrg.slug)
    }
  }, [activeOrg])

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return
    setIsUpdatingOrg(true)
    try {
      if (activeOrg) {
        await authClient.organization.update({
          organizationId: activeOrg.id,
          data: {
            name: orgName,
            slug: orgSlug,
          },
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsUpdatingOrg(false)
    }
  }

  return (
    <Card className="w-full p-2 md:w-2/3 lg:w-1/2">
      <CardHeader className="p-0">
        <CardTitle className="p-0">Organization Details</CardTitle>
        <CardDescription className="p-0">
          Update your organization's general information.
        </CardDescription>
      </CardHeader>
      <form className="p-0" onSubmit={handleUpdateOrg}>
        <CardContent className="space-y-4 p-0">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
              disabled={isPending || !isOwner}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-inc"
              disabled={isPending || !isOwner}
            />
          </div>
          {!isPending && !isOwner && (
            <p className="text-xs text-destructive mt-2 animate-in fade-in duration-200">
              Only organization owners can modify organization details.
            </p>
          )}
        </CardContent>
        <CardFooter className="p-0">
          <Button
            className="mt-4"
            type="submit"
            disabled={isUpdatingOrg || isPending || !activeOrg || !isOwner}
          >
            {isUpdatingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
