import { AppSidebar } from "../global/app-sidebar"
import { OrgGuard } from "../global/org-guard"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import Header from "../global/header"

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrgGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="sticky top-0">
          <header className="mt-2 mr-2 ml-2 flex h-8 shrink-0 items-center justify-between gap-2 rounded-lg border pr-1 pl-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8 md:ml-0">
            <Header />
          </header>
          <main className="pt-2 pr-2 pl-2 md:pl-0">
            <ScrollArea className="h-[calc(100dvh-56px)] w-full rounded-lg border p-2">
              {children}
            </ScrollArea>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgGuard>
  )
}
