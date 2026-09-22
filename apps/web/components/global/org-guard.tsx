"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: orgs, isPending } = authClient.useListOrganizations()

  useEffect(() => {
    if (!isPending && orgs !== null && orgs.length === 0) {
      router.push("/onboarding")
    }
  }, [isPending, orgs, router])

  if (isPending || (orgs !== null && orgs.length === 0)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
