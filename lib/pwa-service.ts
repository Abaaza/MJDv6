interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null
  private isInstalled = false
  private isStandalone = false

  constructor() {
    if (typeof window !== "undefined") {
      this.init()
    }
  }

  private init() {
    // Check if app is already installed
    this.isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      this.deferredPrompt = e as any
      this.notifyInstallAvailable()
    })

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true
      this.deferredPrompt = null
      this.notifyAppInstalled()
    })

    // Register service worker
    this.registerServiceWorker()
  }

  private async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered:", registration)

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                this.notifyUpdateAvailable()
              }
            })
          }
        })
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
        return true
      } else {
        console.log("User dismissed the install prompt")
        return false
      }
    } catch (error) {
      console.error("Error showing install prompt:", error)
      return false
    } finally {
      this.deferredPrompt = null
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled && !this.isStandalone
  }

  isAppInstalled(): boolean {
    return this.isInstalled || this.isStandalone
  }

  private notifyInstallAvailable() {
    // Dispatch custom event for install availability
    window.dispatchEvent(new CustomEvent("pwa-install-available"))
  }

  private notifyAppInstalled() {
    // Dispatch custom event for successful installation
    window.dispatchEvent(new CustomEvent("pwa-installed"))
  }

  private notifyUpdateAvailable() {
    // Dispatch custom event for app update
    window.dispatchEvent(new CustomEvent("pwa-update-available"))
  }

  async updateApp() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
        window.location.reload()
      }
    }
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }

  // Push notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  async showNotification(title: string, options?: NotificationOptions) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-72x72.png",
        ...options,
      })
    } else {
      new Notification(title, options)
    }
  }

  // App shortcuts
  getAppShortcuts() {
    return [
      {
        name: "New Project",
        short_name: "New Project",
        description: "Create a new construction project",
        url: "/projects/new",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Price Matching",
        short_name: "Match Prices",
        description: "Start price matching process",
        url: "/price-matcher",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Clients",
        short_name: "Clients",
        description: "Manage your clients",
        url: "/clients",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
    ]
  }
}

export const pwaService = new PWAService()
