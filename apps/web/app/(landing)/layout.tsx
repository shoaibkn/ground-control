import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ground Control — Collaborative Project Management for Teams",
  description:
    "Ground Control is a real-time collaborative task management platform with approval workflows, role-based permissions, form builder, audit trails, and more. Join the Beta today.",
  openGraph: {
    title: "Ground Control — Collaborative Project Management for Teams",
    description:
      "Real-time task management with approval workflows, role-based permissions, forms, audit trails, and team collaboration. Join the Beta.",
    type: "website",
  },
}

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <main>{children}</main>
}
