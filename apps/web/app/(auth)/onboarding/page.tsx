"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [orgName, setOrgName] = React.useState("")
  const [orgSlug, setOrgSlug] = React.useState("")
  const [selectedPlan, setSelectedPlan] = React.useState("free")
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("member")

  const { data: activeOrg } = authClient.useActiveOrganization()

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await authClient.organization.create({
        name: orgName,
        slug: orgSlug,
      })
      if (error) {
        console.error(error)
        alert(error.message)
      } else {
        await authClient.organization.setActive({ organizationId: data.id })
        setStep(2)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (e: React.FormEvent) => {
    e.preventDefault()
    // Demo: In a real app, this would redirect to a checkout page or update the org
    setStep(3)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrg) return
    setLoading(true)
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole as "member" | "admin",
        organizationId: activeOrg.id,
      })
      if (error) {
        console.error(error)
        alert(error.message)
      } else {
        alert(`Invite sent to ${inviteEmail}`)
        setInviteEmail("")
      }
    } finally {
      setLoading(false)
    }
  }

  const finishOnboarding = () => {
    router.push("/")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        {step === 1 && (
          <form onSubmit={handleCreateOrg}>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>Let's start by creating an organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value)
                    setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization Slug</Label>
                <Input
                  id="orgSlug"
                  placeholder="acme-inc"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || !orgName || !orgSlug}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSelectPlan}>
            <CardHeader>
              <CardTitle>Select a Plan</CardTitle>
              <CardDescription>Choose a plan that fits your needs (Demo).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <label className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted ${selectedPlan === "free" ? "border-primary bg-primary/5" : ""}`}>
                  <input
                    type="radio"
                    name="plan"
                    value="free"
                    checked={selectedPlan === "free"}
                    onChange={() => setSelectedPlan("free")}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">Free</h3>
                    <p className="text-sm text-muted-foreground">For small teams getting started.</p>
                  </div>
                  <div className="font-semibold">$0/mo</div>
                </label>

                <label className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted ${selectedPlan === "pro" ? "border-primary bg-primary/5" : ""}`}>
                  <input
                    type="radio"
                    name="plan"
                    value="pro"
                    checked={selectedPlan === "pro"}
                    onChange={() => setSelectedPlan("pro")}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">Pro</h3>
                    <p className="text-sm text-muted-foreground">For growing teams with more needs.</p>
                  </div>
                  <div className="font-semibold">$29/mo</div>
                </label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <form onSubmit={handleInvite}>
              <CardHeader>
                <CardTitle>Invite Team Members</CardTitle>
                <CardDescription>Invite people to join {activeOrg?.name || "your organization"}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <select
                    id="inviteRole"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" variant="secondary" className="w-full" disabled={loading || !inviteEmail}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite
                </Button>
              </CardContent>
            </form>
            <CardFooter>
              <Button type="button" onClick={finishOnboarding} className="w-full">
                Go to Dashboard
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  )
}
