// This file defines the data structures for your application.
// Updated to match your MongoDB schema

export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string
  role: "admin" | "user"
  profile?: {
    company?: string
    phone?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  contactPerson?: string
  status: "active" | "inactive" | "prospect"
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Updated PriceItem interface to match your MongoDB schema
export interface PriceItem {
  _id?: string
  id?: string
  code?: string
  ref?: string
  description: string
  category?: string
  subCategory?: string
  unit?: string
  rate?: number
  keywords?: string[]
  phrases?: string[]
  searchText?: string
  fullContext?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Project {
  id: string
  name: string
  clientId: string
  clientName: string
  status: "new" | "matching" | "quoting" | "complete"
  description?: string
  boqFileUrl?: string
  documents?: {
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadedAt: Date
    uploadedBy: string
  }[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Quotation {
  id: string
  projectId: string
  version: number
  items: MatchedItem[]
  discount: number
  total: number
  history: any[]
  createdAt: Date
  updatedAt: Date
}

export interface MatchedItem {
  boqDescription: string
  boqUnit: string
  boqQty: number
  matchedItemCode?: string
  matchedItemDescription?: string
  matchedRate: number
  confidence: number
}

export interface ApiSettings {
  id: string
  cohereApiKey?: string
  openaiApiKey?: string
  geminiApiKey?: string
  defaultModel: "cohere" | "openai" | "gemini"
  createdAt: Date
  updatedAt: Date
}

export interface MatchingJob {
  id: string
  projectId: string
  status: "pending" | "processing" | "completed" | "failed"
  model: "cohere" | "openai" | "gemini"
  progress: number
  logs: string[]
  results?: MatchedItem[]
  error?: string
  createdAt: Date
  updatedAt: Date
}
