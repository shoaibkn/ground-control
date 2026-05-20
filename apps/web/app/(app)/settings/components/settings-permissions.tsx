"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const AVAILABLE_PERMISSIONS = {
  tasks: [
    { id: "create", label: "Create Tasks", description: "Allow creating new tasks" },
    { id: "read_all", label: "Read All Tasks", description: "Allow viewing all tasks in the organization" },
    { id: "read_own", label: "Read Own Tasks", description: "Allow viewing tasks assigned to or created by them" },
    { id: "assign", label: "Assign Tasks", description: "Allow assigning tasks to other members" },
    { id: "complete", label: "Complete Tasks", description: "Allow moving tasks from Under Review to Completed" },
    { id: "cancel", label: "Cancel Tasks", description: "Allow cancelling tasks" },
    { id: "archive", label: "Archive Tasks", description: "Allow archiving/un-archiving tasks" },
    { id: "delete", label: "Delete Attachments", description: "Allow deleting file attachments" },
  ],
}

export default function PermissionsSettings() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  
  const permissions = useQuery(api.permissions.getPermissions, 
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )
  
  const setPermissions = useMutation(api.permissions.setPermissions)
  
  const [selectedRole, setSelectedRole] = useState<"owner" | "admin" | "member">("member")
  const [isSaving, setIsSaving] = useState(false)

  if (!activeOrg) return null
  if (permissions === undefined) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  // Merge defaults with custom permissions
  const getRoleActions = (role: string, resource: string) => {
    const custom = permissions.find((p: any) => p.role === role && p.resource === resource)
    if (custom) return custom.actions
    
    // Default permissions
    if (role === "owner" || role === "admin") {
      return ["create", "read_all", "assign", "delete", "archive", "cancel", "complete"]
    }
    if (role === "member") {
      return ["create", "read_own"]
    }
    return []
  }

  const currentActions = getRoleActions(selectedRole, "tasks")

  const handleToggle = async (actionId: string, enabled: boolean) => {
    setIsSaving(true)
    try {
      let newActions = [...currentActions]
      if (enabled) {
        if (!newActions.includes(actionId)) newActions.push(actionId)
      } else {
        newActions = newActions.filter((a) => a !== actionId)
      }

      await setPermissions({
        organizationId: activeOrg.id,
        role: selectedRole,
        resource: "tasks",
        actions: newActions,
      })
      toast.success("Permissions updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update permissions")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>
          Configure granular access controls for roles in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Role Selector */}
        <div className="flex flex-wrap gap-2">
          {(["owner", "admin", "member"] as const).map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role)}
              className="capitalize"
            >
              {role}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tasks Permissions ({selectedRole})
          </h3>
          
          <div className="grid gap-4 rounded-md border p-4">
            {AVAILABLE_PERMISSIONS.tasks.map((perm) => (
              <div key={perm.id} className="flex flex-row items-center justify-between rounded-lg p-2 hover:bg-accent/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-base">{perm.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {perm.description}
                  </p>
                </div>
                <Switch
                  checked={currentActions.includes(perm.id)}
                  onCheckedChange={(checked) => handleToggle(perm.id, checked)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
