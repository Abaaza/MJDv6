import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb-service"

export async function GET(request: NextRequest) {
  console.log("📊 === DASHBOARD STATS API START ===")

  try {
    console.log("🔌 Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")

    // Get projects stats
    console.log("📊 Fetching projects stats...")
    const projectsCollection = db.collection("projects")
    const totalProjects = await projectsCollection.countDocuments()
    const activeProjects = await projectsCollection.countDocuments({ status: { $in: ["new", "matching", "quoting"] } })
    const completedProjects = await projectsCollection.countDocuments({ status: "complete" })
    const pendingProjects = totalProjects - activeProjects - completedProjects

    console.log("📊 Projects stats:", { totalProjects, activeProjects, completedProjects, pendingProjects })

    // Get clients stats
    console.log("👥 Fetching clients stats...")
    const clientsCollection = db.collection("clients")
    const totalClients = await clientsCollection.countDocuments()
    const activeClients = await clientsCollection.countDocuments({ status: "active" })
    const newClientsThisMonth = await clientsCollection.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    })

    console.log("👥 Clients stats:", { totalClients, activeClients, newClientsThisMonth })

    // Get price items stats
    console.log("💰 Fetching price items stats...")
    const priceItemsCollection = db.collection("priceItems")
    const totalPriceItems = await priceItemsCollection.countDocuments()
    const categoriesResult = await priceItemsCollection.distinct("category")
    const totalCategories = categoriesResult.length

    console.log("💰 Price items stats:", { totalPriceItems, totalCategories })

    // Get matching jobs stats
    console.log("🤖 Fetching matching stats...")
    const matchingJobsCollection = db.collection("matchingJobs")
    const totalMatches = await matchingJobsCollection.countDocuments()
    const successfulMatches = await matchingJobsCollection.countDocuments({ status: "completed" })

    // Calculate average confidence and processing time
    const matchingStats = await matchingJobsCollection
      .aggregate([
        { $match: { status: "completed", results: { $exists: true, $ne: [] } } },
        {
          $project: {
            averageConfidence: { $avg: "$results.confidence" },
            processingTime: {
              $divide: [{ $subtract: ["$endTime", "$startTime"] }, 1000],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: "$averageConfidence" },
            avgProcessingTime: { $avg: "$processingTime" },
          },
        },
      ])
      .toArray()

    const avgConfidence = matchingStats[0]?.avgConfidence || 0
    const avgProcessingTime = matchingStats[0]?.avgProcessingTime || 0
    const successRate = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0

    console.log("🤖 Matching stats:", { totalMatches, avgConfidence, avgProcessingTime, successRate })

    // Get recent activity
    console.log("📋 Fetching recent activity...")
    const recentProjects = await projectsCollection.find({}).sort({ createdAt: -1 }).limit(3).toArray()

    const recentClients = await clientsCollection.find({}).sort({ createdAt: -1 }).limit(2).toArray()

    const recentMatches = await matchingJobsCollection.find({}).sort({ createdAt: -1 }).limit(3).toArray()

    const recentActivity = [
      ...recentProjects.map((project) => ({
        id: project._id.toString(),
        type: "project" as const,
        title: `Project: ${project.name}`,
        description: `Created for ${project.clientName}`,
        timestamp: project.createdAt,
        status: project.status === "complete" ? ("success" as const) : ("pending" as const),
      })),
      ...recentClients.map((client) => ({
        id: client._id.toString(),
        type: "client" as const,
        title: `New Client: ${client.name}`,
        description: client.company ? `Company: ${client.company}` : "Individual client",
        timestamp: client.createdAt,
        status: "success" as const,
      })),
      ...recentMatches.map((match) => ({
        id: match._id.toString(),
        type: "match" as const,
        title: `Price Matching: ${match.projectName}`,
        description: `${match.results?.length || 0} items matched`,
        timestamp: match.createdAt,
        status:
          match.status === "completed"
            ? ("success" as const)
            : match.status === "failed"
              ? ("error" as const)
              : ("pending" as const),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    console.log("📋 Recent activity count:", recentActivity.length)

    // Calculate revenue (mock data for now)
    const totalRevenue = Math.floor(Math.random() * 500000) + 100000
    const thisMonthRevenue = Math.floor(totalRevenue * 0.15)
    const growth = Math.floor(Math.random() * 30) + 5

    const dashboardStats = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        pending: pendingProjects,
      },
      clients: {
        total: totalClients,
        active: activeClients,
        new: newClientsThisMonth,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        growth: growth,
      },
      priceItems: {
        total: totalPriceItems,
        categories: totalCategories,
      },
      recentActivity,
      matchingStats: {
        totalMatches,
        averageConfidence: Math.round(avgConfidence),
        successRate: Math.round(successRate),
        processingTime: Math.round(avgProcessingTime),
      },
    }

    console.log("✅ Dashboard stats compiled successfully")
    console.log("📊 === DASHBOARD STATS API END ===")

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("❌ Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
