import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔥 SIMPLE TEST - NO AUTH - NO DEPENDENCIES")

  return NextResponse.json({
    success: true,
    message: "WORKING - NO AUTH!",
    timestamp: new Date().toISOString(),
  })
}
