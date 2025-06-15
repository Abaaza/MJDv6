"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, FileText, Users, Briefcase, DollarSign, Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  type: "project" | "client" | "price-item" | "quotation" | "document"
  title: string
  description: string
  metadata: Record<string, any>
  score: number
  url: string
}

interface SearchFilters {
  type: string[]
  dateRange: "all" | "week" | "month" | "year"
  sortBy: "relevance" | "date" | "name"
}

export function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    dateRange: "all",
    sortBy: "relevance",
  })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, filters])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        types: filters.type.join(","),
        dateRange: filters.dateRange,
        sortBy: filters.sortBy,
      })

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))

    // Navigate to result
    router.push(result.url)
    setIsOpen(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "project":
        return <Briefcase className="h-4 w-4" />
      case "client":
        return <Users className="h-4 w-4" />
      case "price-item":
        return <DollarSign className="h-4 w-4" />
      case "quotation":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case "project":
        return "text-blue-600"
      case "client":
        return "text-green-600"
      case "price-item":
        return "text-purple-600"
      case "quotation":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="sr-only">Global Search</DialogTitle>
          </DialogHeader>

          <div className="px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search projects, clients, price items..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {/* Search Filters */}
          <div className="px-6 pb-2">
            <div className="flex gap-2 flex-wrap">
              {["project", "client", "price-item", "quotation"].map((type) => (
                <Button
                  key={type}
                  variant={filters.type.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updated = filters.type.includes(type)
                      ? filters.type.filter((t) => t !== type)
                      : [...filters.type, type]
                    setFilters({ ...filters, type: updated })
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="max-h-96">
            {loading ? (
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Searching...
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="px-2 pb-2">
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="mb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${getResultColor(result.type)}`}>{getResultIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.type.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{result.description}</p>
                          {result.metadata && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {result.metadata.date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(result.metadata.date).toLocaleDateString()}
                                </div>
                              )}
                              {result.metadata.client && <span>Client: {result.metadata.client}</span>}
                              {result.metadata.value && <span>Value: ${result.metadata.value.toLocaleString()}</span>}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="px-6 py-4">
                {recentSearches.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Recent Searches</h4>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => setQuery(search)}
                        >
                          <Clock className="mr-2 h-3 w-3" />
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-sm">Quick Actions</h4>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/projects/new")}
                    >
                      <Briefcase className="mr-2 h-3 w-3" />
                      Create New Project
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/clients/new")}
                    >
                      <Users className="mr-2 h-3 w-3" />
                      Add New Client
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/price-list")}
                    >
                      <DollarSign className="mr-2 h-3 w-3" />
                      Browse Price List
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="px-6 py-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Press ⌘K to search, ↵ to select, ↑↓ to navigate</span>
              <span>{results.length} results</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
