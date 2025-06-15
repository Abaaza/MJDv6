"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Upload, Calculator } from "lucide-react"
import type { Project } from "@/lib/models"

interface ProjectTableProps {
  projects: Project[]
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onView: (project: Project) => void
  onManageDocuments: (project: Project) => void
  onManageQuotation?: (project: Project) => void
}

export function ProjectTable({
  projects,
  onEdit,
  onDelete,
  onView,
  onManageDocuments,
  onManageQuotation,
}: ProjectTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      matching: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      quoting: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      complete: "bg-green-100 text-green-800 hover:bg-green-100",
    }
    return variants[status as keyof typeof variants] || variants.new
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No projects found. Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.clientName}</TableCell>
              <TableCell>
                <Badge className={getStatusBadge(project.status)}>{project.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{project.documents?.length || 0} files</span>
                  {project.boqFileUrl && (
                    <Badge variant="outline" className="text-xs">
                      BoQ
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(project)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManageDocuments(project)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Manage Documents
                    </DropdownMenuItem>
                    {onManageQuotation && (
                      <DropdownMenuItem onClick={() => onManageQuotation(project)}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Manage Quotation
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Default export for backward compatibility
export default ProjectTable
