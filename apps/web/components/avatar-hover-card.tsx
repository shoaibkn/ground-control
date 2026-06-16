"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@workspace/ui/components/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { getAvatarUrl } from "@workspace/ui/lib/utils"

interface AvatarHoverCardProps {
  userId?: string
  user?: { name?: string; email?: string; image?: string; id?: string; _id?: string }
  children: React.ReactNode
  tooltipSide?: "top" | "bottom" | "left" | "right"
}

export function AvatarHoverCard({
  userId,
  user,
  children,
  tooltipSide = "top",
}: AvatarHoverCardProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()

  // 1. Resolve user details (name, email)
  let resolvedUser: any = user
  if (!resolvedUser && userId && activeOrg?.members) {
    resolvedUser = activeOrg.members.find((m: any) => m.userId === userId)?.user
  }

  // 2. Fetch designations from memberProfiles table in Convex
  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  // 3. Find designation for this member
  let position: string | undefined = undefined
  let department: string | undefined = undefined
  if (resolvedUser && activeOrg?.members && profiles) {
    const member = activeOrg.members.find((m: any) => {
      const mEmail = m.user?.email?.toLowerCase()
      const rEmail = resolvedUser?.email?.toLowerCase()
      return (
        (userId && m.userId === userId) ||
        (resolvedUser?.id && m.userId === resolvedUser.id) ||
        (resolvedUser?._id && m.userId === resolvedUser._id) ||
        (rEmail && mEmail === rEmail)
      )
    })
    if (member) {
      const profile = profiles.find((p: any) => p.memberId === member.userId || p.memberId === member.id)
      if (profile) {
        position = profile.position
        department = profile.department
      }
    }
  }

  const name = resolvedUser?.name || "Unknown User"
  const email = resolvedUser?.email

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const member = activeOrg?.members?.find((m: any) => {
        const mEmail = m.user?.email?.toLowerCase()
        const rEmail = resolvedUser?.email?.toLowerCase()
        return (
          (userId && m.userId === userId) ||
          (resolvedUser?.id && m.userId === resolvedUser.id) ||
          (resolvedUser?._id && m.userId === resolvedUser._id) ||
          (rEmail && mEmail === rEmail)
        )
      })
      const profile = member && profiles ? profiles.find((p: any) => p.memberId === member.userId || p.memberId === member.id) : null
      console.log("Hovered memberProfile Data:", {
        userId,
        name,
        email,
        member,
        profile,
      })
    }
  }

  return (
    <HoverCard openDelay={200} closeDelay={150} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={tooltipSide}
        className="w-48 p-2 border border-border/60 shadow-md z-50 bg-popover/95 backdrop-blur-md text-popover-foreground rounded-xl"
      >
        <div className="flex gap-2 items-start">
          <Avatar className="h-7 w-7 border border-card shadow-xs shrink-0 select-none mt-0.5">
            <AvatarImage src={getAvatarUrl(resolvedUser?.image, name)} />
            <AvatarFallback className="text-[10px] bg-accent text-accent-foreground font-semibold">
              {name.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 flex flex-col">
            <span className="text-xs font-semibold text-foreground truncate leading-tight">
              {name}
            </span>
            {email && (
              <span className="text-[9px] text-muted-foreground/90 truncate leading-normal mt-0.5">
                {email}
              </span>
            )}
            {(position || department) && (
              <div className="mt-1.5 pt-1 border-t border-border/40 flex flex-col gap-0.5 leading-normal">
                {position && (
                  <span className="text-[9.5px] font-semibold text-primary truncate">
                    {position}
                  </span>
                )}
                {department && (
                  <span className="text-[8.5px] font-medium text-muted-foreground/80 truncate">
                    {department}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
