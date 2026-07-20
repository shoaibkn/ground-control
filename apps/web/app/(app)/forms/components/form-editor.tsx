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
  Copy
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
  const [activeTab, setActiveTab] = useState<"build" | "responses" | "settings">("build")
  
  // Editor States
  const [title, setTitle] = useState("Untitled Form")
  const [description, setDescription] = useState("")
  const [isStandalone, setIsStandalone] = useState(true)
  const [fields, setFields] = useState<FormField[]>([
    { id: "field_1", type: "text", label: "Untitled Question", required: false }
  ])

  // Queries & Mutations
  const form = useQuery(api.forms.getForm, formId ? { formId } : "skip")
  const responses = useQuery(api.forms.getFormResponses, formId ? { formId } : "skip")
  
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
      label: type === "text" ? "Single Line Question" : type === "textarea" ? "Long Answer Question" : "Untitled Question",
      required: false,
    }
    if (["radio", "checkbox", "select"].includes(type)) {
      newField.options = ["Option 1", "Option 2"]
    }
    setFields([...fields, newField])
  }

  // Update field helper
  const updateField = (id: string, key: keyof FormField, value: any) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        const updated = { ...f, [key]: value }
        // Ensure options list exists if changing to options type
        if (key === "type" && ["radio", "checkbox", "select"].includes(value) && !f.options) {
          updated.options = ["Option 1", "Option 2"]
        }
        return updated
      }
      return f
    }))
  }

  // Remove field helper
  const removeField = (id: string) => {
    if (fields.length <= 1) {
      toast.warning("Forms must contain at least one question.")
      return
    }
    setFields(fields.filter(f => f.id !== id))
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
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`]
        }
      }
      return f
    }))
  }

  // Update field option helper
  const updateOption = (fieldId: string, optIndex: number, val: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOpts = [...f.options]
        newOpts[optIndex] = val
        return { ...f, options: newOpts }
      }
      return f
    }))
  }

  // Remove field option helper
  const removeOption = (fieldId: string, optIndex: number) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        if (f.options.length <= 1) {
          toast.warning("Select type questions must have at least one option.")
          return f
        }
        return {
          ...f,
          options: f.options.filter((_, idx) => idx !== optIndex)
        }
      }
      return f
    }))
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
          isStandalone
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
          organizationId: activeOrg.id
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
    <div className="flex flex-col gap-6 h-full pb-10">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-card border border-border/40 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <ClipboardList className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-foreground line-clamp-1">
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
              className="h-9 text-xs font-semibold px-3 rounded-xl flex items-center gap-1.5"
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
            className="h-9 text-xs font-semibold px-4 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Save className="h-4 w-4" />
            <span>Save Form</span>
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => router.push("/forms")} 
            className="h-9 text-xs font-semibold px-3 rounded-xl shrink-0"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Tabs list (if formId exists) */}
      {formId && (
        <div className="flex items-center gap-2 border-b border-border/40 pb-px shrink-0">
          {[
            { id: "build", label: "Form Builder", icon: ClipboardList },
            { id: "responses", label: `Responses (${responses === undefined ? "..." : responses.length})`, icon: FileText },
            { id: "settings", label: "Form Settings", icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
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
          <div className="flex flex-col lg:flex-row gap-6 items-start pb-8">
            {/* Field Editor Block */}
            <div className="flex-1 flex flex-col gap-4 w-full">
              {/* Form Title Card */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-3 shadow-xs bg-linear-to-b from-card to-muted/5 border-l-4 border-l-primary">
                <input
                  type="text"
                  placeholder="Form Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-lg font-bold border-b border-transparent hover:border-border focus:border-primary outline-none py-1 transition-colors text-foreground w-full"
                />
                <textarea
                  placeholder="Form Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent text-xs text-muted-foreground border-b border-transparent hover:border-border focus:border-primary outline-none py-1 resize-none h-14 transition-colors w-full"
                />
              </div>

              {/* Questions list */}
              {fields.map((field, idx) => (
                <div 
                  key={field.id} 
                  className="bg-card border border-border/40 rounded-2xl p-5 shadow-xs flex flex-col gap-4 hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Index + Question label */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-muted-foreground/60 select-none bg-muted/65 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        placeholder="Question label..."
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                        className="bg-transparent text-xs font-semibold border-b border-transparent hover:border-border focus:border-primary outline-none py-0.5 transition-colors text-foreground flex-1"
                      />
                    </div>

                    {/* Field type dropdown selector */}
                    <Select
                      value={field.type}
                      onValueChange={(val) => updateField(field.id, "type", val)}
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="text">Single Line Text</SelectItem>
                        <SelectItem value="textarea">Paragraph Text</SelectItem>
                        <SelectItem value="radio">Multiple Choice (Radio)</SelectItem>
                        <SelectItem value="checkbox">Checkboxes (Multi-select)</SelectItem>
                        <SelectItem value="select">Dropdown (Select List)</SelectItem>
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
                      onChange={(e) => updateField(field.id, "placeholder", e.target.value)}
                      className="h-8 text-xs bg-muted/10 border-input/60 max-w-sm"
                    />
                  )}

                  {/* Options builder for lists */}
                  {["radio", "checkbox", "select"].includes(field.type) && (
                    <div className="flex flex-col gap-2 border-l-2 border-border/50 pl-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 select-none">Options:</span>
                      {field.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-muted-foreground/60 w-3.5 select-none">
                            {field.type === "radio" ? "○" : field.type === "checkbox" ? "□" : "•"}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                            className="bg-transparent text-xs border-b border-border/40 hover:border-border focus:border-primary outline-none py-0.5 transition-colors text-foreground w-48 font-medium"
                          />
                          <button
                            onClick={() => removeOption(field.id, optIdx)}
                            className="text-muted-foreground hover:text-red-500 rounded p-0.5 hover:bg-muted cursor-pointer transition-colors"
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
                        className="h-6 w-28 text-[9px] font-semibold rounded-full mt-1 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Option</span>
                      </Button>
                    </div>
                  )}

                  {/* Field Control footer */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-1.5">
                    {/* Required flag toggle */}
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`req-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, "required", checked)}
                        className="scale-85"
                      />
                      <Label 
                        htmlFor={`req-${field.id}`} 
                        className="text-[10px] font-semibold text-muted-foreground select-none cursor-pointer"
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
                        className="h-7 w-7 rounded-full p-0 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveField(idx, "down")}
                        disabled={idx === fields.length - 1}
                        className="h-7 w-7 rounded-full p-0 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="h-7 w-7 rounded-full p-0 cursor-pointer text-muted-foreground hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add question bottom actions */}
              <div className="flex flex-wrap items-center gap-2 border border-dashed border-border/80 rounded-2xl p-4 bg-muted/5 justify-center py-5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2 select-none">Add Question Type:</span>
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
                ].map(item => (
                  <Button
                    key={item.type}
                    size="sm"
                    variant="outline"
                    onClick={() => addField(item.type)}
                    className="h-7.5 text-[10px] font-semibold px-2.5 rounded-full cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/20 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Summary sidebar (Right Panel) */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 bg-card border border-border/40 p-5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1 select-none">Form Overview</span>
              <div className="flex flex-col gap-3.5 mt-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Questions Count</span>
                  <span className="font-semibold text-foreground">{fields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Fields</span>
                  <span className="font-semibold text-foreground">{fields.filter(f => f.required).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standalone Sharing</span>
                  <span className="font-semibold text-foreground">{isStandalone ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "responses" ? (
          <div className="flex flex-col gap-4 pb-8">
            {responses === undefined ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading response logs...</p>
              </div>
            ) : responses.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Responses list (Left) */}
                <div className="flex-1 border border-border/50 rounded-2xl bg-card overflow-hidden h-[420px] flex flex-col">
                  <div className="bg-muted/30 border-b border-border/40 p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none shrink-0">Submissions</div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border/30">
                    {responses.map((resp: any) => {
                      const age = new Date(resp.submittedAt).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })
                      const isActive = activeResponseId === resp._id
                      return (
                        <div 
                          key={resp._id}
                          onClick={() => setActiveResponseId(resp._id)}
                          className={`flex items-center justify-between p-3.5 hover:bg-muted/5 transition-colors cursor-pointer ${
                            isActive ? "bg-primary/5 hover:bg-primary/5 border-l-2 border-l-primary pl-3" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar userId={resp.submitterId} avatarClassName="h-7 w-7" />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">
                                {activeOrg?.members?.find((m: any) => m.userId === resp.submitterId)?.user?.name || "Member User"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{age}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Response Viewer card (Right) */}
                <div className="flex-1 border border-border/50 rounded-2xl bg-card p-5 overflow-y-auto h-[420px]">
                  {activeResponse ? (
                    <div className="flex flex-col gap-4">
                      {/* Submitter Info header */}
                      <div className="border-b border-border pb-3 flex items-center gap-3">
                        <UserAvatar userId={activeResponse.submitterId} avatarClassName="h-9 w-9" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {activeOrg?.members?.find((m: any) => m.userId === activeResponse.submitterId)?.user?.name || "Member User"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Submitted on {new Date(activeResponse.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Answers grid */}
                      <div className="flex flex-col gap-4 mt-2">
                        {fields.map((f) => {
                          const ans = activeResponse.answers.find((a: any) => a.fieldId === f.id)
                          const value = ans ? ans.value : undefined

                          return (
                            <div key={f.id} className="flex flex-col gap-1 text-xs">
                              <span className="font-semibold text-foreground/80 flex items-center gap-1.5">
                                <span>{f.label}</span>
                                {f.required && <span className="text-red-500 font-bold">*</span>}
                              </span>
                              <div className="bg-muted/15 border border-border/30 rounded-lg p-2.5 min-h-[34px] font-medium text-foreground/95 bg-linear-to-b from-card to-muted/5 flex items-center gap-2">
                                {value === undefined || value === "" ? (
                                  <span className="text-muted-foreground/50 italic text-[10px]">No answer provided</span>
                                ) : Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {value.map((v, i) => (
                                      <Badge key={i} variant="secondary" className="text-[9px] px-2.5 rounded-full font-bold bg-muted/65 text-muted-foreground border-border/30">
                                        {v}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : f.type === "file" || f.type === "image" ? (
                                  <div className="flex items-center gap-2 text-primary font-semibold hover:underline">
                                    {f.type === "image" ? <ImageIcon className="h-4 w-4 shrink-0 text-primary/75" /> : <FileIcon className="h-4 w-4 shrink-0 text-primary/75" />}
                                    <a href={value} target="_blank" rel="noreferrer" className="truncate max-w-[200px] text-[10.5px]">
                                      {value.split("/").pop() || "Attachment Link"}
                                    </a>
                                  </div>
                                ) : (
                                  <span className="whitespace-pre-wrap leading-relaxed text-[11px]">{String(value)}</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/60 italic text-xs select-none">
                      <FileText className="h-8 w-8 text-muted-foreground/45 stroke-[1.5]" />
                      <span>Select a response on the left to view submitted answers.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-border/80 rounded-2xl bg-card/20">
                <FileText className="h-10 w-10 text-muted-foreground/55 stroke-[1.5]" />
                <div className="text-center gap-1 flex flex-col">
                  <p className="text-sm font-semibold text-foreground">No responses yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    This form hasn't received any submissions. Share the standalone link or link it to a task to start collecting data.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Settings tab */
          <div className="max-w-xl bg-card border border-border/50 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col gap-1 border-b border-border pb-3 select-none">
              <span className="text-sm font-bold text-foreground">Form Share Settings</span>
              <span className="text-xs text-muted-foreground">Configure visibility and standalone access rules.</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-foreground">Allow Standalone Submissions</span>
                <span className="text-[10px] text-muted-foreground max-w-md">
                  Enable this to generate a public standalone URL that allows organization members to fill and submit the form directly. Anonymous submissions are always disabled.
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">Standalone Link:</span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={typeof window !== "undefined" ? `${window.location.origin}/shared-forms/${formId}` : `/shared-forms/${formId}`}
                    className="text-xs font-mono h-9 bg-muted/15 border-input/60 select-all"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const origin = window.location.origin
                      navigator.clipboard.writeText(`${origin}/shared-forms/${formId}`)
                      toast.success("Standalone link copied!")
                    }}
                    className="h-9 font-semibold shrink-0 cursor-pointer flex items-center gap-1"
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
