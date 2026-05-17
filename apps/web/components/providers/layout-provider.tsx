import { AppSidebar } from "../global/app-sidebar"
import { OrgGuard } from "../global/org-guard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area"
import { ThemeToggle } from "../global/theme-toggle"

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
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Build Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ThemeToggle />
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
