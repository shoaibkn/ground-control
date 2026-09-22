"use client"

import { authClient } from "@/lib/auth-client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { getAvatarUrl } from "@workspace/ui/lib/utils"
import { AvatarHoverCard } from "./avatar-hover-card"

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

  const name = resolvedUser?.name || "Unknown User"
  const image = resolvedUser?.image

  const avatarElement = (
    <Avatar
      className={`h-6 w-6 shrink-0 border border-card shadow-xs select-none ${avatarClassName}`}
    >
      <AvatarImage src={getAvatarUrl(image, name)} />
      <AvatarFallback className="bg-accent text-[9px] font-semibold text-accent-foreground">
        {name.charAt(0) || "U"}
      </AvatarFallback>
    </Avatar>
  )

  const content = showName ? (
    <div className={`flex cursor-pointer items-center gap-1.5 ${className}`}>
      {avatarElement}
      <span className="truncate text-xs font-medium text-foreground/80">
        {name}
      </span>
    </div>
  ) : (
    <div className={`cursor-pointer ${className}`}>{avatarElement}</div>
  )

  return (
    <AvatarHoverCard
      userId={userId}
      user={resolvedUser}
      tooltipSide={tooltipSide}
    >
      {content}
    </AvatarHoverCard>
  )
}
