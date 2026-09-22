"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@workspace/ui/components/hover-card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { getAvatarUrl } from "@workspace/ui/lib/utils"
import { Plus } from "lucide-react"

interface TaskParticipantsHoverCardProps {
  task: {
    creatorId: string
    assigneeIds: string[]
    collaboratorIds?: string[]
    subscriberIds?: string[]
  }
}

export function TaskParticipantsHoverCard({
  task,
}: TaskParticipantsHoverCardProps) {
  const { data: activeOrg } = authClient.useActiveOrganization()

  const profiles = useQuery(
    api.memberProfiles.getOrganizationProfiles,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  if (!activeOrg) return null

  // Helper to resolve user info & profile from activeOrg.members and profiles
  const resolveParticipant = (userId: string) => {
    const member = activeOrg.members?.find((m: any) => m.userId === userId)
    if (!member) return null

    const profile = profiles?.find(
      (p: any) => p.memberId === member.userId || p.memberId === member.id
    )

    return {
      userId,
      name: member.user?.name || "Unknown User",
      email: member.user?.email,
      image: member.user?.image,
      position: profile?.position,
      department: profile?.department,
    }
  }

  const creator = resolveParticipant(task.creatorId)
  const assignees = task.assigneeIds
    .map(resolveParticipant)
    .filter((p): p is NonNullable<typeof p> => p !== null)
  const collaborators = (task.collaboratorIds || [])
    .map(resolveParticipant)
    .filter((p): p is NonNullable<typeof p> => p !== null)
  const subscribers = (task.subscriberIds || [])
    .map(resolveParticipant)
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const renderParticipantRow = (p: any) => {
    if (!p) return null
    return (
      <div
        key={p.userId}
        className="flex items-start gap-2 border-b border-border/20 py-1 last:border-0"
      >
        <Avatar className="mt-0.5 h-6 w-6 shrink-0 border border-card shadow-xs select-none">
          <AvatarImage src={getAvatarUrl(p.image, p.name)} />
          <AvatarFallback className="bg-accent text-[8px] font-semibold text-accent-foreground">
            {p.name.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[11px] font-semibold text-foreground">
            {p.name}
          </span>
          {p.email && (
            <span className="block truncate text-[9px] leading-none text-muted-foreground">
              {p.email}
            </span>
          )}
          {(p.position || p.department) && (
            <div className="mt-0.5 flex items-center gap-1 truncate text-[9px] leading-none text-muted-foreground/80">
              {p.position && (
                <span className="truncate font-semibold text-primary">
                  {p.position}
                </span>
              )}
              {p.position && p.department && (
                <span className="text-muted-foreground/40 select-none">•</span>
              )}
              {p.department && <span className="truncate">{p.department}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div className="flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-accent text-accent-foreground shadow-xs transition-transform select-none hover:translate-y-[-2px] hover:bg-accent/90">
          <Plus className="h-3 w-3" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="z-50 flex max-h-[280px] w-72 flex-col rounded-xl border border-border/60 bg-popover/95 p-2.5 text-popover-foreground shadow-lg backdrop-blur-md"
      >
        <div className="mb-1.5 shrink-0 border-b border-border pb-1.5 text-[10px] font-bold tracking-wider text-foreground/80 uppercase">
          Task Participants
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {/* Creator */}
          {creator && (
            <div>
              <span className="mb-1 block text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                Created By
              </span>
              {renderParticipantRow(creator)}
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div>
              <span className="mb-1 block text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                Assignees ({assignees.length})
              </span>
              <div className="space-y-0.5">
                {assignees.map(renderParticipantRow)}
              </div>
            </div>
          )}

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div>
              <span className="mb-1 block text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                Collaborators ({collaborators.length})
              </span>
              <div className="space-y-0.5">
                {collaborators.map(renderParticipantRow)}
              </div>
            </div>
          )}

          {/* Subscribers */}
          {subscribers.length > 0 && (
            <div>
              <span className="mb-1 block text-[9px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                Subscribers ({subscribers.length})
              </span>
              <div className="space-y-0.5">
                {subscribers.map(renderParticipantRow)}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
