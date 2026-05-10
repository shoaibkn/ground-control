import LayoutProvider from "@/components/providers/layout-provider"
import { isAuthenticated } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hasToken = await isAuthenticated()

  if (!hasToken) {
    redirect("/sign-in")
  }
  return <LayoutProvider>{children}</LayoutProvider>
}
