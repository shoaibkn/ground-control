"use client"

import { OrgGuard } from "../global/org-guard"
import { AppSidebar } from "../global/app-sidebar"
import Header from "../global/header"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrgGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen flex-col overflow-hidden bg-background">
          {/* Top Bar / Header */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm">
            <Header />
          </header>
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-muted/5 p-4">
            <div className="mx-auto w-full">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgGuard>
  )
}
