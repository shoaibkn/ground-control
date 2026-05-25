"use client"

import { Button } from "@workspace/ui/components/button"
import { ChevronLeft } from "lucide-react"
import { NavAppUser } from "./nav-app-user"
import Notifications from "./notifications"
import { useRouter, usePathname } from "next/navigation"
import { usePageStore } from "@/store/use-page-store"

export default function PageHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const customTitle = usePageStore((state) => state.title)

  const getPathTitle = () => {
    if (pathname.includes("/dashboard")) return "Dashboard"
    if (pathname.includes("/tasks")) return "Tasks"
    if (pathname.includes("/approvals")) return "Approvals"
    if (pathname.includes("/chats")) return "Chats"
    if (pathname.includes("/settings")) return "Settings"
    return "Ground Control"
  }

  const title = customTitle || getPathTitle()

  return (
    <nav className="sticky top-0 z-40 flex h-12 w-full flex-row items-center justify-between rounded-lg border bg-background/95 px-2 backdrop-blur-sm">
      <div className="flex flex-row items-center gap-4">
        {/* Button to go back to last page */}
        <Button
          variant={"outline"}
          size="icon-lg"
          className="h-8 w-8 cursor-pointer rounded-full p-0"
          onClick={() => router.back()}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {/* Page Title */}
        <h1 className="text-2xl">{title}</h1>
      </div>
      <div className="flex flex-row items-center gap-4">
        {/* Notification and Theme Toggle */}
        {/* <div className="hidden md:block">
          <Notifications />
        </div> */}

        {/* User Toggle */}
        {/* Implement Notifications, Theme toggle, Organisation switching inside NavAppUser */}
        <NavAppUser
          user={{
            name: "John Doe",
            email: "[EMAIL_ADDRESS]",
            avatar: "https://github.com/shadcn.png",
          }}
        />
      </div>
    </nav>
  )
}
