"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project, Client } from "@/lib/models"

interface ProjectFormProps {
  project?: Project
  onSubmit: (projectData: Partial<Project>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    clientId: project?.clientId || "",
    clientName: project?.clientName || "",
    status: project?.status || "new",
    description: project?.description || "",
  })

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients)
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      } finally {
        setLoadingClients(false)
      }
    }

    fetchClients()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId)
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selectedClient?.name || "",
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project ? "Edit Project" : "Create New Project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Downtown Office Tower"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={formData.clientId} onValueChange={handleClientChange} disabled={isLoading || loadingClients}>
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="matching">Matching</SelectItem>
                <SelectItem value="quoting">Quoting</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Project description and notes..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
              disabled={isLoading || !formData.clientId}
            >
              {isLoading ? "Saving..." : project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
