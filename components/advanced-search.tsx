"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, X, Clock, TrendingUp, Star, Calendar, Tag, Building, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFilter {
  id: string
  label: string
  value: string
  type: "text" | "date" | "number" | "select"
  icon?: React.ReactNode
  options?: { label: string; value: string }[]
}

interface SearchSuggestion {
  id: string
  text: string
  type: "recent" | "popular" | "suggestion"
  category?: string
  icon?: React.ReactNode
  metadata?: string
}

interface AdvancedSearchProps {
  placeholder?: string
  onSearch?: (query: string, filters: SearchFilter[]) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  suggestions?: SearchSuggestion[]
  filters?: SearchFilter[]
  recentSearches?: string[]
  popularSearches?: string[]
  className?: string
  showFilters?: boolean
  showSuggestions?: boolean
  debounceMs?: number
}

export function AdvancedSearch({
  placeholder = "Search everything...",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  filters = [],
  recentSearches = [],
  popularSearches = [],
  className,
  showFilters = true,
  showSuggestions = true,
  debounceMs = 300,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Default suggestions based on recent and popular searches
  const defaultSuggestions: SearchSuggestion[] = [
    ...recentSearches.slice(0, 3).map((search, index) => ({
      id: `recent-${index}`,
      text: search,
      type: "recent" as const,
      icon: <Clock className="h-4 w-4 text-gray-400" />,
    })),
    ...popularSearches.slice(0, 3).map((search, index) => ({
      id: `popular-${index}`,
      text: search,
      type: "popular" as const,
      icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
    })),
  ]

  const allSuggestions = [...suggestions, ...defaultSuggestions]

  const filteredSuggestions = allSuggestions.filter((suggestion) =>
    suggestion.text.toLowerCase().includes(query.toLowerCase()),
  )

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return

    const timer = setTimeout(() => {
      setIsSearching(true)
      onSearch?.(query, activeFilters)
      setTimeout(() => setIsSearching(false), 500)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, activeFilters, onSearch, debounceMs])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
            handleSuggestionSelect(filteredSuggestions[focusedIndex])
          } else {
            handleSearch()
          }
          break
        case "Escape":
          setShowDropdown(false)
          setFocusedIndex(-1)
          break
      }
    },
    [showDropdown, filteredSuggestions, focusedIndex],
  )

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowDropdown(false)
    setFocusedIndex(-1)
    onSuggestionSelect?.(suggestion)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query, activeFilters)
      setShowDropdown(false)
    }
  }

  const addFilter = (filter: SearchFilter) => {
    if (!activeFilters.find((f) => f.id === filter.id)) {
      setActiveFilters((prev) => [...prev, filter])
    }
  }

  const removeFilter = (filterId: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId))
  }

  const clearAll = () => {
    setQuery("")
    setActiveFilters([])
    setShowDropdown(false)
  }

  const getSuggestionIcon = (type: string, icon?: React.ReactNode) => {
    if (icon) return icon
    switch (type) {
      case "recent":
        return <Clock className="h-4 w-4 text-gray-400" />
      case "popular":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !searchRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-2 p-3 border rounded-lg bg-white shadow-sm transition-all duration-200",
            showDropdown ? "border-blue-500 shadow-lg ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400",
          )}
        >
          <Search className={cn("h-5 w-5 transition-colors", isSearching ? "text-blue-500" : "text-gray-400")} />

          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {activeFilters.map((filter) => (
                <Badge key={filter.id} variant="secondary" className="flex items-center gap-1 text-xs">
                  {filter.icon}
                  {filter.label}: {filter.value}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="h-3 w-3 p-0 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {showFilters && filters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-xl">
                  <DropdownMenuLabel>Filters</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filters.map((filter) => (
                    <DropdownMenuItem key={filter.id} onClick={() => addFilter(filter)}>
                      <div className="flex items-center gap-2">
                        {filter.icon}
                        <span>{filter.label}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {(query || activeFilters.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {showDropdown && showSuggestions && (
          <Card
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border animate-scale-in"
          >
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {filteredSuggestions.length > 0 ? (
                <div className="py-2">
                  {/* Recent Searches */}
                  {filteredSuggestions.some((s) => s.type === "recent") && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Recent Searches
                      </div>
                      {filteredSuggestions
                        .filter((s) => s.type === "recent")
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                              focusedIndex === index && "bg-blue-50",
                            )}
                          >
                            {getSuggestionIcon(suggestion.type, suggestion.icon)}
                            <span className="flex-1">{suggestion.text}</span>
                            {suggestion.metadata && (
                              <span className="text-xs text-gray-400">{suggestion.metadata}</span>
                            )}
                          </button>
                        ))}
                      <Separator className="my-2" />
                    </>
                  )}

                  {/* Popular Searches */}
                  {filteredSuggestions.some((s) => s.type === "popular") && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Popular Searches
                      </div>
                      {filteredSuggestions
                        .filter((s) => s.type === "popular")
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                              focusedIndex === index && "bg-blue-50",
                            )}
                          >
                            {getSuggestionIcon(suggestion.type, suggestion.icon)}
                            <span className="flex-1">{suggestion.text}</span>
                            <Star className="h-3 w-3 text-yellow-500" />
                          </button>
                        ))}
                      <Separator className="my-2" />
                    </>
                  )}

                  {/* Custom Suggestions */}
                  {filteredSuggestions.some((s) => s.type === "suggestion") && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Suggestions
                      </div>
                      {filteredSuggestions
                        .filter((s) => s.type === "suggestion")
                        .map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                              focusedIndex === index && "bg-blue-50",
                            )}
                          >
                            {getSuggestionIcon(suggestion.type, suggestion.icon)}
                            <div className="flex-1">
                              <div>{suggestion.text}</div>
                              {suggestion.category && (
                                <div className="text-xs text-gray-400">{suggestion.category}</div>
                              )}
                            </div>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              ) : query ? (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No suggestions found</p>
                  <Button onClick={handleSearch} size="sm" className="mt-2 btn-primary">
                    Search for "{query}"
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to see suggestions</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Example usage with predefined filters
export const constructionSearchFilters: SearchFilter[] = [
  {
    id: "date",
    label: "Date Range",
    value: "last-30-days",
    type: "select",
    icon: <Calendar className="h-4 w-4" />,
    options: [
      { label: "Last 7 days", value: "last-7-days" },
      { label: "Last 30 days", value: "last-30-days" },
      { label: "Last 90 days", value: "last-90-days" },
    ],
  },
  {
    id: "project-type",
    label: "Project Type",
    value: "residential",
    type: "select",
    icon: <Building className="h-4 w-4" />,
    options: [
      { label: "Residential", value: "residential" },
      { label: "Commercial", value: "commercial" },
      { label: "Industrial", value: "industrial" },
    ],
  },
  {
    id: "budget",
    label: "Budget Range",
    value: "50000-100000",
    type: "select",
    icon: <DollarSign className="h-4 w-4" />,
    options: [
      { label: "$0 - $50K", value: "0-50000" },
      { label: "$50K - $100K", value: "50000-100000" },
      { label: "$100K+", value: "100000+" },
    ],
  },
  {
    id: "status",
    label: "Status",
    value: "active",
    type: "select",
    icon: <Tag className="h-4 w-4" />,
    options: [
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
      { label: "On Hold", value: "on-hold" },
    ],
  },
]
