import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Checking authentication status...")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ No auth token found")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    try {
      // Decode the simple base64 token
      const tokenData = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))

      // Check if token is expired
      if (tokenData.exp && Date.now() > tokenData.exp) {
        console.log("❌ Token expired")
        return NextResponse.json({ success: false, message: "Token expired" }, { status: 401 })
      }

      console.log("✅ Token verified for user:", tokenData.email)

      const user = {
        id: tokenData.userId,
        email: tokenData.email,
        name: tokenData.name || tokenData.email.split("@")[0],
        role: tokenData.role || "user",
        isVerified: tokenData.isVerified || false,
        lastLogin: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        user: user,
      })
    } catch (decodeError) {
      console.log("❌ Invalid token:", decodeError)
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json({ success: false, message: "Authentication check failed" }, { status: 500 })
  }
}
