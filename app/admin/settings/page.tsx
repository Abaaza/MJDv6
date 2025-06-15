"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  EyeOff,
  Save,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Server,
  HardDrive,
  Clock,
  AlertTriangle,
  Key,
  Bell,
  Settings,
  Building,
  Shield,
} from "lucide-react"

interface DatabaseStatus {
  success: boolean
  message: string
  data?: {
    connectionTime: string
    server: {
      version: string
      uptime: number
      host: string
      process: string
    }
    database: {
      name: string
      collections: number
      dataSize: number
      storageSize: number
      indexes: number
      objects: number
    }
    collections: Array<{
      name: string
      type: string
    }>
    environment: {
      nodeEnv: string
      hasMongoUri: boolean
      hasDbName: boolean
    }
  }
  error?: string
  environment?: {
    nodeEnv: string
    hasMongoUri: boolean
    hasDbName: boolean
    mongoUriPreview?: string
  }
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    cohere: false,
  })

  // Merged settings state
  const [settings, setSettings] = useState({
    // Company Information
    companyName: "Construction CRM",
    companyEmail: "admin@constructioncrm.com",
    companyPhone: "+1 (555) 123-4567",
    companyAddress: "123 Construction Ave, Builder City, BC 12345",

    // API Keys
    openaiApiKey: "",
    cohereApiKey: "",

    // System Settings
    currency: "USD",
    taxRate: "10",
    sessionTimeout: "7",
    defaultMatchingMode: "cohere",
    maxConcurrentJobs: "5",

    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    slackNotifications: false,
    weeklyReports: true,
    webhookUrl: "",
  })

  useEffect(() => {
    loadSettings()
    testDatabaseConnection()
  }, [])

  const loadSettings = async () => {
    try {
      console.log("📋 Loading admin settings...")

      // Try to load from API first
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings({
            ...settings,
            ...data,
            cohereApiKey: data.cohereApiKey === "***configured***" ? "" : data.cohereApiKey,
            openaiApiKey: data.openaiApiKey === "***configured***" ? "" : data.openaiApiKey,
          })
          return
        }
      } catch (error) {
        console.log("API not available, loading from localStorage")
      }

      // Fallback to localStorage
      const savedSettings = localStorage.getItem("admin-settings")
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error)
    }
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      console.log("💾 Saving admin settings...")

      // Try to save to API first
      try {
        const response = await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        })

        if (response.ok) {
          toast({
            title: "Settings Saved",
            description: "Admin settings have been saved successfully.",
          })
          return
        }
      } catch (error) {
        console.log("API not available, saving to localStorage")
      }

      // Fallback to localStorage
      const localCopy = { ...settings }
      if (localCopy.cohereApiKey === "***configured***") localCopy.cohereApiKey = ""
      if (localCopy.openaiApiKey === "***configured***") localCopy.openaiApiKey = ""
      localStorage.setItem("admin-settings", JSON.stringify(localCopy))
      toast({
        title: "Settings Saved",
        description: "Settings have been saved locally.",
      })
    } catch (error) {
      console.error("❌ Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save admin settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      setDbLoading(true)
      console.log("🔍 Testing database connection...")

      const response = await fetch("/api/test-db")
      const result = await response.json()

      console.log("📊 Database test result:", result)
      setDbStatus(result)
    } catch (error) {
      console.error("❌ Database test error:", error)
      setDbStatus({
        success: false,
        message: "Failed to test database connection",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setDbLoading(false)
    }
  }

  const testApiConnection = async (provider: string) => {
    try {
      console.log(`🧪 Testing ${provider} API connection...`)

      const response = await fetch(`/api/admin/test-api/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: provider === "openai" ? settings.openaiApiKey : settings.cohereApiKey,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: `${provider.toUpperCase()} API Test Successful`,
          description: result.message,
        })
      } else {
        toast({
          title: `${provider.toUpperCase()} API Test Failed`,
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "API Test Error",
        description: `Failed to test ${provider} API connection`,
        variant: "destructive",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Configure application settings, company info, and API keys</p>
        </div>
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Update your company details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Application Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                      <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                      <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                      <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                      <SelectItem value="AED">🇦🇪 AED - UAE Dirham</SelectItem>
                      <SelectItem value="SAR">🇸🇦 SAR - Saudi Riyal</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This currency will be used throughout the application for pricing and financial calculations.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys Configuration
              </CardTitle>
              <CardDescription>Configure your API keys for external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="openaiApiKey"
                        type={showApiKeys.openai ? "text" : "password"}
                        placeholder="sk-..."
                        value={settings.openaiApiKey}
                        onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys({ ...showApiKeys, openai: !showApiKeys.openai })}
                      >
                        {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => testApiConnection("openai")}
                      disabled={!settings.openaiApiKey}
                      variant="outline"
                    >
                      Test
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cohereApiKey">Cohere API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="cohereApiKey"
                        type={showApiKeys.cohere ? "text" : "password"}
                        placeholder="Your Cohere API key"
                        value={settings.cohereApiKey}
                        onChange={(e) => setSettings({ ...settings, cohereApiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowApiKeys({ ...showApiKeys, cohere: !showApiKeys.cohere })}
                      >
                        {showApiKeys.cohere ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => testApiConnection("cohere")}
                      disabled={!settings.cohereApiKey}
                      variant="outline"
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMatchingMode">Default Matching Mode</Label>
                  <Select
                    value={settings.defaultMatchingMode}
                    onValueChange={(value) => setSettings({ ...settings, defaultMatchingMode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select matching mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cohere">Cohere - Fast and accurate</SelectItem>
                      <SelectItem value="openai">OpenAI - High precision</SelectItem>
                      <SelectItem value="hybrid">Hybrid - Best of both</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose the default AI model for price matching operations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentJobs">Max Concurrent Jobs</Label>
                  <Input
                    id="maxConcurrentJobs"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxConcurrentJobs}
                    onChange={(e) => setSettings({ ...settings, maxConcurrentJobs: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of price matching jobs that can run simultaneously.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Default tax rate applied to quotations and invoices.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (days)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    How long users stay logged in before requiring re-authentication.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Status Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                MongoDB Connection Status
                <div className="flex items-center gap-2 ml-auto">
                  {dbStatus?.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button onClick={testDatabaseConnection} disabled={dbLoading} size="sm" variant="outline">
                    {dbLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Database configuration and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dbLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Testing database connection...</span>
                </div>
              ) : dbStatus ? (
                <div className="space-y-4">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {dbStatus.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{dbStatus.success ? "Connected" : "Connection Failed"}</div>
                        <div className="text-sm text-muted-foreground">{dbStatus.message}</div>
                      </div>
                    </div>
                    {dbStatus.data?.connectionTime && (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {dbStatus.data.connectionTime}
                      </Badge>
                    )}
                  </div>

                  {/* Server Information */}
                  {dbStatus.success && dbStatus.data && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            Server Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Version:</span>
                            <span className="font-mono">{dbStatus.data.server.version}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Host:</span>
                            <span className="font-mono text-xs">{dbStatus.data.server.host}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Process:</span>
                            <span className="font-mono">{dbStatus.data.server.process}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Uptime:</span>
                            <span>{formatUptime(dbStatus.data.server.uptime)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Database Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Database:</span>
                            <span className="font-mono">{dbStatus.data.database.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Collections:</span>
                            <span>{dbStatus.data.database.collections}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Documents:</span>
                            <span>{dbStatus.data.database.objects.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Data Size:</span>
                            <span>{formatBytes(dbStatus.data.database.dataSize)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Storage:</span>
                            <span>{formatBytes(dbStatus.data.database.storageSize)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Indexes:</span>
                            <span>{dbStatus.data.database.indexes}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Collections */}
                  {dbStatus.success && dbStatus.data?.collections && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Collections ({dbStatus.data.collections.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {dbStatus.data.collections.map((collection, index) => (
                            <Badge key={index} variant="outline">
                              {collection.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Environment Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Environment Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Node Environment:</span>
                        <Badge variant="outline">
                          {(dbStatus.data?.environment || dbStatus.environment)?.nodeEnv || "unknown"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">MongoDB URI:</span>
                        <Badge
                          variant={
                            (dbStatus.data?.environment || dbStatus.environment)?.hasMongoUri
                              ? "default"
                              : "destructive"
                          }
                        >
                          {(dbStatus.data?.environment || dbStatus.environment)?.hasMongoUri ? "Configured" : "Missing"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Database Name:</span>
                        <Badge
                          variant={
                            (dbStatus.data?.environment || dbStatus.environment)?.hasDbName ? "default" : "secondary"
                          }
                        >
                          {(dbStatus.data?.environment || dbStatus.environment)?.hasDbName
                            ? "Configured"
                            : "Using Default"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error Information */}
                  {!dbStatus.success && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Connection Error:</strong> {dbStatus.error}
                        {dbStatus.environment?.mongoUriPreview && (
                          <div className="mt-2">
                            <strong>URI Preview:</strong>
                            <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                              {dbStatus.environment.mongoUriPreview}
                            </div>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Test Connection" to check your database status
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                  <Button
                    variant={settings.emailNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  >
                    {settings.emailNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive browser push notifications</div>
                  </div>
                  <Button
                    variant={settings.pushNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                  >
                    {settings.pushNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Slack Notifications</div>
                    <div className="text-sm text-muted-foreground">Send notifications to Slack</div>
                  </div>
                  <Button
                    variant={settings.slackNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, slackNotifications: !settings.slackNotifications })}
                  >
                    {settings.slackNotifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-muted-foreground">Receive weekly summary reports</div>
                  </div>
                  <Button
                    variant={settings.weeklyReports ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, weeklyReports: !settings.weeklyReports })}
                  >
                    {settings.weeklyReports ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://hooks.slack.com/services/..."
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Webhook URL for external notifications (Slack, Discord, etc.)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your security preferences and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings are currently managed through environment variables and admin controls. Future
                  updates will include user role management, two-factor authentication, and audit logging.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
