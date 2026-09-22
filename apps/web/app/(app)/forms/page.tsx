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
  FileCheck,
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
    if (
      confirm(
        "Are you sure you want to delete this form? This will remove the form definition permanent."
      )
    ) {
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

  const filteredForms = forms?.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header section */}
      <div className="flex shrink-0 flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card/45 p-5 shadow-xs sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            <span>Forms Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Build and manage custom checklists, surveys, and information forms
            for your team.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="flex h-9 shrink-0 items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Link href="/forms/new">
            <Plus className="h-4 w-4" />
            <span>Create Form</span>
          </Link>
        </Button>
      </div>

      {/* Control bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/10 p-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-muted-foreground/75" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 border-input/60 bg-background/50 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto">
        {forms === undefined ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              Loading custom forms...
            </p>
          </div>
        ) : filteredForms && filteredForms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 pb-8 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/20 py-16">
            <FileText className="h-10 w-10 stroke-[1.5] text-muted-foreground/55" />
            <div className="flex flex-col gap-1 text-center">
              <p className="text-sm font-semibold text-foreground">
                No forms found
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {searchQuery
                  ? "No forms match your search query."
                  : "Get started by building your first custom data form."}
              </p>
            </div>
            {!searchQuery && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="mt-2 text-xs font-semibold"
              >
                <Link href="/forms/new">
                  <Plus className="mr-1 h-3.5 w-3.5" />
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
    year: "numeric",
  })

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card bg-linear-to-b from-card to-muted/5 p-5 shadow-xs transition-all duration-350 hover:border-primary/45 hover:shadow-md">
      <div className="flex flex-col gap-2.5">
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {form.title}
            </h3>
          </div>
          {form.isStandalone && (
            <Badge
              variant="outline"
              className="h-5 shrink-0 rounded-full border-emerald-500/15 bg-emerald-500/5 px-1.5 text-[9px] font-semibold tracking-wide text-emerald-600 select-none"
            >
              Shared Link
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground/85">
          {form.description || "No description provided."}
        </p>

        {/* Details row */}
        <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-dashed border-border/50 pt-3 text-[10px] font-medium text-muted-foreground/75">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>{creationDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>
              {form.fields.length}{" "}
              {form.fields.length === 1 ? "field" : "fields"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span>
              {responses === undefined ? "..." : `${responseCount} responses`}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-border/40 pt-4">
        {form.isStandalone && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyLink(form._id)}
              className="flex h-7 cursor-pointer items-center gap-1 rounded-full px-2 text-[10px] font-semibold hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              <Copy className="h-3 w-3" />
              <span>Copy Link</span>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex h-7 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold"
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
            className="h-7 w-7 cursor-pointer rounded-full border-border/60 p-0 hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
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
            className="h-7 w-7 cursor-pointer rounded-full p-0 text-muted-foreground/80 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-600"
            title="Delete Form definition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
