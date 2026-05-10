import { Navbar1 } from "@/components/landing/header"
import { Hero3 } from "@/components/landing/hero"

export default function LandingPage() {
  return (
    <main className="p-12">
      <Navbar1 />
      <Hero3 className="w-full border" />
    </main>
  )
}
