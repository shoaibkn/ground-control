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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"
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
    <Card className="w-full md:w-2/3 lg:w-1/2">
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Update your organization's general information.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdateOrg}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc."
                disabled={isPending || !isOwner}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="acme-inc"
                disabled={isPending || !isOwner}
              />
            </Field>
            {!isPending && !isOwner && (
              <Alert variant="destructive">
                <AlertDescription>
                  Only organization owners can modify organization details.
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={isUpdatingOrg || isPending || !activeOrg || !isOwner}
          >
            {isUpdatingOrg && <Spinner data-icon="inline-start" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
