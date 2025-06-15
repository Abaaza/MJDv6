// COMPLETELY DISABLED - NO AUTHENTICATION
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // DO NOTHING - ALLOW ALL REQUESTS
  console.log("🔥 Middleware: ALLOWING ALL REQUESTS - NO AUTH")
  return NextResponse.next()
}

// NO ROUTES PROTECTED
export const config = {
  matcher: [],
}
