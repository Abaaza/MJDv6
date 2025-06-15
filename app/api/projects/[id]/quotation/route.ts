import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock data store for quotations
const mockQuotations: any[] = []

function getCurrentUser() {
  const tokenCookie = cookies().get("auth-token")
  if (!tokenCookie) return null
  try {
    return JSON.parse(tokenCookie.value)
  } catch {
    return null
  }
}

// GET /api/projects/[id]/quotation - Get project quotation
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const quotation = mockQuotations.find((q) => q.projectId === params.id)
    return NextResponse.json({ quotation })
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects/[id]/quotation - Create/Update project quotation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser()
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items, total, discount = 0 } = await req.json()

    const existingIndex = mockQuotations.findIndex((q) => q.projectId === params.id)

    const quotationData = {
      id: existingIndex >= 0 ? mockQuotations[existingIndex].id : `quotation-${Date.now()}`,
      projectId: params.id,
      version: existingIndex >= 0 ? mockQuotations[existingIndex].version + 1 : 1,
      items,
      total,
      discount,
      averageConfidence: items.reduce((sum: number, item: any) => sum + item.confidence, 0) / items.length,
      createdBy: user.id,
      createdAt: existingIndex >= 0 ? mockQuotations[existingIndex].createdAt : new Date(),
      updatedAt: new Date(),
    }

    if (existingIndex >= 0) {
      mockQuotations[existingIndex] = quotationData
    } else {
      mockQuotations.push(quotationData)
    }

    return NextResponse.json({
      message: "Quotation saved successfully",
      quotation: quotationData,
    })
  } catch (error) {
    console.error("Error saving quotation:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
