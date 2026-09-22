"use client"

import { useState, useEffect, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Toaster } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeft,
  Shuffle,
  Upload,
  User,
  Mail,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Check,
} from "lucide-react"
import Link from "next/link"

const DICEBEAR_STYLES = [
  { id: "notionists", name: "Notionists", desc: "Notion style avatars" },
  {
    id: "notionists-neutral",
    name: "Notionists Neutral",
    desc: "Neutral Notion style heads",
  },
  { id: "glass", name: "Glass", desc: "Modern glassmorphic 3D designs" },
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarType, setAvatarType] = useState<"dicebear" | "upload">(
    "dicebear"
  )
  const [dicebearStyle, setDicebearStyle] = useState<
    "notionists" | "notionists-neutral" | "glass"
  >("notionists")
  const [dicebearSeed, setDicebearSeed] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [randomizing, setRandomizing] = useState(false)

  // Load user data on mount / session change
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
      const userImage = session.user.image || ""

      if (userImage.startsWith("data:image")) {
        setAvatarType("upload")
        setUploadedImage(userImage)
        setDicebearSeed(session.user.name || "avatar")
      } else if (userImage.includes("api.dicebear.com")) {
        setAvatarType("dicebear")
        const styleMatch = userImage.match(/\/9\.x\/([^/]+)\/svg/)
        const seedMatch = userImage.match(/\?seed=([^&]+)/)

        const style = styleMatch && styleMatch[1] ? styleMatch[1] : "notionists"
        const seed =
          seedMatch && seedMatch[1]
            ? decodeURIComponent(seedMatch[1])
            : "avatar"

        if (["notionists", "notionists-neutral", "glass"].includes(style)) {
          setDicebearStyle(style as any)
        }
        setDicebearSeed(seed)
      } else {
        setAvatarType("dicebear")
        setDicebearSeed(session.user.name || "avatar")
      }
    }
  }, [session])

  // Get current active avatar preview URL
  const getDicebearUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
  }

  const currentAvatarUrl =
    avatarType === "dicebear"
      ? getDicebearUrl(dicebearStyle, dicebearSeed)
      : uploadedImage || (session?.user?.image ?? "")

  // Randomize seed
  const handleRandomize = () => {
    setRandomizing(true)
    const randomSeed = Math.random().toString(36).substring(7)
    setDicebearSeed(randomSeed)
    setTimeout(() => setRandomizing(false), 300)
  }

  // Handle file reading
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.")
      return
    }

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string)
        setAvatarType("upload")
        toast.success("Image uploaded successfully.")
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name cannot be empty.")
      return
    }

    setIsSaving(true)
    try {
      const avatarToSave =
        avatarType === "dicebear"
          ? getDicebearUrl(dicebearStyle, dicebearSeed)
          : uploadedImage

      if (!avatarToSave) {
        toast.error("Please select or upload an avatar.")
        setIsSaving(false)
        return
      }

      const { error } = await (authClient as any).user.update({
        name: name.trim(),
        image: avatarToSave,
      })

      if (error) {
        toast.error(error.message || "Failed to update profile.")
      } else {
        toast.success("Profile updated successfully.")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "An unexpected error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isSessionPending) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 animate-in flex-col space-y-6 py-2 duration-300 fade-in-50 md:py-6">
      <Toaster />

      {/* Header Bar */}
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/settings"
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Settings</span>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Account Profile
          </h2>
          <p className="text-xs text-muted-foreground">
            Update your public credentials and customize your avatar
            representation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        {/* Left Side: Avatar Configuration */}
        <Card className="w-full border-border/80 bg-card/45 shadow-xs backdrop-blur-xs md:col-span-1">
          <CardHeader>
            <CardTitle>Your Avatar</CardTitle>
            <CardDescription>
              Select a dynamic style or upload your own.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Preview Box */}
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-32 w-32 rounded-2xl border border-border shadow-md ring-4 ring-primary/5 transition-transform select-none hover:scale-102">
                <AvatarImage
                  src={currentAvatarUrl}
                  alt="Avatar Preview"
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-accent text-3xl font-semibold text-accent-foreground">
                  {name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Selector Tabs */}
            <Tabs
              defaultValue={avatarType}
              value={avatarType}
              onValueChange={(val) => setAvatarType(val as any)}
              className="w-full"
            >
              <TabsList className="grid h-9 w-full grid-cols-2 bg-muted/60 p-1">
                <TabsTrigger
                  value="dicebear"
                  className="cursor-pointer py-1.5 text-xs"
                >
                  <Sparkles className="mr-1.5 size-3.5" />
                  Dicebear
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="cursor-pointer py-1.5 text-xs"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Custom
                </TabsTrigger>
              </TabsList>

              {/* Dicebear generator style options */}
              <TabsContent
                value="dicebear"
                className="mt-0 space-y-4 pt-3 focus-visible:ring-0"
              >
                <div className="grid grid-cols-3 gap-2">
                  {DICEBEAR_STYLES.map((style) => {
                    const previewUrl = getDicebearUrl(
                      style.id,
                      dicebearSeed || "avatar"
                    )
                    const isActive = dicebearStyle === style.id
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setDicebearStyle(style.id as any)}
                        className={cn(
                          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2 text-center transition-all hover:bg-accent/40",
                          isActive
                            ? "border-primary bg-primary/5 text-primary shadow-xs"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        <Avatar className="mb-1 h-10 w-10 rounded-lg border bg-muted/30">
                          <AvatarImage src={previewUrl} alt={style.name} />
                          <AvatarFallback className="rounded-lg text-[10px]">
                            TH
                          </AvatarFallback>
                        </Avatar>
                        <span className="w-full truncate text-[9px] font-medium">
                          {style.name}
                        </span>
                        {isActive && (
                          <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                            <Check className="size-2" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seed" className="text-xs">
                    Avatar Seed
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="seed"
                      value={dicebearSeed}
                      onChange={(e) => setDicebearSeed(e.target.value)}
                      placeholder="Type custom seed..."
                      className="h-8 flex-1 border-input/40 bg-input/10 text-xs dark:bg-input/20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleRandomize}
                      disabled={randomizing}
                      title="Randomize seed"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                    >
                      <Shuffle
                        className={cn("size-3.5", {
                          "animate-spin": randomizing,
                        })}
                      />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Base64 File Uploader */}
              <TabsContent
                value="upload"
                className="mt-0 space-y-4 pt-3 focus-visible:ring-0"
              >
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-all hover:bg-accent/20",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    uploadedImage
                      ? "border-solid border-primary/20 bg-accent/5"
                      : ""
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div className="flex w-full flex-col items-center gap-2 text-center">
                      <ImageIcon className="size-6 animate-pulse text-primary" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Custom Image Selected
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedImage(null)
                        }}
                        className="mt-1 h-7 cursor-pointer gap-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3" /> Remove Custom Image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-muted-foreground" />
                      <p className="text-center text-xs font-semibold text-foreground">
                        Drag & drop photo here
                      </p>
                      <p className="text-center text-[10px] text-muted-foreground">
                        Or click to search folders (Max 2MB)
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Account Details Form */}
        <Card className="w-full border-border/80 bg-card/45 shadow-xs backdrop-blur-xs md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Configure your public handle and contact endpoint.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              {/* Full Name input */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-xs">
                  Display Name
                </Label>
                <div className="relative">
                  <User className="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground/80" />
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. John Doe"
                    required
                    className="h-9 border-input/40 bg-input/10 pl-9 text-xs dark:bg-input/20"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-xs">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    id="profile-email"
                    value={email}
                    disabled
                    className="h-9 cursor-not-allowed border-input/40 bg-muted/40 pl-9 text-xs opacity-80"
                  />
                </div>
                <p className="mt-1 text-[10px] leading-normal text-muted-foreground/80">
                  Email updates are prohibited in order to maintain backend
                  security audits. Contact your administrator to revise
                  credentials.
                </p>
              </div>
            </CardContent>
            <CardFooter className="mt-2 flex justify-end border-t border-border/40 pt-4">
              <Button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="h-8 cursor-pointer text-xs font-semibold shadow-xs transition-transform hover:scale-[1.02]"
              >
                {isSaving && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
