"use client"

import { Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/hooks/use-sidebar"
import { NotificationMenu } from "./NotificationMenu"
import { UserMenu } from "./UserMenu"

export function Header() {
  const { toggleMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const breadcrumbs = useMemo(() => {
    const paths = pathname.split("/").filter(Boolean)
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "),
      href: "/" + paths.slice(0, index + 1).join("/"),
      isLast: index === paths.length - 1,
    }))
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Notifications */}
        <NotificationMenu />

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  )
}
