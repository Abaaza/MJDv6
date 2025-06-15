"use client"

import { Plus } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { ClientTable } from "@/components/client-table"
import { CreateClientModal } from "@/components/create-client-modal"
import { toast } from "@/components/ui/use-toast"

import type { Client } from "@/types"

const ClientsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchClients = async () => {
    console.log("🔍 Fetching clients...")
    setIsLoading(true)
    try {
      const response = await fetch("/api/clients", {
        cache: "no-store",
        credentials: "include",
      })

      console.log("📊 Clients API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Clients API response data:", data)

      // Handle different response formats
      let clientsArray: Client[] = []

      if (Array.isArray(data)) {
        // If data is directly an array
        clientsArray = data
      } else if (data && Array.isArray(data.clients)) {
        // If data has a clients property that's an array
        clientsArray = data.clients
      } else if (data && data.data && Array.isArray(data.data)) {
        // If data has a nested data property
        clientsArray = data.data
      } else {
        // Fallback to empty array
        console.warn("⚠️ Unexpected data format, using empty array:", data)
        clientsArray = []
      }

      console.log("✅ Clients processed:", clientsArray.length)
      setClients(clientsArray)
    } catch (error) {
      console.error("❌ Failed to fetch clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      })
      // Set empty array on error to prevent map errors
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateClient = async (clientData: Partial<Client>) => {
    console.log("🏢 Creating new client:", clientData)
    setIsLoading(true)

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(clientData),
      })

      const result = await response.json()

      if (response.ok) {
        console.log("✅ Client created successfully:", result)
        toast({
          title: "Success",
          description: "Client created successfully",
        })
        setIsCreateModalOpen(false)
        fetchClients() // Refresh the list
      } else {
        console.error("❌ Failed to create client:", result)
        toast({
          title: "Error",
          description: result.message || "Failed to create client",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error creating client:", error)
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button
          onClick={() => {
            console.log("🔘 Add Client button clicked")
            setIsCreateModalOpen(true)
          }}
          className="bg-brand-DEFAULT hover:bg-brand-dark text-brand-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Debug info */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {clients.length} clients {isLoading && "(Loading...)"}
      </div>

      <ClientTable clients={clients} isLoading={isLoading} />
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  )
}

export default ClientsPage
