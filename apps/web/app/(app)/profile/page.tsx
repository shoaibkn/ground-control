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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
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
  { id: "notionists-neutral", name: "Notionists Neutral", desc: "Neutral Notion style heads" },
  { id: "glass", name: "Glass", desc: "Modern glassmorphic 3D designs" },
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarType, setAvatarType] = useState<"dicebear" | "upload">("dicebear")
  const [dicebearStyle, setDicebearStyle] = useState<"notionists" | "notionists-neutral" | "glass">("notionists")
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
        const seed = seedMatch && seedMatch[1] ? decodeURIComponent(seedMatch[1]) : "avatar"
        
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

  const currentAvatarUrl = avatarType === "dicebear" 
    ? getDicebearUrl(dicebearStyle, dicebearSeed)
    : (uploadedImage || (session?.user?.image ?? ""))

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
      const avatarToSave = avatarType === "dicebear"
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
    <div className="flex flex-col w-full min-w-0 max-w-4xl mx-auto py-2 md:py-6 space-y-6 animate-in fade-in-50 duration-300">
      <Toaster />
      
      {/* Header Bar */}
      <div className="flex flex-col gap-2 w-full">
        <Link 
          href="/settings" 
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Settings</span>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Account Profile</h2>
          <p className="text-xs text-muted-foreground">
            Update your public credentials and customize your avatar representation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Configuration */}
        <Card className="w-full md:col-span-1 shadow-xs border-border/80 bg-card/45 backdrop-blur-xs">
          <CardHeader>
            <CardTitle>Your Avatar</CardTitle>
            <CardDescription>Select a dynamic style or upload your own.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Preview Box */}
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-32 w-32 rounded-2xl border border-border shadow-md ring-4 ring-primary/5 select-none transition-transform hover:scale-102">
                <AvatarImage src={currentAvatarUrl} alt="Avatar Preview" className="object-cover" />
                <AvatarFallback className="rounded-2xl text-3xl font-semibold bg-accent text-accent-foreground">
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
              <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-muted/60">
                <TabsTrigger value="dicebear" className="text-xs py-1.5 cursor-pointer">
                  <Sparkles className="size-3.5 mr-1.5" />
                  Dicebear
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs py-1.5 cursor-pointer">
                  <Upload className="size-3.5 mr-1.5" />
                  Custom
                </TabsTrigger>
              </TabsList>

              {/* Dicebear generator style options */}
              <TabsContent value="dicebear" className="space-y-4 pt-3 mt-0 focus-visible:ring-0">
                <div className="grid grid-cols-3 gap-2">
                  {DICEBEAR_STYLES.map((style) => {
                    const previewUrl = getDicebearUrl(style.id, dicebearSeed || "avatar")
                    const isActive = dicebearStyle === style.id
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setDicebearStyle(style.id as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all hover:bg-accent/40 cursor-pointer relative",
                          isActive
                            ? "border-primary bg-primary/5 text-primary shadow-xs"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        <Avatar className="h-10 w-10 mb-1 border rounded-lg bg-muted/30">
                          <AvatarImage src={previewUrl} alt={style.name} />
                          <AvatarFallback className="rounded-lg text-[10px]">TH</AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] font-medium truncate w-full">{style.name}</span>
                        {isActive && (
                          <span className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="size-2" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seed" className="text-xs">Avatar Seed</Label>
                  <div className="flex gap-2">
                    <Input
                      id="seed"
                      value={dicebearSeed}
                      onChange={(e) => setDicebearSeed(e.target.value)}
                      placeholder="Type custom seed..."
                      className="h-8 text-xs flex-1 bg-input/10 dark:bg-input/20 border-input/40"
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
                      <Shuffle className={cn("size-3.5", { "animate-spin": randomizing })} />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Base64 File Uploader */}
              <TabsContent value="upload" className="space-y-4 pt-3 mt-0 focus-visible:ring-0">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-accent/20",
                    dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    uploadedImage ? "border-solid bg-accent/5 border-primary/20" : ""
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
                    <div className="flex flex-col items-center gap-2 w-full text-center">
                      <ImageIcon className="size-6 text-primary animate-pulse" />
                      <span className="text-[10px] text-muted-foreground font-medium">Custom Image Selected</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedImage(null)
                        }}
                        className="text-destructive hover:bg-destructive/10 h-7 text-[10px] gap-1.5 mt-1 cursor-pointer"
                      >
                        <Trash2 className="size-3" /> Remove Custom Image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-muted-foreground" />
                      <p className="text-xs font-semibold text-center text-foreground">Drag & drop photo here</p>
                      <p className="text-[10px] text-muted-foreground text-center">Or click to search folders (Max 2MB)</p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Account Details Form */}
        <Card className="w-full md:col-span-2 shadow-xs border-border/80 bg-card/45 backdrop-blur-xs">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Configure your public handle and contact endpoint.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              {/* Full Name input */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-xs">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground/80" />
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. John Doe"
                    required
                    className="pl-9 h-9 text-xs bg-input/10 dark:bg-input/20 border-input/40"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    id="profile-email"
                    value={email}
                    disabled
                    className="pl-9 h-9 text-xs bg-muted/40 cursor-not-allowed opacity-80 border-input/40"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/80 mt-1 leading-normal">
                  Email updates are prohibited in order to maintain backend security audits. Contact your administrator to revise credentials.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/40 pt-4 mt-2">
              <Button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="text-xs font-semibold h-8 cursor-pointer shadow-xs hover:scale-[1.02] transition-transform"
              >
                {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
