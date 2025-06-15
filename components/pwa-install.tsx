"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Smartphone, X, Wifi, WifiOff } from "lucide-react"
import { pwaService } from "@/lib/pwa-service"
import { useToast } from "@/components/ui/use-toast"

export function PWAInstall() {
  const { toast } = useToast()
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check initial state
    setCanInstall(pwaService.canInstall())
    setIsInstalled(pwaService.isAppInstalled())
    setIsOnline(pwaService.isOnline())

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setCanInstall(true)
      setShowPrompt(true)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setShowPrompt(false)
      toast({
        title: "App Installed!",
        description: "Construction CRM has been installed on your device",
      })
    }

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true)
      toast({
        title: "Update Available",
        description: "A new version of the app is available",
        action: (
          <Button size="sm" onClick={handleUpdate}>
            Update
          </Button>
        ),
      })
    }

    window.addEventListener("pwa-install-available", handleInstallAvailable)
    window.addEventListener("pwa-installed", handleInstalled)
    window.addEventListener("pwa-update-available", handleUpdateAvailable)

    // Listen for online/offline status
    const unsubscribe = pwaService.onOnlineStatusChange(setIsOnline)

    return () => {
      window.removeEventListener("pwa-install-available", handleInstallAvailable)
      window.removeEventListener("pwa-installed", handleInstalled)
      window.removeEventListener("pwa-update-available", handleUpdateAvailable)
      unsubscribe()
    }
  }, [toast])

  const handleInstall = async () => {
    const success = await pwaService.showInstallPrompt()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleUpdate = async () => {
    await pwaService.updateApp()
    setUpdateAvailable(false)
  }

  const requestNotifications = async () => {
    const granted = await pwaService.requestNotificationPermission()
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive notifications for important updates",
      })

      // Show test notification
      await pwaService.showNotification("Welcome to Construction CRM!", {
        body: "You'll receive notifications for project updates and system alerts",
        tag: "welcome",
      })
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Enable notifications in your browser settings to receive updates",
        variant: "destructive",
      })
    }
  }

  if (isInstalled && !updateAvailable) {
    return null
  }

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            You're offline. Some features may be limited.
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showPrompt && canInstall && (
        <Card className="fixed bottom-4 right-4 w-80 z-40 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Install App</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPrompt(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Get the full experience with our mobile app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Push notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Native app experience</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
              <Button variant="outline" onClick={requestNotifications}>
                <Wifi className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Card className="fixed bottom-4 left-4 w-80 z-40 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Update Available</CardTitle>
              </div>
              <Badge variant="secondary">New</Badge>
            </div>
            <CardDescription>A new version with improvements is ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} className="flex-1">
                Update Now
              </Button>
              <Button variant="outline" onClick={() => setUpdateAvailable(false)}>
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
