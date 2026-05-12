"use client"

import { useState, useEffect } from "react"
import { Building, CreditCard, Users, Loader2 } from "lucide-react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"

export default function SettingsPage() {
  const { data: activeOrg, isPending: isOrgPending } =
    authClient.useActiveOrganization()

  // Organization form state
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false)

  // Member invite state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [isInviting, setIsInviting] = useState(false)

  // Handlers
  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    try {
      if (activeOrg) {
        await authClient.organization.inviteMember({
          organizationId: activeOrg.id,
          email: inviteEmail,
          role: inviteRole,
        })
        setInviteEmail("")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsInviting(false)
    }
  }

  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name)
      setOrgSlug(activeOrg.slug)
    }
  }, [activeOrg])

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
          <Card className="p-2">
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
                    disabled={isOrgPending}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-inc"
                    disabled={isOrgPending}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <Button
                  className="mt-4"
                  type="submit"
                  disabled={isUpdatingOrg || isOrgPending || !activeOrg}
                >
                  {isUpdatingOrg && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
              <CardDescription>
                Invite a new member to your organization.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleInviteMember}>
              <CardContent className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="email" className="sr-only">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full space-y-1 sm:w-[200px]">
                  <Label htmlFor="role" className="sr-only">
                    Role
                  </Label>
                  <select
                    id="role"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "member" | "admin")
                    }
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isInviting || !inviteEmail || !activeOrg}
                >
                  {isInviting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Invite
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                Manage members of your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOrgPending ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeOrg?.members?.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.user?.image || undefined}
                              />
                              <AvatarFallback>
                                {member.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {member.user?.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {member.user?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.role === "owner" ||
                                member.role === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!activeOrg?.members ||
                        activeOrg.members.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            No members found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for exploring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  $0
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">✓ 1 Member limit</li>
                  <li className="flex items-center">✓ Basic support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>For growing teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  $19
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">✓ Up to 10 Members</li>
                  <li className="flex items-center">✓ Priority support</li>
                  <li className="flex items-center">✓ Advanced analytics</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Upgrade to Pro</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  $99
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">✓ Unlimited Members</li>
                  <li className="flex items-center">
                    ✓ 24/7 dedicated support
                  </li>
                  <li className="flex items-center">✓ Custom integrations</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
