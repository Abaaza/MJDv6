"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Briefcase, Plus, Search } from "lucide-react"
import { ProjectTable } from "@/components/projects/project-table"
import { ProjectForm } from "@/components/projects/project-form"
import { DocumentManager } from "@/components/projects/document-manager"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Project, Client } from "@/lib/models"
import { ProjectQuotation } from "@/components/project-quotation"

export default function ProjectsPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showQuotation, setShowQuotation] = useState(false)
  const [selectedProjectForQuotation, setSelectedProjectForQuotation] = useState<Project | null>(null)

  // Fetch projects
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      if (clientFilter && clientFilter !== "all") params.append("clientId", clientFilter)

      const response = await fetch(`/api/projects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch clients for filter dropdown
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [searchTerm, statusFilter, clientFilter])

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateProject = async (projectData: Partial<Project>) => {
    setFormLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project created successfully",
        })
        setShowForm(false)
        fetchProjects()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to create project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!editingProject) return

    setFormLoading(true)
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project updated successfully",
        })
        setEditingProject(null)
        setShowForm(false)
        fetchProjects()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to update project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
        fetchProjects()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to server",
        variant: "destructive",
      })
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleViewProject = (project: Project) => {
    // For now, just edit - you could create a separate view dialog
    handleEditProject(project)
  }

  const handleManageDocuments = (project: Project) => {
    setSelectedProject(project)
    setShowDocuments(true)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const handleDocumentManagerClose = () => {
    setShowDocuments(false)
    setSelectedProject(null)
    fetchProjects() // Refresh to get updated document counts
  }

  const handleManageQuotation = (project: Project) => {
    setSelectedProjectForQuotation(project)
    setShowQuotation(true)
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-brand-DEFAULT" />
              <div>
                <CardTitle>Projects Management</CardTitle>
                <CardDescription>Oversee all your construction projects from initiation to completion.</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="matching">Matching</SelectItem>
                <SelectItem value="quoting">Quoting</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Table */}
          {loading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : (
            <ProjectTable
              projects={projects}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onView={handleViewProject}
              onManageDocuments={handleManageDocuments}
              onManageQuotation={handleManageQuotation}
            />
          )}
        </CardContent>
      </Card>

      {/* Project Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject || undefined}
            onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Document Manager Dialog */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Documents - {selectedProject?.name}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <DocumentManager
              project={selectedProject}
              onDocumentUploaded={handleDocumentManagerClose}
              onClose={handleDocumentManagerClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation Management Dialog */}
      <Dialog open={showQuotation} onOpenChange={setShowQuotation}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Quotation - {selectedProjectForQuotation?.name}</DialogTitle>
          </DialogHeader>
          {selectedProjectForQuotation && (
            <ProjectQuotation
              project={selectedProjectForQuotation}
              onQuotationSaved={() => {
                setShowQuotation(false)
                fetchProjects()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
