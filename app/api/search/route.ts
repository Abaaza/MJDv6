import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get("q") || ""
    const types = url.searchParams.get("types")?.split(",") || []
    const dateRange = url.searchParams.get("dateRange") || "all"
    const sortBy = url.searchParams.get("sortBy") || "relevance"

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    // Mock search results - in production, this would query your database with full-text search
    const mockResults = [
      {
        id: "proj-1",
        type: "project",
        title: "Office Building Construction",
        description: "Modern 5-story office building with sustainable features and smart building technology",
        metadata: {
          client: "Acme Corp",
          date: "2024-01-15T10:00:00Z",
          value: 2500000,
          status: "active",
        },
        score: 0.95,
        url: "/projects/proj-1",
      },
      {
        id: "client-1",
        type: "client",
        title: "Acme Corporation",
        description: "Leading technology company specializing in enterprise software solutions",
        metadata: {
          projects: 12,
          totalValue: 15000000,
          date: "2023-06-10T14:30:00Z",
        },
        score: 0.88,
        url: "/clients/client-1",
      },
      {
        id: "price-1",
        type: "price-item",
        title: "Concrete Foundation - Standard",
        description: "Standard concrete foundation work including excavation, formwork, and pouring",
        metadata: {
          category: "Foundation",
          rate: 125.5,
          unit: "m³",
          date: "2024-01-20T09:15:00Z",
        },
        score: 0.82,
        url: "/price-list?search=concrete+foundation",
      },
      {
        id: "quote-1",
        type: "quotation",
        title: "Q-2024-001 - Office Building",
        description: "Comprehensive quotation for office building construction project",
        metadata: {
          client: "Acme Corp",
          value: 2500000,
          items: 156,
          date: "2024-01-22T16:45:00Z",
        },
        score: 0.79,
        url: "/projects/proj-1/quotation",
      },
      {
        id: "proj-2",
        type: "project",
        title: "Residential Complex Phase 2",
        description: "Second phase of luxury residential complex with 50 units and amenities",
        metadata: {
          client: "BuildCo Ltd",
          date: "2024-02-01T11:20:00Z",
          value: 8500000,
          status: "planning",
        },
        score: 0.75,
        url: "/projects/proj-2",
      },
    ]

    // Filter by type if specified
    let filteredResults = mockResults
    if (types.length > 0) {
      filteredResults = mockResults.filter((result) => types.includes(result.type))
    }

    // Filter by search query (simple text matching - in production use proper search engine)
    filteredResults = filteredResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        (result.metadata.client && result.metadata.client.toLowerCase().includes(query.toLowerCase())),
    )

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const cutoffDate = new Date()

      switch (dateRange) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filteredResults = filteredResults.filter((result) => {
        const resultDate = new Date(result.metadata.date)
        return resultDate >= cutoffDate
      })
    }

    // Sort results
    switch (sortBy) {
      case "date":
        filteredResults.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())
        break
      case "name":
        filteredResults.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "relevance":
      default:
        filteredResults.sort((a, b) => b.score - a.score)
        break
    }

    // Limit results
    const limitedResults = filteredResults.slice(0, 20)

    return NextResponse.json({
      results: limitedResults,
      total: filteredResults.length,
      query,
      filters: { types, dateRange, sortBy },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
