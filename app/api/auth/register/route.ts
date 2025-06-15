import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // --- Placeholder for actual registration logic ---
    // 1. Validate input (e.g., email format, password strength)
    // 2. Check if user already exists in the database
    // 3. Hash the password
    // 4. Create new user in the database
    console.log("Registering user:", { name, email })
    // --- End of Placeholder ---

    // Simulate successful registration and login by setting a mock auth cookie
    const user = { id: "mock-user-id-" + Date.now(), name, email, role: "user" }
    cookies().set("auth-token", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return NextResponse.json({ message: "User registered successfully", user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
