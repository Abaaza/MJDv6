"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Play, Square, Download, Calculator, Zap, FileText, Users } from "lucide-react"

interface MobilePriceMatchProps {
  onStartMatch?: (data: any) => void
  onStopMatch?: () => void
  isMatching?: boolean
  results?: any[]
  progress?: string[]
  grandTotal?: number
}

const matchingVersions = [
  {
    id: "v0",
    name: "Cohere",
    description: "Fast & Accurate",
    icon: Zap,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    borderColor: "border-blue-500",
  },
  {
    id: "v1",
    name: "OpenAI",
    description: "High Quality",
    icon: FileText,
    color: "bg-green-500",
    textColor: "text-green-700",
    borderColor: "border-green-500",
  },
  {
    id: "v2",
    name: "Hybrid",
    description: "Best Results",
    icon: Users,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    borderColor: "border-purple-500",
  },
]

export function MobilePriceMatch({
  onStartMatch,
  onStopMatch,
  isMatching = false,
  results = [],
  progress = [],
  grandTotal = 0,
}: MobilePriceMatchProps) {
  const [activeTab, setActiveTab] = useState("v0")
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      })
      return
    }

    onStartMatch?.({
      clientName,
      projectName,
      file,
      version: activeTab,
    })
  }

  return (
    <div className="space-y-6 p-4 max-w-md mx-auto">
      {/* AI Model Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Choose AI Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matchingVersions.map((version) => {
              const Icon = version.icon
              const isActive = activeTab === version.id

              return (
                <button
                  key={version.id}
                  onClick={() => setActiveTab(version.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? `${version.borderColor} bg-white shadow-md`
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${version.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold text-lg ${isActive ? version.textColor : "text-gray-900"}`}>
                        {version.name}
                      </div>
                      <div className="text-sm text-gray-600">{version.description}</div>
                    </div>
                    {isActive && <div className={`w-3 h-3 rounded-full ${version.color}`} />}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium">
              Client Name
            </Label>
            <Input
              id="client"
              placeholder="e.g., Acme Corporation"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={isMatching}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">
              Project Name
            </Label>
            <Input
              id="project"
              placeholder="e.g., Downtown Office Tower"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isMatching}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              BoQ File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isMatching}
              className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isMatching ? (
          <Button onClick={handleSubmit} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Play className="mr-2 h-5 w-5" />
            Start Match
          </Button>
        ) : (
          <Button onClick={onStopMatch} variant="destructive" className="flex-1 h-12 font-semibold">
            <Square className="mr-2 h-5 w-5" />
            Stop Match
          </Button>
        )}

        {results.length > 0 && (
          <Button variant="outline" size="icon" className="h-12 w-12">
            <Download className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Progress */}
      {isMatching && progress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32 w-full rounded border bg-muted p-3">
              <div className="space-y-1 text-sm font-mono">
                {progress.map((log, i) => (
                  <p key={i} className="text-muted-foreground">
                    {log}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {results.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Results</CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calculator className="h-3 w-3" />${grandTotal.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 3).map((result, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium line-clamp-2">{result.originalDescription}</p>
                    <Badge variant={result.confidence >= 80 ? "default" : "secondary"} className="ml-2 text-xs">
                      {result.confidence}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {result.quantity} {result.unit}
                    </span>
                    <span className="font-medium">${result.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}

              {results.length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  View All {results.length} Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm font-medium">No results yet</div>
              <div className="text-xs">Upload a file and start matching to see results</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
