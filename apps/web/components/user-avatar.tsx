"use client"

import { useQuery } from "convex/react"
import { api } from "../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/ui/components/tooltip"
import { getAvatarUrl } from "@workspace/ui/lib/utils"

interface UserAvatarProps {
  userId?: string
  user?: { name?: string; email?: string; image?: string; id?: string }
  className?: string
  avatarClassName?: string
  tooltipSide?: "top" | "bottom" | "left" | "right"
  showName?: boolean
}

export function UserAvatar({
  userId,
  user,
  className = "",
  avatarClassName = "",
  tooltipSide = "top",
  showName = false,
}: UserAvatarProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()

  // 1. Resolve user details (name, email, image)
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
  let designation: string | undefined = undefined
  if (resolvedUser && activeOrg?.members && profiles) {
    const member = activeOrg.members.find(
      (m: any) => m.userId === userId || m.userId === resolvedUser?.id || m.userId === resolvedUser?._id
    )
    if (member) {
      const profile = profiles.find((p: any) => p.memberId === member.id)
      if (profile) {
        const position = profile.position
        const department = profile.department
        if (position && department) {
          designation = `${position}, ${department}`
        } else {
          designation = position || department
        }
      }
    }
  }

  const name = resolvedUser?.name || "Unknown User"
  const email = resolvedUser?.email
  const image = resolvedUser?.image

  const avatarElement = (
    <Avatar className={`h-6 w-6 border border-card shadow-xs shrink-0 select-none ${avatarClassName}`}>
      <AvatarImage src={getAvatarUrl(image, name)} />
      <AvatarFallback className="text-[9px] bg-accent text-accent-foreground font-semibold">
        {name.charAt(0) || "U"}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {showName ? (
          <div className={`flex items-center gap-1.5 cursor-pointer ${className}`}>
            {avatarElement}
            <span className="text-xs font-medium text-foreground/80 truncate">
              {name}
            </span>
          </div>
        ) : (
          <div className={`cursor-pointer ${className}`}>
            {avatarElement}
          </div>
        )
      }
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        className="flex flex-col gap-0.5 p-2 bg-popover text-popover-foreground border shadow-md z-50 min-w-[120px]"
      >
        <span className="font-semibold text-xs text-foreground/95">{name}</span>
        {designation && (
          <span className="text-[10px] font-medium text-primary leading-tight">
            {designation}
          </span>
        )}
        {email && <span className="text-[10px] text-muted-foreground">{email}</span>}
      </TooltipContent>
    </Tooltip>
  )
}
