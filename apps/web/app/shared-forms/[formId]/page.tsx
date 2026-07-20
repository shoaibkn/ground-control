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
  ImageIcon
} from "lucide-react"

export default function SharedFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = typeof params.formId === "string" ? (params.formId as any) : undefined

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
      router.push(`/sign-in?redirectTo=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [session, sessionPending, router])

  // Initialize answers map when form loads
  useEffect(() => {
    if (form) {
      const initial: Record<string, any> = {}
      form.fields.forEach(f => {
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
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading form details...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border max-w-sm w-full p-6 rounded-2xl shadow-xl text-center flex flex-col items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
            <Lock className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground">Authentication Required</h2>
            <p className="text-xs text-muted-foreground">You must be logged in to view and submit this form.</p>
          </div>
          <Button onClick={() => router.push(`/sign-in?redirectTo=${encodeURIComponent(window.location.pathname)}`)} className="w-full text-xs font-semibold h-9 rounded-xl">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (form === null) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border max-w-sm w-full p-6 rounded-2xl shadow-xl text-center flex flex-col items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground">Form Not Found</h2>
            <p className="text-xs text-muted-foreground">This form does not exist, has been deleted, or you do not have permission to view it.</p>
          </div>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full text-xs font-semibold h-9 rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Value change helpers
  const handleTextChange = (fieldId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: val }))
  }

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const current = answers[fieldId] || []
    const updated = checked 
      ? [...current, option] 
      : current.filter((o: string) => o !== option)
    setAnswers(prev => ({ ...prev, [fieldId]: updated }))
  }

  const handleFileUpload = (fieldId: string, type: "file" | "image", file: File | null) => {
    if (!file) {
      setAnswers(prev => ({ ...prev, [fieldId]: "" }))
      return
    }
    
    // Simulate R2 upload key
    if (type === "image") {
      setAnswers(prev => ({ 
        ...prev, 
        [fieldId]: `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`
      }))
    } else {
      setAnswers(prev => ({ 
        ...prev, 
        [fieldId]: `https://ground-control.mock/attachments/${Date.now()}-${file.name}` 
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
      const payloadAnswers = Object.entries(answers).map(([fieldId, value]) => ({
        fieldId,
        value
      }))

      await submitFormResponse({
        formId: form._id,
        answers: payloadAnswers,
        organizationId: form.organizationId
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
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border/80 max-w-md w-full p-8 rounded-2xl shadow-xl text-center flex flex-col items-center gap-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-foreground">Submission Received</h2>
            <p className="text-xs text-muted-foreground">Your responses to "{form.title}" have been saved successfully.</p>
          </div>
          <Button onClick={() => router.push("/dashboard")} className="w-full text-xs font-semibold h-9 rounded-xl mt-2">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full flex flex-col gap-4">
        {/* Form header card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-3 shadow-sm border-t-8 border-t-primary">
          <h1 className="text-xl font-bold text-foreground">{form.title}</h1>
          {form.description && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {form.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1.5 border-t border-border/40 mt-1 select-none">
            <span>Responding as:</span>
            <Badge variant="secondary" className="text-[9px] px-2 rounded-full font-bold bg-muted/65 text-muted-foreground border-border/30">
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
                className="bg-card border border-border/40 rounded-2xl p-6 shadow-xs flex flex-col gap-3.5"
              >
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>{f.label}</span>
                  {f.required && <span className="text-red-500 font-bold">*</span>}
                </label>

                {/* Text Field */}
                {f.type === "text" && (
                  <Input
                    placeholder={f.placeholder || "Enter answer..."}
                    value={val || ""}
                    onChange={(e) => handleTextChange(f.id, e.target.value)}
                    required={f.required}
                    className="h-9 text-xs bg-background border-input/80 focus:border-primary/50"
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
                    className="flex w-full rounded-md border border-input/80 bg-background px-3 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                )}

                {/* Radio Selection */}
                {f.type === "radio" && (
                  <div className="flex flex-col gap-2">
                    {f.options?.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none">
                        <input
                          type="radio"
                          name={f.id}
                          checked={val === opt}
                          onChange={() => handleTextChange(f.id, opt)}
                          required={f.required && !val}
                          className="size-3.5 border-input accent-primary cursor-pointer"
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
                        <label key={oIdx} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(f.id, opt, e.target.checked)}
                            className="size-3.5 rounded-sm border-input accent-primary cursor-pointer"
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
                    <SelectTrigger className="h-9 w-full text-xs font-medium bg-background border-input/80">
                      <SelectValue placeholder="Select option..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs bg-popover z-50">
                      {f.options?.map((opt: string, oIdx: number) => (
                        <SelectItem key={oIdx} value={opt}>{opt}</SelectItem>
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
                    className="h-9 text-xs bg-background border-input/80 focus:border-primary/50"
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
                    className="h-9 text-xs bg-background border-input/80 focus:border-primary/50"
                  />
                )}

                {/* File Upload Component */}
                {f.type === "file" && (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileUpload(f.id, "file", e.target.files?.[0] || null)}
                      required={f.required && !val}
                      className="text-xs h-9 bg-background border-input/80 cursor-pointer"
                    />
                    {val && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold">
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
                      onChange={(e) => handleFileUpload(f.id, "image", e.target.files?.[0] || null)}
                      required={f.required && !val}
                      className="text-xs h-9 bg-background border-input/80 cursor-pointer"
                    />
                    {val && (
                      <div className="mt-1 flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold mb-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Image uploaded</span>
                        </div>
                        <img 
                          src={val} 
                          alt="Uploaded mockup" 
                          className="h-24 w-24 object-cover rounded-lg border border-border"
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
            className="h-10 text-xs font-bold w-full rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
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
