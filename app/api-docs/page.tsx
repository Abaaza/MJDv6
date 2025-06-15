"use client"

import { useAuth } from "@/contexts/auth-context"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ApiDocsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user) {
    return null
  }

  const endpoints = [
    {
      method: "GET",
      path: "/api/auth/me",
      description: "Get current user information",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/auth/login",
      description: "Authenticate user",
      auth: false,
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      description: "Logout current user",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/clients",
      description: "Get all clients",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/clients",
      description: "Create new client",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/projects",
      description: "Get all projects",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/projects",
      description: "Create new project",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/price-items",
      description: "Get price items",
      auth: true,
    },
    {
      method: "POST",
      path: "/api/price-items/import",
      description: "Import price items from Excel",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/search",
      description: "Global search across all entities",
      auth: true,
    },
    {
      method: "GET",
      path: "/api/reports/advanced",
      description: "Generate advanced reports",
      auth: true,
    },
  ]

  return (
    <LayoutWrapper>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">Complete API reference for the Construction Pricing CRM</p>
        </div>

        <div className="grid gap-6">
          {endpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      endpoint.method === "GET" ? "secondary" : endpoint.method === "POST" ? "default" : "destructive"
                    }
                  >
                    {endpoint.method}
                  </Badge>
                  <CardTitle className="text-lg font-mono">{endpoint.path}</CardTitle>
                  {endpoint.auth && <Badge variant="outline">Auth Required</Badge>}
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  )
}
