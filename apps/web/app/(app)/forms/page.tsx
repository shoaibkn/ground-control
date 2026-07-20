"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "sonner"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  FileText, 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2, 
  Loader2, 
  Calendar,
  Layers,
  FileCheck
} from "lucide-react"

export default function FormsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [searchQuery, setSearchQuery] = useState("")

  const forms = useQuery(
    api.forms.getForms,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  )

  const deleteForm = useMutation(api.forms.deleteForm)

  const handleDelete = async (formId: any) => {
    if (confirm("Are you sure you want to delete this form? This will remove the form definition permanent.")) {
      try {
        await deleteForm({ formId })
        toast.success("Form deleted successfully")
      } catch (err: any) {
        toast.error(err.message || "Failed to delete form")
      }
    }
  }

  const copyStandaloneLink = (formId: string) => {
    const origin = window.location.origin
    const link = `${origin}/shared-forms/${formId}`
    navigator.clipboard.writeText(link)
    toast.success("Standalone form link copied to clipboard!")
  }

  const filteredForms = forms?.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-card/45 border border-border/40 p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Forms Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Build and manage custom checklists, surveys, and information forms for your team.
          </p>
        </div>
        <Button asChild size="sm" className="flex items-center gap-1.5 h-9 text-xs font-semibold shadow-xs shrink-0">
          <Link href="/forms/new">
            <Plus className="h-4 w-4" />
            <span>Create Form</span>
          </Link>
        </Button>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between gap-4 bg-muted/10 border border-border/50 rounded-xl p-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/75" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-background/50 border-input/60"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto">
        {forms === undefined ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading custom forms...</p>
          </div>
        ) : filteredForms && filteredForms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {filteredForms.map((form) => (
              <FormCard 
                key={form._id} 
                form={form} 
                onDelete={handleDelete}
                onCopyLink={copyStandaloneLink}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-border/80 rounded-2xl bg-card/20">
            <FileText className="h-10 w-10 text-muted-foreground/55 stroke-[1.5]" />
            <div className="text-center gap-1 flex flex-col">
              <p className="text-sm font-semibold text-foreground">No forms found</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {searchQuery ? "No forms match your search query." : "Get started by building your first custom data form."}
              </p>
            </div>
            {!searchQuery && (
              <Button asChild size="sm" variant="outline" className="mt-2 text-xs font-semibold">
                <Link href="/forms/new">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Build First Form</span>
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface FormCardProps {
  form: any
  onDelete: (id: any) => void
  onCopyLink: (id: string) => void
}

function FormCard({ form, onDelete, onCopyLink }: FormCardProps) {
  // Query responses count for this form
  const responses = useQuery(api.forms.getFormResponses, { formId: form._id })
  const responseCount = responses ? responses.length : 0

  const creationDate = new Date(form.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  })

  return (
    <div className="group flex flex-col justify-between bg-card border border-border/60 hover:border-primary/45 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-350 bg-linear-to-b from-card to-muted/5 relative overflow-hidden">
      <div className="flex flex-col gap-2.5">
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
              {form.title}
            </h3>
          </div>
          {form.isStandalone && (
            <Badge variant="outline" className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/5 border-emerald-500/15 tracking-wide px-1.5 h-5 rounded-full select-none shrink-0">
              Shared Link
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground/85 line-clamp-2 min-h-8">
          {form.description || "No description provided."}
        </p>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground/75 font-medium border-t border-dashed border-border/50 pt-3 mt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>{creationDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>{form.fields.length} {form.fields.length === 1 ? "field" : "fields"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>{responses === undefined ? "..." : `${responseCount} responses`}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 border-t border-border/40 pt-4 mt-4">
        {form.isStandalone && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onCopyLink(form._id)}
              className="h-7 text-[10px] font-semibold px-2 rounded-full cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/20 flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              <span>Copy Link</span>
            </Button>
            <Button 
              asChild 
              size="sm" 
              variant="outline"
              className="h-7 text-[10px] font-semibold px-2.5 rounded-full cursor-pointer flex items-center gap-1"
            >
              <Link href={`/shared-forms/${form._id}`} target="_blank">
                <ExternalLink className="h-3 w-3" />
                <span>Open Form</span>
              </Link>
            </Button>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button 
            asChild 
            size="sm" 
            variant="outline" 
            className="h-7 w-7 rounded-full p-0 cursor-pointer hover:text-primary border-border/60 hover:bg-primary/5 hover:border-primary/25"
            title="Edit Form definition"
          >
            <Link href={`/forms/${form._id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDelete(form._id)}
            className="h-7 w-7 rounded-full p-0 cursor-pointer hover:text-red-600 hover:bg-red-500/5 hover:border-red-500/20 text-muted-foreground/80"
            title="Delete Form definition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
