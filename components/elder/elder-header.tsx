"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ElderEaseLogo } from "@/components/elderease-logo"
import { Button } from "@/components/ui/button"
import { Home, Hospital, BookOpen, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function ElderHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: "/elder/home", label: "Home", icon: Home },
    { href: "/elder/clinic", label: "Clinic", icon: Hospital },
    { href: "/elder/tutorial", label: "Tutorial", icon: BookOpen },
    { href: "/elder/event", label: "Event", icon: Calendar },
    { href: "/elder/profile", label: "Profile", icon: User },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/elder/home">
          <ElderEaseLogo size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn("gap-2 text-base", isActive && "bg-primary text-primary-foreground")}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="md:hidden flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "default" : "ghost"} size="icon">
                  <Icon className="w-5 h-5" />
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
