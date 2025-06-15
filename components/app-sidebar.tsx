"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notification-system"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  SettingsIcon,
  User,
  ChevronUp,
  LogIn,
  Users,
  BarChart2,
  DollarSign,
  FileSearch,
  Briefcase,
  FileText,
  Key,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import type { User as UserType } from "@/lib/models"

const dashboardItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
]

const projectMenuItems = [
  {
    href: "/projects",
    label: "Projects",
    icon: Briefcase,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
  },
  {
    href: "/quotations",
    label: "Quotations",
    icon: FileText,
  },
]

const pricingMenuItems = [
  {
    href: "/price-list",
    label: "Price List",
    icon: DollarSign,
  },
  {
    href: "/price-matcher",
    label: "Price Matcher",
    icon: FileSearch,
  },
  {
    href: "/matching",
    label: "Matching Jobs",
    icon: BarChart2,
  },
  {
    href: "/analysis",
    label: "Analysis",
    icon: BarChart2,
  },
]

const systemMenuItems = [
  {
    href: "/admin/settings",
    label: "Admin Settings",
    icon: Key,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchUser()
    }
  }, [pathname, mounted])

  const fetchUser = async () => {
    if (!mounted) return

    setIsLoadingUser(true)
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user || null)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      setCurrentUser(null)
      console.error("Failed to fetch user", error)
    } finally {
      setIsLoadingUser(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        toast({ title: "Logged Out", description: "You have been successfully logged out." })
        setCurrentUser(null)
        if (typeof window !== "undefined") {
          router.push("/login")
          router.refresh()
        }
      } else {
        toast({ title: "Logout Failed", description: "Could not log out.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Logout request failed.", variant: "destructive" })
    }
  }

  const authMenuItems = [
    {
      href: "/login",
      label: "Login",
      icon: LogIn,
    },
    {
      href: "/register",
      label: "Register",
      icon: User,
    },
  ]

  const renderMenuSection = (items: any[], title?: string) => (
    <SidebarGroup>
      {title && (
        <SidebarGroupLabel className="text-slate-400 font-medium group-data-[collapsible=icon]:hidden">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className="text-slate-300 hover:bg-slate-700 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white transition-all duration-200"
              >
                <a href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )

  if (!mounted) {
    return (
      <Sidebar className="bg-slate-900 border-r border-slate-700 shadow-xl">
        <SidebarHeader className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">BOQ Pricer Pro</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>{renderMenuSection(dashboardItems)}</SidebarContent>
      </Sidebar>
    )
  }

  if (!currentUser) {
    return (
      <Sidebar className="bg-slate-900 border-r border-slate-700 shadow-xl">
        <SidebarHeader className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white group-data-[collapsible=icon]:hidden">BOQ Pricer Pro</h1>
            <div className="group-data-[collapsible=icon]:mx-auto">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {renderMenuSection(dashboardItems)}
          {renderMenuSection(authMenuItems, "Authentication")}
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="bg-slate-900 border-r border-slate-700 shadow-xl">
      <SidebarHeader className="border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white group-data-[collapsible=icon]:hidden">BOQ Pricer Pro</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:ml-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="space-y-2">
        {renderMenuSection(dashboardItems)}
        {renderMenuSection(projectMenuItems, "Project Management")}
        {renderMenuSection(pricingMenuItems, "Pricing & Analysis")}
        {renderMenuSection(systemMenuItems, "System")}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-700 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200">
                  <User className="h-5 w-5" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{currentUser.name || "User"}</span>
                  <ChevronUp className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[var(--sidebar-width)] min-w-[calc(var(--sidebar-width-icon)_+_1rem)] shadow-xl"
              >
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/account")}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
