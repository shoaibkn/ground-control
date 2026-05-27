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
          {/* Main Content Area containing the sticky header */}
          <main className="flex-1 overflow-y-auto bg-muted/5 p-4 pt-4">
            <div className="mx-auto w-full space-y-4">
              {/* Top Bar / Header */}
              <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background/50 px-4 shadow-xs backdrop-blur-md">
                <Header />
              </header>
              <div>{children}</div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgGuard>
  )
}
