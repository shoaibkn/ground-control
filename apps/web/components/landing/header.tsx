"use client"

import { Menu, Loader2, LogOut, User, Rocket, CheckCircle2, FileText, Shield, Activity, ClipboardList } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: React.ReactNode
  items?: MenuItem[]
}

interface Navbar1Props {
  className?: string
  logo?: {
    url: string
    src: string
    alt: string
    title: string
    className?: string
  }
  menu?: MenuItem[]
  auth?: {
    login: {
      title: string
      url: string
    }
    signup: {
      title: string
      url: string
    }
  }
}

const Navbar1 = ({
  logo = {
    url: "/",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
    alt: "logo",
    title: "Ground Control",
  },
  menu = [
    { title: "Home", url: "/" },
    {
      title: "Features",
      url: "#features",
      items: [
        {
          title: "Task Management",
          description: "Multi-view tasks with status workflows, priorities, and recurring schedules",
          icon: <CheckCircle2 className="size-5 shrink-0" />,
          url: "#features",
        },
        {
          title: "Approval Workflows",
          description: "Create approvals, assign approvers, and track decisions in real-time",
          icon: <ClipboardList className="size-5 shrink-0" />,
          url: "#features",
        },
        {
          title: "Forms Builder",
          description: "Dynamic form builder with shareable forms linked to tasks and approvals",
          icon: <FileText className="size-5 shrink-0" />,
          url: "#features",
        },
        {
          title: "Role-Based Permissions",
          description: "Granular permission matrices per organization with admin/member/guest control",
          icon: <Shield className="size-5 shrink-0" />,
          url: "#features",
        },
        {
          title: "Real-Time Collaboration",
          description: "Chat threads, file attachments, reactions, and read receipts",
          icon: <Activity className="size-5 shrink-0" />,
          url: "#features",
        },
        {
          title: "Audit Trail",
          description: "Comprehensive audit logging, notifications, and overdue task monitoring",
          icon: <Rocket className="size-5 shrink-0" />,
          url: "#features",
        },
      ],
    },
    { title: "How It Works", url: "#how-it-works" },
    { title: "Beta", url: "#beta" },
  ],
  auth = {
    login: { title: "Login", url: "/sign-in" },
    signup: { title: "Sign up", url: "/sign-up" },
  },
  className,
}: Navbar1Props) => {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in")
        },
      },
    })
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url.startsWith("#")) {
      e.preventDefault()
      const el = document.getElementById(url.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <section className={cn("py-4", className)}>
      <div className="container">
        {/* Desktop Menu */}
        <nav className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8 dark:invert"
                alt={logo.alt}
              />
              <span className="text-lg font-semibold tracking-tighter">
                {logo.title}
              </span>
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item, handleSmoothScroll))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {isPending ? (
              <Loader2 className="animate-spin size-4 text-muted-foreground" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4" />
                    <span>{session.user.name}</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Logout
                </Button>
                <Button size="sm" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={auth.login.url}>{auth.login.title}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={auth.signup.url}>{auth.signup.title}</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={logo.url} className="flex items-center gap-2">
              <img
                src={logo.src}
                className="max-h-8 dark:invert"
                alt={logo.alt}
              />
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className="flex items-center gap-2">
                      <img
                        src={logo.src}
                        className="max-h-8 dark:invert"
                        alt={logo.alt}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  {/* Legal Links */}
                  <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                    <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                    <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </div>

                  <div className="flex flex-col gap-3">
                    {isPending ? (
                      <Loader2 className="animate-spin size-4 self-center" />
                    ) : session ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <User className="size-4" />
                            <span>{session.user.name}</span>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                          Logout
                        </Button>
                        <Button asChild>
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline">
                          <Link href={auth.login.url}>{auth.login.title}</Link>
                        </Button>
                        <Button asChild>
                          <Link href={auth.signup.url}>{auth.signup.title}</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  )
}

const renderMenuItem = (
  item: MenuItem,
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void
) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} onSmoothScroll={handleSmoothScroll} />
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        asChild
        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground focus:bg-muted focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <Link
          href={item.url}
          onClick={(e) => handleSmoothScroll(e, item.url)}
        >
          {item.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Link key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  )
}

const SubMenuLink = ({
  item,
  onSmoothScroll,
}: {
  item: MenuItem
  onSmoothScroll?: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void
}) => {
  return (
    <Link
      className="flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground"
      href={item.url}
      onClick={onSmoothScroll ? (e) => onSmoothScroll(e, item.url) : undefined}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  )
}

export { Navbar1 }
