import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔥 TEST ENDPOINT - NO AUTH - Working!")

  return NextResponse.json({
    success: true,
    message: "API working without authentication!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/test-no-auth",
  })
}

export async function POST() {
  console.log("🔥 TEST ENDPOINT - POST - NO AUTH - Working!")

  return NextResponse.json({
    success: true,
    message: "POST API working without authentication!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/test-no-auth",
  })
}
