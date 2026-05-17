"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const invitationId = searchParams.get("id")

  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const [invite, setInvite] = useState<any>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [acceptSuccess, setAcceptSuccess] = useState(false)

  // Fetch invitation details on mount (only if authenticated)
  useEffect(() => {
    if (sessionLoading) return

    if (!invitationId) {
      setInviteError("No invitation ID was provided in the link.")
      setLoadingInvite(false)
      return
    }

    if (!session) {
      // User is not logged in, so skip fetching invitation details
      // as getInvitation requires authentication. We will show the login prompt.
      setLoadingInvite(false)
      return
    }

    const fetchInvite = async () => {
      setLoadingInvite(true)
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        })
        if (error) {
          console.error("Error fetching invite:", error)
          setInviteError(error.message || "Failed to load invitation details. The invite may have expired or been canceled.")
        } else {
          setInvite(data)
        }
      } catch (err: any) {
        console.error(err)
        setInviteError("An unexpected error occurred while loading the invitation.")
      } finally {
        setLoadingInvite(false)
      }
    }

    fetchInvite()
  }, [invitationId, session, sessionLoading])

  const handleAccept = async () => {
    if (!invitationId) return
    setAccepting(true)
    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) {
        console.error("Error accepting invite:", error)
        setInviteError(error.message || "Failed to accept the invitation.")
      } else {
        setAcceptSuccess(true)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    } catch (err: any) {
      console.error(err)
      setInviteError("An unexpected error occurred while accepting the invitation.")
    } finally {
      setAccepting(false)
    }
  }

  const handleRedirectToLogin = () => {
    router.push(`/sign-in?redirectTo=${encodeURIComponent(window.location.href)}`)
  }

  const handleRedirectToSignUp = () => {
    router.push(`/sign-up?redirectTo=${encodeURIComponent(window.location.href)}`)
  }

  // 1. Loading state
  if (loadingInvite || sessionLoading) {
    return (
      <Card className="w-full max-w-md border-muted bg-background/50 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading invitation details...
          </p>
        </CardContent>
      </Card>
    )
  }

  // 2. Error state
  if (inviteError) {
    return (
      <Card className="w-full max-w-md border-destructive/20 bg-background/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive font-bold">
            Invitation Error
          </CardTitle>
          <CardDescription>
            We encountered a problem with your invitation link.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6 pt-0 text-sm text-muted-foreground font-medium">
          {inviteError}
        </CardContent>
        <CardFooter className="flex justify-center p-6 border-t border-border/20">
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // 3. Success state
  if (acceptSuccess) {
    return (
      <Card className="w-full max-w-md border-emerald-500/20 bg-background/50 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <CardTitle className="text-xl font-bold text-center">
            Invitation Accepted!
          </CardTitle>
          <p className="text-sm text-center text-muted-foreground font-medium">
            Welcome to the team. Redirecting you to the dashboard...
          </p>
        </CardContent>
      </Card>
    )
  }

  // 4. User not logged in state
  if (!session) {
    return (
      <Card className="w-full max-w-md border-muted bg-background/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">
            Join Organization
          </CardTitle>
          <CardDescription>
            You must be signed in to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6 pt-0 text-sm text-muted-foreground leading-relaxed">
          Please sign in or create an account to accept the invitation. If you do not have an account yet, you can create one in seconds.
        </CardContent>
        <CardFooter className="flex flex-col gap-2 p-6 border-t border-border/20">
          <Button onClick={handleRedirectToLogin} className="w-full">
            Sign In to Accept
          </Button>
          <Button variant="outline" onClick={handleRedirectToSignUp} className="w-full">
            Create an Account
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // 5. Ready to accept state
  return (
    <Card className="w-full max-w-md border-muted bg-background/50 backdrop-blur-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">
          Organization Invitation
        </CardTitle>
        <CardDescription>
          You have been invited to join a team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0 text-center">
        <div className="rounded-lg bg-muted/30 p-4 border border-border/40 space-y-2">
          <p className="text-sm text-muted-foreground">
            Invited to join:
          </p>
          <p className="text-lg font-bold text-foreground">
            {invite?.organizationName || "Organization"}
          </p>
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
            Role: {invite?.role || "Member"}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Logged in as: <span className="font-semibold text-foreground">{session.user.email}</span>
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-6 border-t border-border/20">
        <Button onClick={handleAccept} disabled={accepting} className="w-full">
          {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Accept and Join
        </Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full text-muted-foreground hover:text-foreground">
          Decline / Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/20 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md border-muted bg-background/50 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading...
            </p>
          </CardContent>
        </Card>
      }>
        <AcceptInvitationContent />
      </Suspense>
    </div>
  )
}
