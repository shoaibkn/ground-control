"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@workspace/ui/components/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
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

export function TaskParticipantsHoverCard({ task }: TaskParticipantsHoverCardProps) {
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

    const profile = profiles?.find((p: any) => p.memberId === member.userId || p.memberId === member.id)

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
  const assignees = task.assigneeIds.map(resolveParticipant).filter((p): p is NonNullable<typeof p> => p !== null)
  const collaborators = (task.collaboratorIds || []).map(resolveParticipant).filter((p): p is NonNullable<typeof p> => p !== null)
  const subscribers = (task.subscriberIds || []).map(resolveParticipant).filter((p): p is NonNullable<typeof p> => p !== null)

  const renderParticipantRow = (p: any) => {
    if (!p) return null
    return (
      <div key={p.userId} className="flex gap-2 items-start py-1 border-b border-border/20 last:border-0">
        <Avatar className="h-6 w-6 border border-card shadow-xs shrink-0 select-none mt-0.5">
          <AvatarImage src={getAvatarUrl(p.image, p.name)} />
          <AvatarFallback className="text-[8px] bg-accent text-accent-foreground font-semibold">
            {p.name.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <span className="text-[11px] font-semibold text-foreground truncate block">{p.name}</span>
          {p.email && (
            <span className="text-[9px] text-muted-foreground truncate block leading-none">{p.email}</span>
          )}
          {(p.position || p.department) && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground/80 mt-0.5 truncate leading-none">
              {p.position && <span className="text-primary font-semibold truncate">{p.position}</span>}
              {p.position && p.department && <span className="text-muted-foreground/40 select-none">•</span>}
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
        <div className="h-5.5 w-5.5 rounded-full border-2 border-card bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center shadow-xs cursor-pointer hover:translate-y-[-2px] transition-transform select-none">
          <Plus className="h-3 w-3" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="w-72 p-2.5 border border-border/60 shadow-lg z-50 bg-popover/95 backdrop-blur-md text-popover-foreground rounded-xl flex flex-col max-h-[280px]"
      >
        <div className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider border-b border-border pb-1.5 mb-1.5 shrink-0">
          Task Participants
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {/* Creator */}
          {creator && (
            <div>
              <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider block mb-1">
                Created By
              </span>
              {renderParticipantRow(creator)}
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div>
              <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider block mb-1">
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
              <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider block mb-1">
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
              <span className="text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider block mb-1">
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
