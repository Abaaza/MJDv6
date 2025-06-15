"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  HardDrive,
  Clock,
  AlertTriangle,
  Info,
  Globe,
} from "lucide-react"

interface ConnectionStatus {
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
  connectionTime?: string
  troubleshooting?: {
    issue: string
    possibleCauses?: string[]
    solutions?: string[]
  }
  environment?: {
    nodeEnv: string
    hasMongoUri: boolean
    hasDbName: boolean
    mongoUriPreview?: string
  }
}

export function MongoDBStatus() {
  const { toast } = useToast()
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const result = await response.json()
      setStatus(result)
      setLastChecked(new Date())

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "MongoDB is connected and working properly",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setStatus({
        success: false,
        message: "Failed to test connection",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Test Failed",
        description: "Could not perform connection test",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MongoDB Connection Status</h2>
          <p className="text-muted-foreground">Verify your database connection and view system information</p>
        </div>
        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-sm text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</span>
          )}
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Test Connection
          </Button>
        </div>
      </div>

      {status && (
        <div className="grid gap-6">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Status
                {status.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>Current MongoDB connection status and response time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={status.success ? "default" : "destructive"}>
                  {status.success ? "Connected" : "Disconnected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Response Time:</span>
                <Badge variant="outline">
                  <Clock className="mr-1 h-3 w-3" />
                  {status.data?.connectionTime || status.connectionTime || "N/A"}
                </Badge>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Server Information */}
          {status.success && status.data && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Server Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-mono">{status.data.server.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-mono text-sm">{status.data.server.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Process:</span>
                    <span className="font-mono">{status.data.server.process}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{formatUptime(status.data.server.uptime)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Database Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span className="font-mono">{status.data.database.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collections:</span>
                    <span>{status.data.database.collections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documents:</span>
                    <span>{status.data.database.objects.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Size:</span>
                    <span>{formatBytes(status.data.database.dataSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage Size:</span>
                    <span>{formatBytes(status.data.database.storageSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Indexes:</span>
                    <span>{status.data.database.indexes}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Collections List */}
          {status.success && status.data?.collections && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Collections ({status.data.collections.length})
                </CardTitle>
                <CardDescription>Available collections in your database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {status.data.collections.map((collection, index) => (
                    <Badge key={index} variant="outline" className="justify-center">
                      {collection.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node Environment:</span>
                <Badge variant="outline">
                  {(status.data?.environment || status.environment)?.nodeEnv || "unknown"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MongoDB URI:</span>
                <Badge
                  variant={(status.data?.environment || status.environment)?.hasMongoUri ? "default" : "destructive"}
                >
                  {(status.data?.environment || status.environment)?.hasMongoUri ? "Configured" : "Missing"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database Name:</span>
                <Badge variant={(status.data?.environment || status.environment)?.hasDbName ? "default" : "secondary"}>
                  {(status.data?.environment || status.environment)?.hasDbName ? "Configured" : "Using Default"}
                </Badge>
              </div>
              {status.environment?.mongoUriPreview && (
                <div className="mt-2">
                  <span className="text-muted-foreground text-sm">URI Preview:</span>
                  <div className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                    {status.environment.mongoUriPreview}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          {!status.success && status.troubleshooting && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Troubleshooting
                </CardTitle>
                <CardDescription>Diagnostic information to help resolve connection issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issue:</strong> {status.troubleshooting.issue}
                  </AlertDescription>
                </Alert>

                {status.troubleshooting.possibleCauses && (
                  <div>
                    <h4 className="font-semibold mb-2">Possible Causes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {status.troubleshooting.possibleCauses.map((cause, index) => (
                        <li key={index}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {status.troubleshooting.solutions && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Solutions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {status.troubleshooting.solutions.map((solution, index) => (
                        <li key={index}>{solution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {status.error && (
                  <div>
                    <h4 className="font-semibold mb-2">Error Details:</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">{status.error}</code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isLoading && !status && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Testing MongoDB connection...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
