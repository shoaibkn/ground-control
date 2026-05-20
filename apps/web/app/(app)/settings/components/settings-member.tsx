"use client"
import { authClient } from "@/lib/auth-client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Loader2,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Eye,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { MemberProfileDialog } from "./member-profile-dialog"

export default function MemberSettings() {
  const {
    data: activeOrg,
    isPending: isOrgPending,
    refetch,
  } = authClient.useActiveOrganization()
  const { data: activeMember, isPending: isMemberPending } =
    authClient.useActiveMember()
  const { data: session } = authClient.useSession()

  const canInvite =
    activeMember?.role === "owner" || activeMember?.role === "admin"
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [isInviting, setIsInviting] = useState(false)

  // Search and pagination states for invitations
  const [inviteSearch, setInviteSearch] = useState("")
  const [invitePage, setInvitePage] = useState(1)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(
    null
  )
  const [roleChangingInviteId, setRoleChangingInviteId] = useState<
    string | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Member management states
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileDialogMemberId, setProfileDialogMemberId] = useState<
    string | null
  >(null)
  const [memberSearch, setMemberSearch] = useState("")
  const [memberPage, setMemberPage] = useState(1)

  const handleToggleBlockMember = async (
    memberId: string,
    userId: string,
    currentStatus: string | null
  ) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can block members.")
      return
    }
    const newStatus = currentStatus === "blocked" ? null : "blocked"
    setManagingMemberId(memberId)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/user/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: newStatus,
          organizationId: activeOrg?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to update user status.")
      } else if (refetch) {
        await refetch()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(
        err.message || "An error occurred while updating user status."
      )
    } finally {
      setManagingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can remove members.")
      return
    }
    setManagingMemberId(memberId)
    setErrorMessage(null)
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
      if (error) {
        setErrorMessage(error.message || "Failed to remove member.")
      } else if (refetch) {
        await refetch()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(
        err.message || "An error occurred while removing the member."
      )
    } finally {
      setManagingMemberId(null)
    }
  }

  const handleChangeMemberRole = async (
    memberId: string,
    currentRole: string
  ) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can change member roles.")
      return
    }
    const newRole = currentRole === "admin" ? "member" : "admin"
    setManagingMemberId(memberId)
    setErrorMessage(null)
    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId: memberId,
        role: newRole,
      })
      if (error) {
        setErrorMessage(error.message || "Failed to update member role.")
      } else if (refetch) {
        await refetch()
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(
        err.message || "An error occurred while changing member role."
      )
    } finally {
      setManagingMemberId(null)
    }
  }

  const itemsPerPage = 5

  // Reset pagination page when search changes
  useEffect(() => {
    setInvitePage(1)
  }, [inviteSearch])

  // Hidden/deleted invitation IDs per organization
  const [deletedInviteIds, setDeletedInviteIds] = useState<string[]>([])

  // Load deleted invite IDs from localStorage on mount or when activeOrg changes
  useEffect(() => {
    if (activeOrg?.id) {
      const saved = localStorage.getItem(`gc_deleted_invites_${activeOrg.id}`)
      if (saved) {
        try {
          setDeletedInviteIds(JSON.parse(saved))
        } catch {
          setDeletedInviteIds([])
        }
      } else {
        setDeletedInviteIds([])
      }
    }
  }, [activeOrg?.id])

  // Helper to permanently delete/hide an invite from the table
  const handleDeleteInviteFromTable = async (invite: any) => {
    if (!activeOrg?.id) return

    // 1. Hide immediately in local state (snappy optimistic UI)
    const updated = [...deletedInviteIds, invite.id]
    setDeletedInviteIds(updated)
    // localStorage.setItem(`gc_deleted_invites_${activeOrg.id}`, JSON.stringify(updated))

    // 2. Persist the deletion in the database so it's reflected on all accounts
    try {
      const res = await fetch("/api/organization/invitation/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invite.id,
          organizationId: activeOrg.id,
        }),
      })
      const data = await res.json()
      console.log(data)
      if (!res.ok || data.error) {
        console.error(
          "Failed to persist invitation deletion in DB:",
          data.error
        )
      }
    } catch (error) {
      console.error("Failed to delete invitation from database:", error)
    }

    // 3. If it is still pending, cancel it in the database in the background
    if (invite.status !== "canceled") {
      try {
        await authClient.organization.cancelInvitation({
          invitationId: invite.id,
        })
        if (refetch) {
          await refetch()
        }
      } catch (error) {
        console.error("Failed to cancel invitation during delete:", error)
      }
    } else if (refetch) {
      await refetch()
    }
  }

  // Filtered invitations based on search input and deleted state
  const filteredInvitations = useMemo(() => {
    if (!activeOrg?.invitations) return []
    return activeOrg.invitations.filter((invite: any) => {
      const matchesSearch = invite.email
        ?.toLowerCase()
        .includes(inviteSearch.toLowerCase())
      const isDeleted =
        deletedInviteIds.includes(invite.id) || invite.isDeleted === "true"
      return matchesSearch && !isDeleted
    })
  }, [activeOrg?.invitations, inviteSearch, deletedInviteIds])

  // Total pages count
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage)

  // Paginated invitations for the current page
  const paginatedInvitations = useMemo(() => {
    const startIndex = (invitePage - 1) * itemsPerPage
    return filteredInvitations.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredInvitations, invitePage])

  // Reset pagination page when search changes for members
  useEffect(() => {
    setMemberPage(1)
  }, [memberSearch])

  // Filtered members based on search input
  const filteredMembers = useMemo(() => {
    if (!activeOrg?.members) return []
    return activeOrg.members.filter((member: any) => {
      const nameMatch = member.user?.name
        ?.toLowerCase()
        .includes(memberSearch.toLowerCase())
      const emailMatch = member.user?.email
        ?.toLowerCase()
        .includes(memberSearch.toLowerCase())
      return nameMatch || emailMatch
    })
  }, [activeOrg?.members, memberSearch])

  // Total pages count for members
  const totalMemberPages = Math.ceil(filteredMembers.length / itemsPerPage)

  // Paginated members for the current page
  const paginatedMembers = useMemo(() => {
    const startIndex = (memberPage - 1) * itemsPerPage
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredMembers, memberPage])

  // Handler to cancel an invitation
  const handleCancelInvite = async (invitationId: string) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can cancel invitations.")
      return
    }
    setDeletingInviteId(invitationId)
    try {
      console.log(invitationId)
      await authClient.organization.cancelInvitation({
        invitationId,
      })
      if (refetch) {
        await refetch()
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
    } finally {
      setDeletingInviteId(null)
    }
  }

  // Handler to resend an invitation
  const handleResendInvite = async (invite: any) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can resend invitations.")
      return
    }
    if (!activeOrg) return
    setResendingInviteId(invite.id)
    setErrorMessage(null)
    try {
      const { data, error } = await authClient.organization.inviteMember({
        email: invite.email,
        role: invite.role as "member" | "admin",
        organizationId: activeOrg.id,
        resend: true,
      })
      if (error) {
        console.error("Failed to resend invite:", error)
        setErrorMessage(error.message || "Failed to resend invitation.")
      } else if (refetch) {
        await refetch()
      }
    } catch (error: any) {
      console.error("Failed to resend invite:", error)
      setErrorMessage(
        error.message || "An unexpected error occurred during resend."
      )
    } finally {
      setResendingInviteId(null)
    }
  }

  // Handler to change an invitation role (by cancelling and re-inviting)
  const handleChangeInviteRole = async (invite: any) => {
    if (!canInvite) {
      setErrorMessage("Only owners and admins can change invitation roles.")
      return
    }
    if (!activeOrg) return
    const newRole = invite.role === "admin" ? "member" : "admin"
    setRoleChangingInviteId(invite.id)
    setErrorMessage(null)
    try {
      // 1. Cancel existing invitation
      await authClient.organization.cancelInvitation({
        invitationId: invite.id,
      })
      // 2. Re-invite with new role
      const { data, error } = await authClient.organization.inviteMember({
        email: invite.email,
        role: newRole,
        organizationId: activeOrg.id,
      })
      if (error) {
        console.error("Failed to change invite role:", error)
        setErrorMessage(error.message || "Failed to change invitation role.")
      } else if (refetch) {
        await refetch()
      }
    } catch (error: any) {
      console.error("Failed to change invite role:", error)
      setErrorMessage(
        error.message || "An unexpected error occurred while changing role."
      )
    } finally {
      setRoleChangingInviteId(null)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canInvite) {
      setErrorMessage("Only owners and admins can invite members.")
      return
    }
    setIsInviting(true)
    setErrorMessage(null)
    try {
      console.log(activeOrg)
      if (activeOrg) {
        const { data, error } = await authClient.organization.inviteMember({
          organizationId: activeOrg.id,
          email: inviteEmail,
          role: inviteRole,
        })
        if (error) {
          console.error("Invite member failed:", error)
          setErrorMessage(
            error.message ||
              "Failed to invite member. The email may already be a member or already invited."
          )
        } else {
          setInviteEmail("")
          if (refetch) {
            await refetch()
          }
        }
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message || "An unexpected error occurred.")
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <>
      <MemberProfileDialog
        isOpen={profileDialogOpen}
        setIsOpen={setProfileDialogOpen}
        memberId={profileDialogMemberId}
        organizationId={activeOrg?.id || null}
      />
      {!isMemberPending && !canInvite ? (
        <Card className="border-muted bg-muted/10 p-2">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 p-0 text-muted-foreground">
              Invite Member
            </CardTitle>
            <CardDescription className="p-0">
              Only organization owners and administrators can invite new
              members.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="p-2">
          <CardHeader className="p-0">
            <CardTitle className="p-0">Invite Member</CardTitle>
            <CardDescription className="p-0">
              Invite a new member to your organization.
            </CardDescription>
          </CardHeader>
          <form className="p-0" onSubmit={handleInviteMember}>
            {errorMessage && (
              <div className="mb-4 animate-in rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive duration-200 fade-in">
                {errorMessage}
              </div>
            )}
            <CardContent className="flex flex-col gap-4 p-0 sm:flex-row">
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
                  disabled={isMemberPending}
                />
              </div>
              <div className="w-full space-y-1 sm:w-[200px]">
                <Label htmlFor="role" className="sr-only">
                  Role
                </Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) =>
                    setInviteRole(value as "member" | "admin")
                  }
                  disabled={isMemberPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectLabel>Role</SelectLabel>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="mt-2 p-0">
              <Button
                type="submit"
                disabled={
                  isInviting || !inviteEmail || !activeOrg || isMemberPending
                }
              >
                {isInviting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invite
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card className="p-2">
        <CardHeader className="p-0">
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            Manage members of your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isOrgPending ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="members">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="invitations">Invitations</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 rounded-l-lg text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMembers.map((member: any) => (
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
                              <span className="flex items-center gap-1.5 font-medium">
                                {member.user?.name}
                                {member.userId === session?.user?.id && (
                                  <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary"
                                  >
                                    You
                                  </Badge>
                                )}
                                {member.user?.status === "blocked" && (
                                  <Badge
                                    variant="outline"
                                    className="border-destructive/20 bg-destructive/10 px-1.5 py-0 text-[10px] font-semibold text-destructive"
                                  >
                                    Blocked
                                  </Badge>
                                )}
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
                          <TableCell className="flex flex-row items-center justify-end gap-1">
                            <Button
                              variant={"ghost"}
                              size="icon-sm"
                              onClick={() => {
                                setProfileDialogMemberId(member.userId)
                                setProfileDialogOpen(true)
                              }}
                            >
                              <Eye />
                            </Button>
                            {canInvite &&
                            member.userId !== session?.user?.id &&
                            member.role !== "owner" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant={"ghost"}
                                    size={"icon-sm"}
                                    disabled={managingMemberId === member.id}
                                  >
                                    {managingMemberId === member.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Menu className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-45"
                                >
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setProfileDialogMemberId(member.userId)
                                        setProfileDialogOpen(true)
                                      }}
                                      disabled={managingMemberId === member.id}
                                    >
                                      Manage Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleChangeMemberRole(
                                          member.id,
                                          member.role
                                        )
                                      }
                                      disabled={managingMemberId === member.id}
                                    >
                                      {member.role === "admin"
                                        ? "Make Member"
                                        : "Make Admin"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleToggleBlockMember(
                                          member.id,
                                          member.userId,
                                          member.user?.status
                                        )
                                      }
                                      disabled={managingMemberId === member.id}
                                    >
                                      {member.user?.status === "blocked"
                                        ? "Unblock User"
                                        : "Block User"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                      onClick={() =>
                                        handleRemoveMember(member.id)
                                      }
                                      disabled={managingMemberId === member.id}
                                    >
                                      Remove User
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                {member.userId === session?.user?.id
                                  ? "You"
                                  : "Restricted"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedMembers.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No members found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalMemberPages > 1 && (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {(memberPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        memberPage * itemsPerPage,
                        filteredMembers.length
                      )}{" "}
                      of {filteredMembers.length} members
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                        disabled={memberPage === 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setMemberPage((p) => Math.min(totalMemberPages, p + 1))
                        }
                        disabled={memberPage === totalMemberPages}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invitations" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 rounded-l-lg text-muted-foreground" />
                    <Input
                      placeholder="Search invitations..."
                      value={inviteSearch}
                      onChange={(e) => setInviteSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Invite Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvitations.map((invite: any) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {invite.email?.charAt(0).toUpperCase() || "I"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{invite.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invite.status === "canceled" ? (
                              <Badge variant="destructive">Cancelled</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invite.role === "owner" ||
                                invite.role === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {canInvite ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant={"ghost"}
                                    size={"icon-sm"}
                                    disabled={
                                      deletingInviteId === invite.id ||
                                      resendingInviteId === invite.id ||
                                      roleChangingInviteId === invite.id
                                    }
                                  >
                                    {deletingInviteId === invite.id ||
                                    resendingInviteId === invite.id ||
                                    roleChangingInviteId === invite.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Menu className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-45"
                                >
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem
                                      onClick={() => handleResendInvite(invite)}
                                      disabled={
                                        deletingInviteId === invite.id ||
                                        resendingInviteId === invite.id ||
                                        roleChangingInviteId === invite.id
                                      }
                                    >
                                      {resendingInviteId === invite.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Resending...
                                        </>
                                      ) : (
                                        "Resend Invite"
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleChangeInviteRole(invite)
                                      }
                                      disabled={
                                        deletingInviteId === invite.id ||
                                        resendingInviteId === invite.id ||
                                        roleChangingInviteId === invite.id
                                      }
                                    >
                                      {roleChangingInviteId === invite.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Changing...
                                        </>
                                      ) : (
                                        `Make ${invite.role === "admin" ? "Member" : "Admin"}`
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleCancelInvite(invite.id)
                                      }
                                      disabled={
                                        invite.status === "canceled" ||
                                        deletingInviteId === invite.id ||
                                        resendingInviteId === invite.id ||
                                        roleChangingInviteId === invite.id
                                      }
                                    >
                                      {deletingInviteId === invite.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Cancelling...
                                        </>
                                      ) : (
                                        "Cancel Invite"
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                      onClick={() =>
                                        handleDeleteInviteFromTable(invite)
                                      }
                                      disabled={
                                        deletingInviteId === invite.id ||
                                        resendingInviteId === invite.id ||
                                        roleChangingInviteId === invite.id
                                      }
                                    >
                                      Delete from Table
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Restricted
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedInvitations.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No invitations found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {(invitePage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        invitePage * itemsPerPage,
                        filteredInvitations.length
                      )}{" "}
                      of {filteredInvitations.length} invitations
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInvitePage((p) => Math.max(1, p - 1))}
                        disabled={invitePage === 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setInvitePage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={invitePage === totalPages}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  )
}
