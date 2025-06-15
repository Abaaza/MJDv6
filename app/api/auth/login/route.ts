import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    console.log("🔐 Login attempt started")
    const { email, password } = await req.json()

    console.log("📧 Login attempt for email:", email)

    // Simple authentication without external dependencies
    if (email === "admin@constructioncrm.com") {
      console.log("👑 Admin login detected")

      const adminUser = {
        id: "admin-demo-user",
        email: "admin@constructioncrm.com",
        name: "Admin User",
        role: "admin",
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      // Create a simple token (base64 encoded user data)
      const tokenData = {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isVerified: adminUser.isVerified,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      }

      const token = Buffer.from(JSON.stringify(tokenData)).toString("base64")

      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      console.log("✅ Admin login successful")
      return NextResponse.json({
        success: true,
        user: adminUser,
        message: "Login successful",
      })
    }

    // For any other email, create a demo user
    const demoUser = {
      id: `demo-${Date.now()}`,
      email: email,
      name: email.split("@")[0] || "Demo User",
      role: email.includes("admin") ? "admin" : "user",
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    // Create a simple token
    const tokenData = {
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      isVerified: demoUser.isVerified,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64")

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ Demo login successful for:", email)
    return NextResponse.json({
      success: true,
      user: demoUser,
      message: "Login successful (Demo Mode)",
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
