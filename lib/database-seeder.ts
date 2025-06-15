import { MongoClient, type Db } from "mongodb"

interface SeedData {
  users: any[]
  clients: any[]
  projects: any[]
  priceItems: any[]
  categories: any[]
}

export class DatabaseSeeder {
  private client: MongoClient | null = null
  private db: Db | null = null

  async connect() {
    if (!this.client) {
      const uri = process.env.MONGODB_URI
      if (!uri) {
        throw new Error("MONGODB_URI environment variable is not set")
      }

      this.client = new MongoClient(uri)
      await this.client.connect()
      this.db = this.client.db(process.env.DB_NAME || "construction_crm")
    }
    return { client: this.client, db: this.db! }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }

  async seedDatabase(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      const { db } = await this.connect()

      // Check if database is already seeded
      const existingUsers = await db.collection("users").countDocuments()
      if (existingUsers > 0) {
        return {
          success: false,
          message: "Database already contains data. Use force seed to override.",
          stats: { existingRecords: existingUsers },
        }
      }

      const seedData = this.generateSeedData()
      const stats = await this.insertSeedData(db, seedData)

      return {
        success: true,
        message: "Database seeded successfully",
        stats,
      }
    } catch (error) {
      console.error("Database seeding error:", error)
      throw error
    }
  }

  async forceSeed(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      const { db } = await this.connect()

      // Clear existing data
      await this.clearDatabase(db)

      const seedData = this.generateSeedData()
      const stats = await this.insertSeedData(db, seedData)

      return {
        success: true,
        message: "Database force seeded successfully",
        stats,
      }
    } catch (error) {
      console.error("Database force seeding error:", error)
      throw error
    }
  }

  private async clearDatabase(db: Db) {
    const collections = ["users", "clients", "projects", "priceitems", "categories", "matching_jobs", "quotations"]

    for (const collection of collections) {
      await db.collection(collection).deleteMany({})
    }
  }

  private generateSeedData(): SeedData {
    const now = new Date()

    return {
      users: [
        {
          _id: "user_admin",
          email: "admin@constructioncrm.com",
          name: "System Administrator",
          role: "admin",
          password: "$2b$10$hash", // In production, use proper password hashing
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "user_manager",
          email: "manager@constructioncrm.com",
          name: "Project Manager",
          role: "manager",
          password: "$2b$10$hash",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "user_estimator",
          email: "estimator@constructioncrm.com",
          name: "Cost Estimator",
          role: "user",
          password: "$2b$10$hash",
          createdAt: now,
          updatedAt: now,
        },
      ],

      clients: [
        {
          _id: "client_acme",
          name: "Acme Corporation",
          email: "contact@acme.com",
          phone: "+1-555-0101",
          address: "123 Business Ave, City, State 12345",
          contactPerson: "John Smith",
          industry: "Technology",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "client_buildco",
          name: "BuildCo Ltd",
          email: "info@buildco.com",
          phone: "+1-555-0102",
          address: "456 Construction Blvd, City, State 12346",
          contactPerson: "Sarah Johnson",
          industry: "Real Estate",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "client_megacorp",
          name: "MegaCorp Industries",
          email: "projects@megacorp.com",
          phone: "+1-555-0103",
          address: "789 Industrial Park, City, State 12347",
          contactPerson: "Mike Wilson",
          industry: "Manufacturing",
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
      ],

      projects: [
        {
          _id: "proj_office_building",
          name: "Downtown Office Complex",
          description: "Modern 15-story office building with sustainable features",
          clientId: "client_acme",
          status: "active",
          budget: 5000000,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-12-31"),
          location: "Downtown Business District",
          projectManager: "user_manager",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "proj_residential",
          name: "Luxury Residential Complex",
          description: "50-unit luxury apartment complex with amenities",
          clientId: "client_buildco",
          status: "planning",
          budget: 8500000,
          startDate: new Date("2024-06-01"),
          endDate: new Date("2025-08-31"),
          location: "Suburban Development Area",
          projectManager: "user_manager",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "proj_warehouse",
          name: "Industrial Warehouse Facility",
          description: "Large-scale warehouse and distribution center",
          clientId: "client_megacorp",
          status: "active",
          budget: 3200000,
          startDate: new Date("2024-02-15"),
          endDate: new Date("2024-10-15"),
          location: "Industrial Zone",
          projectManager: "user_manager",
          createdAt: now,
          updatedAt: now,
        },
      ],

      categories: [
        { _id: "cat_foundation", name: "Foundation Work", description: "Foundation and excavation work" },
        { _id: "cat_concrete", name: "Concrete Work", description: "Concrete pouring and finishing" },
        { _id: "cat_steel", name: "Steel Structure", description: "Steel framing and structural work" },
        { _id: "cat_electrical", name: "Electrical", description: "Electrical installation and wiring" },
        { _id: "cat_plumbing", name: "Plumbing", description: "Plumbing and water systems" },
        { _id: "cat_hvac", name: "HVAC", description: "Heating, ventilation, and air conditioning" },
        { _id: "cat_roofing", name: "Roofing", description: "Roofing materials and installation" },
        { _id: "cat_flooring", name: "Flooring", description: "Floor installation and finishing" },
        { _id: "cat_painting", name: "Painting", description: "Interior and exterior painting" },
        { _id: "cat_landscaping", name: "Landscaping", description: "Landscaping and outdoor work" },
      ],

      priceItems: [
        // Foundation Work
        {
          _id: "item_excavation",
          code: "EXC-001",
          description: "Site excavation for foundation",
          fullContext: "Site excavation for foundation including soil removal and grading",
          category: "Foundation Work",
          subCategory: "Excavation",
          unit: "m³",
          rate: 45.5,
          keywords: ["excavation", "foundation", "soil", "grading"],
          phrases: ["site excavation", "foundation excavation"],
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "item_concrete_foundation",
          code: "CON-001",
          description: "Concrete foundation pour",
          fullContext: "Concrete foundation pour including formwork, reinforcement, and finishing",
          category: "Foundation Work",
          subCategory: "Concrete",
          unit: "m³",
          rate: 285.75,
          keywords: ["concrete", "foundation", "pour", "formwork"],
          phrases: ["concrete foundation", "foundation pour"],
          createdAt: now,
          updatedAt: now,
        },

        // Steel Structure
        {
          _id: "item_steel_beam",
          code: "STL-001",
          description: "Structural steel beam installation",
          fullContext: "Structural steel beam installation including welding and connections",
          category: "Steel Structure",
          subCategory: "Beams",
          unit: "kg",
          rate: 3.25,
          keywords: ["steel", "beam", "structural", "welding"],
          phrases: ["steel beam", "structural steel"],
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "item_steel_column",
          code: "STL-002",
          description: "Steel column erection",
          fullContext: "Steel column erection including base plates and anchor bolts",
          category: "Steel Structure",
          subCategory: "Columns",
          unit: "kg",
          rate: 3.85,
          keywords: ["steel", "column", "erection", "base plate"],
          phrases: ["steel column", "column erection"],
          createdAt: now,
          updatedAt: now,
        },

        // Electrical
        {
          _id: "item_electrical_wiring",
          code: "ELE-001",
          description: "Electrical wiring installation",
          fullContext: "Electrical wiring installation including conduits and junction boxes",
          category: "Electrical",
          subCategory: "Wiring",
          unit: "m",
          rate: 12.5,
          keywords: ["electrical", "wiring", "conduit", "junction box"],
          phrases: ["electrical wiring", "wiring installation"],
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "item_electrical_panel",
          code: "ELE-002",
          description: "Electrical panel installation",
          fullContext: "Electrical panel installation including breakers and connections",
          category: "Electrical",
          subCategory: "Panels",
          unit: "each",
          rate: 850.0,
          keywords: ["electrical", "panel", "breaker", "installation"],
          phrases: ["electrical panel", "panel installation"],
          createdAt: now,
          updatedAt: now,
        },

        // Plumbing
        {
          _id: "item_plumbing_pipe",
          code: "PLB-001",
          description: "Plumbing pipe installation",
          fullContext: "Plumbing pipe installation including fittings and connections",
          category: "Plumbing",
          subCategory: "Piping",
          unit: "m",
          rate: 25.75,
          keywords: ["plumbing", "pipe", "fitting", "connection"],
          phrases: ["plumbing pipe", "pipe installation"],
          createdAt: now,
          updatedAt: now,
        },

        // HVAC
        {
          _id: "item_hvac_duct",
          code: "HVC-001",
          description: "HVAC ductwork installation",
          fullContext: "HVAC ductwork installation including insulation and supports",
          category: "HVAC",
          subCategory: "Ductwork",
          unit: "m²",
          rate: 45.0,
          keywords: ["hvac", "duct", "ductwork", "insulation"],
          phrases: ["hvac ductwork", "ductwork installation"],
          createdAt: now,
          updatedAt: now,
        },

        // Roofing
        {
          _id: "item_roofing_membrane",
          code: "ROF-001",
          description: "Roofing membrane installation",
          fullContext: "Roofing membrane installation including underlayment and flashing",
          category: "Roofing",
          subCategory: "Membrane",
          unit: "m²",
          rate: 35.5,
          keywords: ["roofing", "membrane", "underlayment", "flashing"],
          phrases: ["roofing membrane", "membrane installation"],
          createdAt: now,
          updatedAt: now,
        },

        // Flooring
        {
          _id: "item_flooring_tile",
          code: "FLR-001",
          description: "Ceramic tile flooring installation",
          fullContext: "Ceramic tile flooring installation including adhesive and grouting",
          category: "Flooring",
          subCategory: "Tile",
          unit: "m²",
          rate: 55.25,
          keywords: ["flooring", "tile", "ceramic", "adhesive", "grout"],
          phrases: ["tile flooring", "ceramic tile"],
          createdAt: now,
          updatedAt: now,
        },

        // Painting
        {
          _id: "item_painting_interior",
          code: "PNT-001",
          description: "Interior wall painting",
          fullContext: "Interior wall painting including primer and two coats of paint",
          category: "Painting",
          subCategory: "Interior",
          unit: "m²",
          rate: 18.75,
          keywords: ["painting", "interior", "wall", "primer", "paint"],
          phrases: ["interior painting", "wall painting"],
          createdAt: now,
          updatedAt: now,
        },
      ],
    }
  }

  private async insertSeedData(db: Db, seedData: SeedData): Promise<any> {
    const stats = {
      users: 0,
      clients: 0,
      projects: 0,
      priceItems: 0,
      categories: 0,
    }

    // Insert users
    if (seedData.users.length > 0) {
      await db.collection("users").insertMany(seedData.users)
      stats.users = seedData.users.length
    }

    // Insert clients
    if (seedData.clients.length > 0) {
      await db.collection("clients").insertMany(seedData.clients)
      stats.clients = seedData.clients.length
    }

    // Insert projects
    if (seedData.projects.length > 0) {
      await db.collection("projects").insertMany(seedData.projects)
      stats.projects = seedData.projects.length
    }

    // Insert categories
    if (seedData.categories.length > 0) {
      await db.collection("categories").insertMany(seedData.categories)
      stats.categories = seedData.categories.length
    }

    // Insert price items
    if (seedData.priceItems.length > 0) {
      await db.collection("priceitems").insertMany(seedData.priceItems)
      stats.priceItems = seedData.priceItems.length
    }

    return stats
  }

  async getSeederStatus(): Promise<{
    isSeeded: boolean
    collections: Record<string, number>
    lastSeeded?: Date
  }> {
    try {
      const { db } = await this.connect()

      const collections = {
        users: await db.collection("users").countDocuments(),
        clients: await db.collection("clients").countDocuments(),
        projects: await db.collection("projects").countDocuments(),
        priceItems: await db.collection("priceitems").countDocuments(),
        categories: await db.collection("categories").countDocuments(),
      }

      const isSeeded = Object.values(collections).some((count) => count > 0)

      // Try to get last seeded date from a metadata collection
      const metadata = await db.collection("_metadata").findOne({ type: "seeder" })

      return {
        isSeeded,
        collections,
        lastSeeded: metadata?.lastSeeded,
      }
    } catch (error) {
      console.error("Error getting seeder status:", error)
      return {
        isSeeded: false,
        collections: {},
      }
    }
  }

  async updateSeederMetadata() {
    try {
      const { db } = await this.connect()
      await db.collection("_metadata").replaceOne(
        { type: "seeder" },
        {
          type: "seeder",
          lastSeeded: new Date(),
          version: "1.0.0",
        },
        { upsert: true },
      )
    } catch (error) {
      console.error("Error updating seeder metadata:", error)
    }
  }
}

export const databaseSeeder = new DatabaseSeeder()
