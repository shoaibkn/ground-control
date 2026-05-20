"use client"

import { useState, useEffect } from "react"
import { useConvex } from "convex/react"
import { api } from "../../../../../packages/backend/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import Link from "next/link"
import { Loader2, ArrowLeft, Mail, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const convex = useConvex()
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"form" | "success" | "google-only">("form")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [redirectTo, setRedirectTo] = useState("/")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const dest = params.get("redirectTo")
      if (dest) {
        setRedirectTo(dest)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      // 1. Check account providers on Convex backend
      const result = await convex.query(api.users.getUserProviders, { email })

      if (!result.exists) {
        setErrorMessage("No account was found with this email address.")
        setIsLoading(false)
        return
      }

      const hasGoogle = result.providers.includes("google")
      const hasPassword = result.providers.includes("credential")

      // 2. If it is only connected to Google and has no password
      if (hasGoogle && !hasPassword) {
        setStep("google-only")
        setIsLoading(false)
        return
      }

      // 3. Otherwise trigger forgot password via Better Auth
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: window.location.origin + "/reset-password",
      })

      if (error) {
        setErrorMessage(
          error.message || "Failed to send reset link. Please try again."
        )
      } else {
        setStep("success")
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected error occurred. Please try again later."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMessage("")
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    })
    if (error) {
      setErrorMessage(error.message || "Failed to sign in with Google.")
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <div className="p-6 md:p-8">
                {step === "success" ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-6">
                    <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                      <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="text-sm text-muted-foreground text-balance">
                      We've sent a password reset link to <strong>{email}</strong>.
                      Please click the link in that email to reset your password.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => setStep("form")}
                    >
                      Resend Email
                    </Button>
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                  </div>
                ) : step === "google-only" ? (
                  <div className="flex flex-col space-y-4 py-4">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-6 w-6 shrink-0" />
                      <h2 className="text-xl font-bold">Google Login Required</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The account for <strong>{email}</strong> is registered using
                      Google Sign-In. You do not have an email/password login.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please sign in with your Google account, or contact your
                      administrator if you need assistance.
                    </p>

                    {errorMessage && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {errorMessage}
                      </div>
                    )}

                    <Button
                      className="w-full mt-4"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                              fill="currentColor"
                            />
                          </svg>
                          Login with Google
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setStep("form")}
                      disabled={isLoading}
                    >
                      Try another email
                    </Button>

                    <Link
                      href="/sign-in"
                      className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <FieldGroup>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold">Forgot Password</h1>
                        <p className="text-balance text-muted-foreground">
                          Enter your email to receive a password reset link
                        </p>
                      </div>

                      {errorMessage && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {errorMessage}
                        </div>
                      )}

                      <Field>
                        <FieldLabel htmlFor="email">Email Address</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </Field>

                      <Field>
                        <Button
                          type="submit"
                          disabled={isLoading || !email}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </Field>

                      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                        Or login with
                      </FieldSeparator>

                      <Field className="grid grid-cols-1">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5 mr-2"
                          >
                            <path
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                              fill="currentColor"
                            />
                          </svg>
                          <span>Login with Google</span>
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
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <Link href="#">Terms of Service</Link> and{" "}
            <Link href="#">Privacy Policy</Link>.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}
