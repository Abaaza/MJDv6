"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileLayoutProps {
  children: React.ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden bg-blue-900 hover:bg-blue-800 border border-blue-700 text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] bg-blue-900 border-blue-700">
          <div className="flex items-center justify-between p-4 border-b border-blue-700 bg-blue-900">
            <h2 className="text-lg font-semibold text-white">ConstructCRM</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-blue-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="bg-blue-900 h-full">
            <AppSidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 px-4 pb-4">{children}</main>
    </div>
  )
}
