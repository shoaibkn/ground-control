"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Switch } from "@workspace/ui/components/switch"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  FileText,
  Settings,
  ClipboardList,
  Check,
  X,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  FileIcon,
  ImageIcon,
  Copy,
} from "lucide-react"

interface FormEditorProps {
  formId?: any
}

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export function FormEditor({ formId }: FormEditorProps) {
  const router = useRouter()
  const { data: activeOrg } = authClient.useActiveOrganization()

  // Tabs: "build" | "responses" | "settings"
  const [activeTab, setActiveTab] = useState<
    "build" | "responses" | "settings"
  >("build")

  // Editor States
  const [title, setTitle] = useState("Untitled Form")
  const [description, setDescription] = useState("")
  const [isStandalone, setIsStandalone] = useState(true)
  const [fields, setFields] = useState<FormField[]>([
    {
      id: "field_1",
      type: "text",
      label: "Untitled Question",
      required: false,
    },
  ])

  // Queries & Mutations
  const form = useQuery(api.forms.getForm, formId ? { formId } : "skip")
  const responses = useQuery(
    api.forms.getFormResponses,
    formId ? { formId } : "skip"
  )

  const createForm = useMutation(api.forms.createForm)
  const updateForm = useMutation(api.forms.updateForm)

  // Populate data if editing
  useEffect(() => {
    if (form) {
      setTitle(form.title)
      setDescription(form.description || "")
      setIsStandalone(form.isStandalone)
      setFields(form.fields || [])
    }
  }, [form])

  // Add field helper
  const addField = (type = "text") => {
    const newId = `field_${Date.now()}`
    const newField: FormField = {
      id: newId,
      type,
      label:
        type === "text"
          ? "Single Line Question"
          : type === "textarea"
            ? "Long Answer Question"
            : "Untitled Question",
      required: false,
    }
    if (["radio", "checkbox", "select"].includes(type)) {
      newField.options = ["Option 1", "Option 2"]
    }
    setFields([...fields, newField])
  }

  // Update field helper
  const updateField = (id: string, key: keyof FormField, value: any) => {
    setFields(
      fields.map((f) => {
        if (f.id === id) {
          const updated = { ...f, [key]: value }
          // Ensure options list exists if changing to options type
          if (
            key === "type" &&
            ["radio", "checkbox", "select"].includes(value) &&
            !f.options
          ) {
            updated.options = ["Option 1", "Option 2"]
          }
          return updated
        }
        return f
      })
    )
  }

  // Remove field helper
  const removeField = (id: string) => {
    if (fields.length <= 1) {
      toast.warning("Forms must contain at least one question.")
      return
    }
    setFields(fields.filter((f) => f.id !== id))
  }

  // Move field order helper
  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === fields.length - 1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...fields]
    const temp = updated[index]
    updated[index] = updated[newIndex]!
    updated[newIndex] = temp!
    setFields(updated)
  }

  // Add field option helper
  const addOption = (fieldId: string) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId) {
          return {
            ...f,
            options: [
              ...(f.options || []),
              `Option ${(f.options?.length || 0) + 1}`,
            ],
          }
        }
        return f
      })
    )
  }

  // Update field option helper
  const updateOption = (fieldId: string, optIndex: number, val: string) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId && f.options) {
          const newOpts = [...f.options]
          newOpts[optIndex] = val
          return { ...f, options: newOpts }
        }
        return f
      })
    )
  }

  // Remove field option helper
  const removeOption = (fieldId: string, optIndex: number) => {
    setFields(
      fields.map((f) => {
        if (f.id === fieldId && f.options) {
          if (f.options.length <= 1) {
            toast.warning(
              "Select type questions must have at least one option."
            )
            return f
          }
          return {
            ...f,
            options: f.options.filter((_, idx) => idx !== optIndex),
          }
        }
        return f
      })
    )
  }

  // Submit/Save Form builder definition
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Form title cannot be empty.")
      return
    }

    try {
      if (formId) {
        await updateForm({
          formId,
          title,
          description,
          fields,
          isStandalone,
        })
        toast.success("Form updated successfully")
      } else {
        if (!activeOrg) {
          toast.error("Please select an organization first.")
          return
        }
        const newFormId = await createForm({
          title,
          description,
          fields,
          isStandalone,
          organizationId: activeOrg.id,
        })
        toast.success("Form created successfully")
        router.push(`/forms/${newFormId}/edit`)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save form")
    }
  }

  const [activeResponseId, setActiveResponseId] = useState<string | null>(null)
  const activeResponse = responses?.find((r: any) => r._id === activeResponseId)

  return (
    <div className="flex h-full flex-col gap-6 pb-10">
      {/* Header bar */}
      <div className="flex shrink-0 flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
            <ClipboardList className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col">
            <h1 className="line-clamp-1 text-base font-bold text-foreground">
              {formId ? `Edit Form: ${title}` : "Create New Custom Form"}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {formId ? `Form ID: ${formId}` : "Design a new layout structure"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {formId && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold"
            >
              <Link href={`/shared-forms/${formId}`} target="_blank">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Test Live Form</span>
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>Save Form</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/forms")}
            className="h-9 shrink-0 rounded-xl px-3 text-xs font-semibold"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Tabs list (if formId exists) */}
      {formId && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/40 pb-px">
          {[
            { id: "build", label: "Form Builder", icon: ClipboardList },
            {
              id: "responses",
              label: `Responses (${responses === undefined ? "..." : responses.length})`,
              icon: FileText,
            },
            { id: "settings", label: "Form Settings", icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "build" ? (
          <div className="flex flex-col items-start gap-6 pb-8 lg:flex-row">
            {/* Field Editor Block */}
            <div className="flex w-full flex-1 flex-col gap-4">
              {/* Form Title Card */}
              <div className="flex flex-col gap-3 rounded-2xl border border-l-4 border-border/50 border-l-primary bg-card bg-linear-to-b from-card to-muted/5 p-6 shadow-xs">
                <input
                  type="text"
                  placeholder="Form Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b border-transparent bg-transparent py-1 text-lg font-bold text-foreground transition-colors outline-none hover:border-border focus:border-primary"
                />
                <textarea
                  placeholder="Form Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-14 w-full resize-none border-b border-transparent bg-transparent py-1 text-xs text-muted-foreground transition-colors outline-none hover:border-border focus:border-primary"
                />
              </div>

              {/* Questions list */}
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5 shadow-xs transition-colors hover:border-border/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Index + Question label */}
                    <div className="flex flex-1 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/65 text-xs font-bold text-muted-foreground/60 select-none">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        placeholder="Question label..."
                        onChange={(e) =>
                          updateField(field.id, "label", e.target.value)
                        }
                        className="flex-1 border-b border-transparent bg-transparent py-0.5 text-xs font-semibold text-foreground transition-colors outline-none hover:border-border focus:border-primary"
                      />
                    </div>

                    {/* Field type dropdown selector */}
                    <Select
                      value={field.type}
                      onValueChange={(val) =>
                        updateField(field.id, "type", val)
                      }
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="text">Single Line Text</SelectItem>
                        <SelectItem value="textarea">Paragraph Text</SelectItem>
                        <SelectItem value="radio">
                          Multiple Choice (Radio)
                        </SelectItem>
                        <SelectItem value="checkbox">
                          Checkboxes (Multi-select)
                        </SelectItem>
                        <SelectItem value="select">
                          Dropdown (Select List)
                        </SelectItem>
                        <SelectItem value="date">Date picker</SelectItem>
                        <SelectItem value="number">Number input</SelectItem>
                        <SelectItem value="file">File attachment</SelectItem>
                        <SelectItem value="image">Image upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Placeholder input (for text, textareas, and numbers) */}
                  {["text", "textarea", "number"].includes(field.type) && (
                    <Input
                      placeholder="User placeholder text..."
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(field.id, "placeholder", e.target.value)
                      }
                      className="h-8 max-w-sm border-input/60 bg-muted/10 text-xs"
                    />
                  )}

                  {/* Options builder for lists */}
                  {["radio", "checkbox", "select"].includes(field.type) && (
                    <div className="flex flex-col gap-2 border-l-2 border-border/50 pl-3">
                      <span className="mb-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                        Options:
                      </span>
                      {field.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="w-3.5 text-xs font-bold text-muted-foreground/60 select-none">
                            {field.type === "radio"
                              ? "○"
                              : field.type === "checkbox"
                                ? "□"
                                : "•"}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              updateOption(field.id, optIdx, e.target.value)
                            }
                            className="w-48 border-b border-border/40 bg-transparent py-0.5 text-xs font-medium text-foreground transition-colors outline-none hover:border-border focus:border-primary"
                          />
                          <button
                            onClick={() => removeOption(field.id, optIdx)}
                            className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                            title="Delete option"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(field.id)}
                        className="mt-1 flex h-6 w-28 cursor-pointer items-center justify-center gap-1 rounded-full text-[9px] font-semibold"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Option</span>
                      </Button>
                    </div>
                  )}

                  {/* Field Control footer */}
                  <div className="mt-1.5 flex items-center justify-between border-t border-border/30 pt-3">
                    {/* Required flag toggle */}
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`req-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(field.id, "required", checked)
                        }
                        className="scale-85"
                      />
                      <Label
                        htmlFor={`req-${field.id}`}
                        className="cursor-pointer text-[10px] font-semibold text-muted-foreground select-none"
                      >
                        Required Question
                      </Label>
                    </div>

                    {/* Sorting & Delete buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveField(idx, "up")}
                        disabled={idx === 0}
                        className="h-7 w-7 cursor-pointer rounded-full p-0 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveField(idx, "down")}
                        disabled={idx === fields.length - 1}
                        className="h-7 w-7 cursor-pointer rounded-full p-0 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="h-7 w-7 cursor-pointer rounded-full p-0 text-muted-foreground hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add question bottom actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/5 p-4 py-5">
                <span className="mr-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                  Add Question Type:
                </span>
                {[
                  { type: "text", label: "Text Field" },
                  { type: "textarea", label: "Paragraph" },
                  { type: "radio", label: "Multiple Choice" },
                  { type: "checkbox", label: "Checkboxes" },
                  { type: "select", label: "Dropdown" },
                  { type: "date", label: "Date" },
                  { type: "number", label: "Number" },
                  { type: "file", label: "File" },
                  { type: "image", label: "Image" },
                ].map((item) => (
                  <Button
                    key={item.type}
                    size="sm"
                    variant="outline"
                    onClick={() => addField(item.type)}
                    className="flex h-7.5 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Summary sidebar (Right Panel) */}
            <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5 shadow-xs lg:w-72">
              <span className="border-b border-border pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                Form Overview
              </span>
              <div className="mt-1.5 flex flex-col gap-3.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Questions Count</span>
                  <span className="font-semibold text-foreground">
                    {fields.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Required Fields</span>
                  <span className="font-semibold text-foreground">
                    {fields.filter((f) => f.required).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standalone Sharing</span>
                  <span className="font-semibold text-foreground">
                    {isStandalone ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "responses" ? (
          <div className="flex flex-col gap-4 pb-8">
            {responses === undefined ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">
                  Loading response logs...
                </p>
              </div>
            ) : responses.length > 0 ? (
              <div className="flex flex-col items-stretch gap-6 md:flex-row">
                {/* Responses list (Left) */}
                <div className="flex h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card">
                  <div className="shrink-0 border-b border-border/40 bg-muted/30 p-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                    Submissions
                  </div>
                  <div className="flex-1 divide-y divide-border/30 overflow-y-auto">
                    {responses.map((resp: any) => {
                      const age = new Date(resp.submittedAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                      const isActive = activeResponseId === resp._id
                      return (
                        <div
                          key={resp._id}
                          onClick={() => setActiveResponseId(resp._id)}
                          className={`flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-muted/5 ${
                            isActive
                              ? "border-l-2 border-l-primary bg-primary/5 pl-3 hover:bg-primary/5"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              userId={resp.submitterId}
                              avatarClassName="h-7 w-7"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">
                                {activeOrg?.members?.find(
                                  (m: any) => m.userId === resp.submitterId
                                )?.user?.name || "Member User"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {age}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Response Viewer card (Right) */}
                <div className="h-[420px] flex-1 overflow-y-auto rounded-2xl border border-border/50 bg-card p-5">
                  {activeResponse ? (
                    <div className="flex flex-col gap-4">
                      {/* Submitter Info header */}
                      <div className="flex items-center gap-3 border-b border-border pb-3">
                        <UserAvatar
                          userId={activeResponse.submitterId}
                          avatarClassName="h-9 w-9"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {activeOrg?.members?.find(
                              (m: any) =>
                                m.userId === activeResponse.submitterId
                            )?.user?.name || "Member User"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Submitted on{" "}
                            {new Date(
                              activeResponse.submittedAt
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Answers grid */}
                      <div className="mt-2 flex flex-col gap-4">
                        {fields.map((f) => {
                          const ans = activeResponse.answers.find(
                            (a: any) => a.fieldId === f.id
                          )
                          const value = ans ? ans.value : undefined

                          return (
                            <div
                              key={f.id}
                              className="flex flex-col gap-1 text-xs"
                            >
                              <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                                <span>{f.label}</span>
                                {f.required && (
                                  <span className="font-bold text-red-500">
                                    *
                                  </span>
                                )}
                              </span>
                              <div className="flex min-h-[34px] items-center gap-2 rounded-lg border border-border/30 bg-muted/15 bg-linear-to-b from-card to-muted/5 p-2.5 font-medium text-foreground/95">
                                {value === undefined || value === "" ? (
                                  <span className="text-[10px] text-muted-foreground/50 italic">
                                    No answer provided
                                  </span>
                                ) : Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {value.map((v, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="rounded-full border-border/30 bg-muted/65 px-2.5 text-[9px] font-bold text-muted-foreground"
                                      >
                                        {v}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : f.type === "file" || f.type === "image" ? (
                                  <div className="flex items-center gap-2 font-semibold text-primary hover:underline">
                                    {f.type === "image" ? (
                                      <ImageIcon className="h-4 w-4 shrink-0 text-primary/75" />
                                    ) : (
                                      <FileIcon className="h-4 w-4 shrink-0 text-primary/75" />
                                    )}
                                    <a
                                      href={value}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="max-w-[200px] truncate text-[10.5px]"
                                    >
                                      {value.split("/").pop() ||
                                        "Attachment Link"}
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {String(value)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground/60 italic select-none">
                      <FileText className="h-8 w-8 stroke-[1.5] text-muted-foreground/45" />
                      <span>
                        Select a response on the left to view submitted answers.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/20 py-16">
                <FileText className="h-10 w-10 stroke-[1.5] text-muted-foreground/55" />
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    No responses yet
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    This form hasn't received any submissions. Share the
                    standalone link or link it to a task to start collecting
                    data.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Settings tab */
          <div className="flex max-w-xl flex-col gap-6 rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-1 border-b border-border pb-3 select-none">
              <span className="text-sm font-bold text-foreground">
                Form Share Settings
              </span>
              <span className="text-xs text-muted-foreground">
                Configure visibility and standalone access rules.
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-foreground">
                  Allow Standalone Submissions
                </span>
                <span className="max-w-md text-[10px] text-muted-foreground">
                  Enable this to generate a public standalone URL that allows
                  organization members to fill and submit the form directly.
                  Anonymous submissions are always disabled.
                </span>
              </div>
              <Switch
                id="standalone-toggle"
                checked={isStandalone}
                onCheckedChange={setIsStandalone}
                className="mt-0.5"
              />
            </div>

            {isStandalone && formId && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                  Standalone Link:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/shared-forms/${formId}`
                        : `/shared-forms/${formId}`
                    }
                    className="h-9 border-input/60 bg-muted/15 font-mono text-xs select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const origin = window.location.origin
                      navigator.clipboard.writeText(
                        `${origin}/shared-forms/${formId}`
                      )
                      toast.success("Standalone link copied!")
                    }}
                    className="flex h-9 shrink-0 cursor-pointer items-center gap-1 font-semibold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
