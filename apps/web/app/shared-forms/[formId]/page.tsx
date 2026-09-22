"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  FileText,
  CheckCircle2,
  Loader2,
  Lock,
  AlertCircle,
  FileIcon,
  ImageIcon,
} from "lucide-react"

export default function SharedFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId =
    typeof params.formId === "string" ? (params.formId as any) : undefined

  const { data: session, isPending: sessionPending } = authClient.useSession()
  const form = useQuery(api.forms.getForm, formId ? { formId } : "skip")
  const submitFormResponse = useMutation(api.forms.submitFormResponse)

  // Submissions State
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!sessionPending && !session) {
      toast.error("Please login to access this form.")
      router.push(
        `/sign-in?redirectTo=${encodeURIComponent(window.location.pathname)}`
      )
    }
  }, [session, sessionPending, router])

  // Initialize answers map when form loads
  useEffect(() => {
    if (form) {
      const initial: Record<string, any> = {}
      form.fields.forEach((f) => {
        if (f.type === "checkbox") {
          initial[f.id] = []
        } else {
          initial[f.id] = ""
        }
      })
      setAnswers(initial)
    }
  }, [form])

  if (sessionPending || form === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Loading form details...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
          <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground">
              Authentication Required
            </h2>
            <p className="text-xs text-muted-foreground">
              You must be logged in to view and submit this form.
            </p>
          </div>
          <Button
            onClick={() =>
              router.push(
                `/sign-in?redirectTo=${encodeURIComponent(window.location.pathname)}`
              )
            }
            className="h-9 w-full rounded-xl text-xs font-semibold"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (form === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
          <div className="rounded-full bg-red-500/10 p-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground">
              Form Not Found
            </h2>
            <p className="text-xs text-muted-foreground">
              This form does not exist, has been deleted, or you do not have
              permission to view it.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="h-9 w-full rounded-xl text-xs font-semibold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Value change helpers
  const handleTextChange = (fieldId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }))
  }

  const handleCheckboxChange = (
    fieldId: string,
    option: string,
    checked: boolean
  ) => {
    const current = answers[fieldId] || []
    const updated = checked
      ? [...current, option]
      : current.filter((o: string) => o !== option)
    setAnswers((prev) => ({ ...prev, [fieldId]: updated }))
  }

  const handleFileUpload = (
    fieldId: string,
    type: "file" | "image",
    file: File | null
  ) => {
    if (!file) {
      setAnswers((prev) => ({ ...prev, [fieldId]: "" }))
      return
    }

    // Simulate R2 upload key
    if (type === "image") {
      setAnswers((prev) => ({
        ...prev,
        [fieldId]: `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`,
      }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        [fieldId]: `https://ground-control.mock/attachments/${Date.now()}-${file.name}`,
      }))
    }
    toast.success(`${file.name} uploaded successfully (mock)`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required fields check
    for (const f of form.fields) {
      const val = answers[f.id]
      if (f.required) {
        if (f.type === "checkbox" && (!val || val.length === 0)) {
          toast.error(`"${f.label}" is required.`)
          return
        }
        if (f.type !== "checkbox" && (!val || String(val).trim() === "")) {
          toast.error(`"${f.label}" is required.`)
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      const payloadAnswers = Object.entries(answers).map(
        ([fieldId, value]) => ({
          fieldId,
          value,
        })
      )

      await submitFormResponse({
        formId: form._id,
        answers: payloadAnswers,
        organizationId: form.organizationId,
      })

      setIsSubmitted(true)
      toast.success("Response submitted successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-border/80 bg-card p-8 text-center shadow-xl">
          <div className="animate-bounce rounded-full bg-emerald-500/10 p-3 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-foreground">
              Submission Received
            </h2>
            <p className="text-xs text-muted-foreground">
              Your responses to "{form.title}" have been saved successfully.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-2 h-9 w-full rounded-xl text-xs font-semibold"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/20 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        {/* Form header card */}
        <div className="flex flex-col gap-3 rounded-2xl border border-t-8 border-border/60 border-t-primary bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">{form.title}</h1>
          {form.description && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {form.description}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5 border-t border-border/40 pt-1.5 text-[10px] text-muted-foreground select-none">
            <span>Responding as:</span>
            <Badge
              variant="secondary"
              className="rounded-full border-border/30 bg-muted/65 px-2 text-[9px] font-bold text-muted-foreground"
            >
              {session.user.email}
            </Badge>
          </div>
        </div>

        {/* Form inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {form.fields.map((f, idx) => {
            const val = answers[f.id]

            return (
              <div
                key={f.id}
                className="flex flex-col gap-3.5 rounded-2xl border border-border/40 bg-card p-6 shadow-xs"
              >
                <label className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <span>{f.label}</span>
                  {f.required && (
                    <span className="font-bold text-red-500">*</span>
                  )}
                </label>

                {/* Text Field */}
                {f.type === "text" && (
                  <Input
                    placeholder={f.placeholder || "Enter answer..."}
                    value={val || ""}
                    onChange={(e) => handleTextChange(f.id, e.target.value)}
                    required={f.required}
                    className="h-9 border-input/80 bg-background text-xs focus:border-primary/50"
                  />
                )}

                {/* Paragraph Textarea */}
                {f.type === "textarea" && (
                  <textarea
                    placeholder={f.placeholder || "Enter detailed answer..."}
                    value={val || ""}
                    onChange={(e) => handleTextChange(f.id, e.target.value)}
                    required={f.required}
                    rows={4}
                    className="flex w-full rounded-md border border-input/80 bg-background px-3 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                  />
                )}

                {/* Radio Selection */}
                {f.type === "radio" && (
                  <div className="flex flex-col gap-2">
                    {f.options?.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground select-none hover:text-foreground"
                      >
                        <input
                          type="radio"
                          name={f.id}
                          checked={val === opt}
                          onChange={() => handleTextChange(f.id, opt)}
                          required={f.required && !val}
                          className="size-3.5 cursor-pointer border-input accent-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox List */}
                {f.type === "checkbox" && (
                  <div className="flex flex-col gap-2">
                    {f.options?.map((opt, oIdx) => {
                      const isChecked = (val || []).includes(opt)
                      return (
                        <label
                          key={oIdx}
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground select-none hover:text-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleCheckboxChange(f.id, opt, e.target.checked)
                            }
                            className="size-3.5 cursor-pointer rounded-sm border-input accent-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Dropdown Select */}
                {f.type === "select" && (
                  <Select
                    value={val || ""}
                    onValueChange={(value) => handleTextChange(f.id, value)}
                  >
                    <SelectTrigger className="h-9 w-full border-input/80 bg-background text-xs font-medium">
                      <SelectValue placeholder="Select option..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover text-xs">
                      {f.options?.map((opt: string, oIdx: number) => (
                        <SelectItem key={oIdx} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date Input */}
                {f.type === "date" && (
                  <Input
                    type="date"
                    value={val || ""}
                    onChange={(e) => handleTextChange(f.id, e.target.value)}
                    required={f.required}
                    className="h-9 border-input/80 bg-background text-xs focus:border-primary/50"
                  />
                )}

                {/* Number Input */}
                {f.type === "number" && (
                  <Input
                    type="number"
                    placeholder={f.placeholder || "Enter number..."}
                    value={val || ""}
                    onChange={(e) => handleTextChange(f.id, e.target.value)}
                    required={f.required}
                    className="h-9 border-input/80 bg-background text-xs focus:border-primary/50"
                  />
                )}

                {/* File Upload Component */}
                {f.type === "file" && (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      onChange={(e) =>
                        handleFileUpload(
                          f.id,
                          "file",
                          e.target.files?.[0] || null
                        )
                      }
                      required={f.required && !val}
                      className="h-9 cursor-pointer border-input/80 bg-background text-xs"
                    />
                    {val && (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                        <FileIcon className="h-3.5 w-3.5" />
                        <span>Uploaded File Mock</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload Component */}
                {f.type === "image" && (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(
                          f.id,
                          "image",
                          e.target.files?.[0] || null
                        )
                      }
                      required={f.required && !val}
                      className="h-9 cursor-pointer border-input/80 bg-background text-xs"
                    />
                    {val && (
                      <div className="mt-1 flex flex-col items-start gap-1">
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Image uploaded</span>
                        </div>
                        <img
                          src={val}
                          alt="Uploaded mockup"
                          className="h-24 w-24 rounded-lg border border-border object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Form submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold shadow-md transition-all hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Submitting Response...</span>
              </>
            ) : (
              <span>Submit Form</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
