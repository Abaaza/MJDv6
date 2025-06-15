import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Force dynamic rendering
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ message: "Logout failed" }, { status: 500 })
  }
}
