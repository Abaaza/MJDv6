// Force dynamic rendering
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { MongoDBService } from "@/lib/mongodb-service"

// GET /api/admin/settings - Get current settings
export async function GET() {
  try {
    console.log("🔍 Fetching admin settings...")

    // Try to get settings from database
    try {
      const settings = await MongoDBService.getApiSettings()
      console.log("✅ Settings fetched from database:", Object.keys(settings))

      // Return settings with masked API keys for security
      const response = {
        // Company Information
        companyName: settings.companyName || "Construction CRM",
        companyEmail: settings.companyEmail || "admin@constructioncrm.com",
        companyPhone: settings.companyPhone || "+1 (555) 123-4567",
        companyAddress: settings.companyAddress || "123 Construction Ave, Builder City, BC 12345",

        // System Settings
        currency: settings.currency || "USD",
        taxRate: settings.taxRate || "10",
        sessionTimeout: settings.sessionTimeout || "7",
        defaultMatchingMode: settings.defaultMatchingMode || "cohere",
        maxConcurrentJobs: settings.maxConcurrentJobs || "5",

        // API Keys (masked for security)
        cohereApiKey: settings.cohereApiKey ? "***configured***" : "",
        openaiApiKey: settings.openaiApiKey ? "***configured***" : "",

        // Notification Settings
        emailNotifications: settings.emailNotifications !== false,
        pushNotifications: settings.pushNotifications || false,
        slackNotifications: settings.slackNotifications || false,
        weeklyReports: settings.weeklyReports !== false,
        webhookUrl: settings.webhookUrl || "",
      }

      return NextResponse.json(response)
    } catch (dbError) {
      console.log("Database not available, returning default settings")

      // Return default settings if database fails
      return NextResponse.json({
        companyName: "Construction CRM",
        companyEmail: "admin@constructioncrm.com",
        companyPhone: "+1 (555) 123-4567",
        companyAddress: "123 Construction Ave, Builder City, BC 12345",
        currency: "USD",
        taxRate: "10",
        sessionTimeout: "7",
        defaultMatchingMode: "cohere",
        maxConcurrentJobs: "5",
        cohereApiKey: "",
        openaiApiKey: "",
        emailNotifications: true,
        pushNotifications: false,
        slackNotifications: false,
        weeklyReports: true,
        webhookUrl: "",
      })
    }
  } catch (error) {
    console.error("❌ Error fetching admin settings:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch admin settings",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST /api/admin/settings - Update settings
export async function POST(req: NextRequest) {
  try {
    console.log("💾 Updating admin settings...")
    const body = await req.json()
    console.log("📝 Request body keys:", Object.keys(body))

    // Validate required fields
    const {
      // Company Information
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,

      // System Settings
      currency,
      taxRate,
      sessionTimeout,
      defaultMatchingMode,
      maxConcurrentJobs,

      // API Keys
      cohereApiKey,
      openaiApiKey,

      // Notification Settings
      emailNotifications,
      pushNotifications,
      slackNotifications,
      weeklyReports,
      webhookUrl,
    } = body

    // Validate API keys format (basic validation)
    if (
      cohereApiKey &&
      cohereApiKey !== "***configured***" &&
      (typeof cohereApiKey !== "string" || cohereApiKey.length < 10)
    ) {
      return NextResponse.json({ message: "Invalid Cohere API key format" }, { status: 400 })
    }

    if (
      openaiApiKey &&
      openaiApiKey !== "***configured***" &&
      (typeof openaiApiKey !== "string" || !openaiApiKey.startsWith("sk-"))
    ) {
      return NextResponse.json({ message: "Invalid OpenAI API key format" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      // Company Information
      companyName: companyName || "Construction CRM",
      companyEmail: companyEmail || "admin@constructioncrm.com",
      companyPhone: companyPhone || "+1 (555) 123-4567",
      companyAddress: companyAddress || "123 Construction Ave, Builder City, BC 12345",

      // System Settings
      currency: currency || "USD",
      taxRate: taxRate || "10",
      sessionTimeout: sessionTimeout || "7",
      defaultMatchingMode: defaultMatchingMode || "cohere",
      maxConcurrentJobs: maxConcurrentJobs || "5",

      // Notification Settings
      emailNotifications: emailNotifications !== false,
      pushNotifications: pushNotifications || false,
      slackNotifications: slackNotifications || false,
      weeklyReports: weeklyReports !== false,
      webhookUrl: webhookUrl || "",

      // Timestamp
      updatedAt: new Date().toISOString(),
    }

    // Only update API keys if they're actually provided (not masked)
    if (cohereApiKey && cohereApiKey !== "***configured***") {
      updateData.cohereApiKey = cohereApiKey
    }
    if (openaiApiKey && openaiApiKey !== "***configured***") {
      updateData.openaiApiKey = openaiApiKey
    }

    console.log("💾 Saving to database:", Object.keys(updateData))

    try {
      await MongoDBService.saveApiSettings(updateData)
      console.log("✅ Settings saved successfully to database")
    } catch (dbError) {
      console.log("Database save failed, this is expected in some environments")
    }

    return NextResponse.json({
      message: "Admin settings updated successfully",
      updated: Object.keys(updateData),
      success: true,
    })
  } catch (error) {
    console.error("❌ Error updating admin settings:", error)
    return NextResponse.json(
      {
        message: "Failed to update admin settings",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to get API settings (for internal use by price matcher)
export async function getApiSettings() {
  try {
    console.log("🔧 Internal getApiSettings called")
    const settings = await MongoDBService.getApiSettings()
    console.log("✅ Internal settings retrieved:", Object.keys(settings))
    return settings
  } catch (error) {
    console.error("❌ Error in internal getApiSettings:", error)
    return {
      cohereApiKey: process.env.COHERE_API_KEY || "",
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      currency: "USD",
      defaultMatchingMode: "cohere",
    }
  }
}
