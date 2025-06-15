"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { ResponsiveTable } from "@/components/responsive-table"
import type { Client } from "@/lib/models"

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
  onView: (client: Client) => void
}

export function ClientTable({ clients, onEdit, onDelete, onView }: ClientTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 hover:bg-green-100",
      inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      prospect: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    }
    return variants[status as keyof typeof variants] || variants.prospect
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      priority: 1,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "company",
      label: "Company",
      priority: 2,
      render: (value: string) => value || "-",
    },
    {
      key: "email",
      label: "Email",
      priority: 3,
      mobile: false,
    },
    {
      key: "phone",
      label: "Phone",
      mobile: false,
    },
    {
      key: "status",
      label: "Status",
      priority: 2,
      render: (value: string) => <Badge className={getStatusBadge(value)}>{value}</Badge>,
    },
    {
      key: "createdAt",
      label: "Created",
      mobile: false,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, client: Client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(client)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(client.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <ResponsiveTable
      data={clients}
      columns={columns}
      onRowClick={onView}
      emptyMessage="No clients found. Create your first client to get started."
    />
  )
}
