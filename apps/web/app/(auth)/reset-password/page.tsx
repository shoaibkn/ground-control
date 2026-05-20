"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import Link from "next/link"
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage(
        "Invalid reset token. Please request a new password reset link."
      )
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (password !== confirmPassword) {
      setStatus("error")
      setErrorMessage("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setStatus("error")
      setErrorMessage("Password must be at least 8 characters long.")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      })

      if (error) {
        setStatus("error")
        setErrorMessage(
          error.message || "Failed to reset password. The link may have expired."
        )
      } else {
        setStatus("success")
        // Redirect to sign-in after a short delay
        setTimeout(() => {
          router.push("/sign-in")
        }, 3000)
      }
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(
        err.message || "An unexpected error occurred. Please try again later."
      )
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="p-6 md:p-8">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-6">
                    <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                      <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Password Reset</h2>
                    <p className="text-sm text-muted-foreground text-balance">
                      Your password has been reset successfully. Redirecting you
                      to the sign-in page...
                    </p>
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
                    >
                      Go to Login now <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                  </div>
                ) : !token ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-6">
                    <div className="rounded-full bg-rose-100 p-3 dark:bg-rose-900/30">
                      <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Invalid Link</h2>
                    <p className="text-sm text-muted-foreground text-balance">
                      {errorMessage}
                    </p>
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
                    >
                      Request a new link
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <FieldGroup>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold">Reset Password</h1>
                        <p className="text-balance text-muted-foreground">
                          Enter your new password below
                        </p>
                      </div>

                      {status === "error" && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {errorMessage}
                        </div>
                      )}

                      <Field>
                        <FieldLabel htmlFor="password">New Password</FieldLabel>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={status === "loading"}
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="confirm-password">
                          Confirm New Password
                        </FieldLabel>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={status === "loading"}
                        />
                      </Field>

                      <Field>
                        <Button
                          type="submit"
                          disabled={
                            status === "loading" ||
                            !password ||
                            !confirmPassword
                          }
                          className="w-full"
                        >
                          {status === "loading" ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </Field>

                      <FieldDescription className="text-center">
                        Remember your password?{" "}
                        <Link href="/sign-in">Login</Link>
                      </FieldDescription>
                    </FieldGroup>
                  </form>
                )}
              </div>
              <div className="relative hidden bg-muted md:block">
                <img
                  src="/placeholder.svg"
                  alt="Image"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
