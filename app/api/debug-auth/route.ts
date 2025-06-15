import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 DEBUG AUTH - Starting debug")

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    console.log(
      "🍪 All cookies:",
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    const tokenCookie = cookieStore.get("auth-token")

    if (!tokenCookie) {
      return NextResponse.json({
        error: "No auth-token cookie found",
        allCookies: allCookies.map((c) => c.name),
      })
    }

    console.log("🔍 Token cookie exists, length:", tokenCookie.value.length)

    // Try different parsing methods
    let parsedToken = null
    let parseMethod = ""

    // Method 1: Direct JSON parse
    try {
      parsedToken = JSON.parse(tokenCookie.value)
      parseMethod = "direct-json"
      console.log("✅ Direct JSON parse successful")
    } catch (e1) {
      console.log("❌ Direct JSON parse failed:", e1.message)

      // Method 2: Base64 decode then JSON parse
      try {
        const decoded = Buffer.from(tokenCookie.value, "base64").toString("utf-8")
        parsedToken = JSON.parse(decoded)
        parseMethod = "base64-decode"
        console.log("✅ Base64 decode + JSON parse successful")
      } catch (e2) {
        console.log("❌ Base64 decode + JSON parse failed:", e2.message)

        return NextResponse.json({
          error: "Could not parse token",
          tokenLength: tokenCookie.value.length,
          tokenPreview: tokenCookie.value.substring(0, 50) + "...",
          directParseError: e1.message,
          base64ParseError: e2.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      parseMethod,
      user: parsedToken,
      tokenLength: tokenCookie.value.length,
    })
  } catch (error) {
    console.error("❌ DEBUG AUTH - Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
