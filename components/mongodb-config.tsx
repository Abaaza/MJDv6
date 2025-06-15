"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  Clock,
  FileText,
} from "lucide-react"

interface DatabaseConfig {
  mongoUri: string | null
  dbName: string
  hasConnection: boolean
}

interface ConnectionTest {
  success: boolean
  connectionTime: number
  server?: {
    version: string
    uptime: number
    host: string
    process: string
  }
  database?: {
    name: string
    collections: number
    dataSize: number
    storageSize: number
    indexes: number
    objects: number
  }
  collections?: Array<{
    name: string
    type: string
  }>
  error?: string
}

export function MongoDBConfig() {
  const { toast } = useToast()
  const [config, setConfig] = useState<DatabaseConfig | null>(null)
  const [connectionTest, setConnectionTest] = useState<ConnectionTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showUri, setShowUri] = useState(false)

  // Form state
  const [mongoUri, setMongoUri] = useState("")
  const [dbName, setDbName] = useState("")

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      console.log("🔧 Loading database configuration...")

      const response = await fetch("/api/admin/database-config")
      const data = await response.json()

      if (response.ok) {
        console.log("✅ Config loaded:", data)
        setConfig(data.config)
        setConnectionTest(data.connectionTest)
        setDbName(data.config.dbName)
      } else {
        console.error("❌ Failed to load config:", data)
        toast({
          title: "Error",
          description: "Failed to load database configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error loading config:", error)
      toast({
        title: "Error",
        description: "Failed to load database configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (testOnly = true) => {
    if (!mongoUri || !dbName) {
      toast({
        title: "Validation Error",
        description: "Please provide both MongoDB URI and database name",
        variant: "destructive",
      })
      return
    }

    try {
      setTesting(true)
      console.log("🧪 Testing database connection...")

      const response = await fetch("/api/admin/database-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mongoUri,
          dbName,
          testOnly,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("✅ Connection test result:", data)
        setConnectionTest(data.testResult)

        toast({
          title: testOnly ? "Connection Test Successful" : "Configuration Updated",
          description: data.message,
        })

        if (!testOnly) {
          await loadConfig()
        }
      } else {
        console.error("❌ Connection test failed:", data)
        setConnectionTest(data.testResult || { success: false, error: data.error, connectionTime: 0 })

        toast({
          title: "Connection Test Failed",
          description: data.message || "Failed to connect to database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error testing connection:", error)
      toast({
        title: "Error",
        description: "Failed to test database connection",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const updateConfig = async () => {
    setUpdating(true)
    await testConnection(false)
    setUpdating(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading database configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Database Status
          </CardTitle>
          <CardDescription>Current MongoDB connection status and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Connection Status:</span>
            {config?.hasConnection ? (
              connectionTest?.success ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Connection Failed
                </Badge>
              )
            ) : (
              <Badge variant="secondary">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">MongoDB URI:</span>
            <span className="text-sm text-muted-foreground">{config?.mongoUri || "Not configured"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Database Name:</span>
            <span className="text-sm">{config?.dbName}</span>
          </div>

          {connectionTest && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Response Time:</span>
              <span className="text-sm">{connectionTest.connectionTime}ms</span>
            </div>
          )}

          <Button onClick={loadConfig} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Connection Details */}
      {connectionTest?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionTest.server && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Server Version</Label>
                  <p className="text-sm text-muted-foreground">{connectionTest.server.version}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Host</Label>
                  <p className="text-sm text-muted-foreground">{connectionTest.server.host}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Uptime</Label>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatUptime(connectionTest.server.uptime)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Process</Label>
                  <p className="text-sm text-muted-foreground">{connectionTest.server.process}</p>
                </div>
              </div>
            )}

            {connectionTest.database && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Collections</Label>
                    <p className="text-sm text-muted-foreground">
                      <FileText className="h-3 w-3 inline mr-1" />
                      {connectionTest.database.collections}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Documents</Label>
                    <p className="text-sm text-muted-foreground">{connectionTest.database.objects.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data Size</Label>
                    <p className="text-sm text-muted-foreground">
                      <HardDrive className="h-3 w-3 inline mr-1" />
                      {formatBytes(connectionTest.database.dataSize)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Storage Size</Label>
                    <p className="text-sm text-muted-foreground">{formatBytes(connectionTest.database.storageSize)}</p>
                  </div>
                </div>
              </>
            )}

            {connectionTest.collections && connectionTest.collections.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium mb-2 block">Collections</Label>
                  <div className="flex flex-wrap gap-2">
                    {connectionTest.collections.map((collection) => (
                      <Badge key={collection.name} variant="outline">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Update Database Configuration
          </CardTitle>
          <CardDescription>Test and update your MongoDB connection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mongoUri">MongoDB URI</Label>
            <div className="relative">
              <Input
                id="mongoUri"
                type={showUri ? "text" : "password"}
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowUri(!showUri)}
              >
                {showUri ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dbName">Database Name</Label>
            <Input
              id="dbName"
              placeholder="construction_crm"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => testConnection(true)} disabled={testing || !mongoUri || !dbName} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>

            <Button onClick={updateConfig} disabled={updating || !mongoUri || !dbName}>
              {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Update Configuration
            </Button>
          </div>

          {connectionTest && !connectionTest.success && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <XCircle className="h-4 w-4" />
                Connection Failed
              </div>
              <p className="text-red-700 text-sm">{connectionTest.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
