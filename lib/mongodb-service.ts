import { MongoClient, type Db, ObjectId } from "mongodb"

// Define User type
interface User {
  id: string
  email: string
  name: string
  role: string
  isVerified: boolean
  createdAt: Date
  lastLogin: Date
}

// Define PriceItem type to match your database structure
interface PriceItem {
  _id?: ObjectId
  id?: string
  code?: string
  ref?: string
  description: string
  category?: string
  subCategory?: string
  unit?: string
  rate?: number
  keywords?: string[]
  phrases?: string[]
  searchText?: string
  fullContext?: string
  createdAt?: Date
  updatedAt?: Date
}

class MongoDBService {
  private static client: MongoClient
  private static db: Db
  private static dbName = process.env.MONGODB_DB

  static async connect(): Promise<void> {
    if (!this.client) {
      try {
        this.client = new MongoClient(process.env.MONGODB_URI as string)
        await this.client.connect()
        this.db = this.client.db(this.dbName)
        console.log("✅ Connected successfully to MongoDB")
      } catch (e) {
        console.error("❌ Could not connect to MongoDB!", e)
        throw e
      }
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      console.log("✅ Disconnected from MongoDB")
      this.client = null as any
      this.db = null as any
    }
  }

  // Settings methods
  static async getApiSettings(): Promise<any> {
    console.log("🔧 Getting API settings from database")
    try {
      await this.connect()

      const settings = await this.db.collection("settings").findOne({ type: "api_settings" })

      if (settings) {
        console.log("✅ Settings found in database")
        return settings
      } else {
        console.log("📝 No settings found, returning defaults")
        return {
          currency: "USD",
          cohereApiKey: "",
          openaiApiKey: "",
          companyName: "BOQ Pricer Pro",
        }
      }
    } catch (error) {
      console.error("❌ Error getting API settings:", error)
      return {
        currency: "USD",
        cohereApiKey: "",
        openaiApiKey: "",
        companyName: "BOQ Pricer Pro",
      }
    }
  }

  static async saveApiSettings(settings: any): Promise<void> {
    console.log("💾 Saving API settings to database")
    try {
      await this.connect()

      const updateData = {
        ...settings,
        type: "api_settings",
        updatedAt: new Date(),
      }

      await this.db.collection("settings").replaceOne({ type: "api_settings" }, updateData, { upsert: true })

      console.log("✅ Settings saved successfully")
    } catch (error) {
      console.error("❌ Error saving API settings:", error)
      throw error
    }
  }

  // Get current currency setting
  static async getCurrency(): Promise<string> {
    try {
      const settings = await this.getApiSettings()
      return settings.currency || "USD"
    } catch (error) {
      console.error("❌ Error getting currency:", error)
      return "USD"
    }
  }

  // Price Items methods
  static async getPriceItems(
    options: {
      search?: string
      category?: string
      subCategory?: string
      minRate?: number
      maxRate?: number
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: string
    } = {},
  ): Promise<{
    items: PriceItem[]
    total: number
    page: number
    totalPages: number
    categories: string[]
    subCategories: string[]
  }> {
    console.log("💰 Getting price items from database with options:", options)

    try {
      await this.connect()

      const {
        search = "",
        category = "",
        subCategory = "",
        minRate,
        maxRate,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options

      // Build query
      const query: any = {}

      // Search in description, keywords, phrases, code, category
      if (search) {
        query.$or = [
          { description: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { subCategory: { $regex: search, $options: "i" } },
          { keywords: { $in: [new RegExp(search, "i")] } },
          { phrases: { $in: [new RegExp(search, "i")] } },
        ]
      }

      // Category filter
      if (category && category !== "all") {
        query.category = category
      }

      // SubCategory filter
      if (subCategory && subCategory !== "all") {
        query.subCategory = subCategory
      }

      // Rate range filter
      if (minRate !== undefined || maxRate !== undefined) {
        query.rate = {}
        if (minRate !== undefined) query.rate.$gte = minRate
        if (maxRate !== undefined) query.rate.$lte = maxRate
      }

      console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2))

      // Get total count
      const total = await this.db.collection("priceitems").countDocuments(query)
      console.log("📊 Total items matching query:", total)

      // Build sort object
      const sort: any = {}
      sort[sortBy] = sortOrder === "desc" ? -1 : 1

      // Get items with pagination
      const items = await this.db
        .collection("priceitems")
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray()

      console.log("✅ Retrieved price items:", items.length)

      // Get unique categories and subcategories for filters
      const categoriesResult = await this.db.collection("priceitems").distinct("category", {})
      const subCategoriesResult = await this.db.collection("priceitems").distinct("subCategory", {})

      const categories = categoriesResult.filter(Boolean).sort()
      const subCategories = subCategoriesResult.filter(Boolean).sort()

      console.log("📋 Categories found:", categories.length)
      console.log("📋 SubCategories found:", subCategories.length)

      // Transform items to match expected format
      const transformedItems = items.map((item) => ({
        ...item,
        id: item._id.toString(),
      }))

      return {
        items: transformedItems,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        categories,
        subCategories,
      }
    } catch (error) {
      console.error("❌ Error getting price items:", error)
      throw error
    }
  }

  // Get ALL price items for export (no pagination)
  static async getAllPriceItems(): Promise<PriceItem[]> {
    console.log("📤 Getting ALL price items for export")
    try {
      await this.connect()

      const items = await this.db.collection("priceitems").find({}).sort({ createdAt: -1 }).toArray()

      console.log(`✅ Retrieved ${items.length} items for export`)

      return items.map((item) => ({
        ...item,
        id: item._id.toString(),
      }))
    } catch (error) {
      console.error("❌ Error getting all price items:", error)
      throw error
    }
  }

  // Get price item by ID
  static async getPriceItemById(id: string): Promise<PriceItem | null> {
    try {
      console.log(`🔍 Getting price item by ID: ${id}`)
      await this.connect()

      const item = await this.db.collection("priceitems").findOne({ _id: new ObjectId(id) })

      if (item) {
        console.log(`✅ Price item found: ${item.description?.substring(0, 50)}`)
        return { ...item, id: item._id.toString() }
      }

      console.log(`❌ Price item not found: ${id}`)
      return null
    } catch (error) {
      console.error("❌ Error getting price item by ID:", error)
      throw error
    }
  }

  // Update price item
  static async updatePriceItem(id: string, updateData: Partial<PriceItem>): Promise<PriceItem | null> {
    try {
      console.log(`📝 Updating price item: ${id}`)
      console.log("📝 Update data:", updateData)
      await this.connect()

      // Clean the update data
      const cleanUpdateData = { ...updateData }
      delete cleanUpdateData.id
      delete cleanUpdateData._id

      // Add updated timestamp
      cleanUpdateData.updatedAt = new Date()

      const result = await this.db
        .collection("priceitems")
        .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: cleanUpdateData }, { returnDocument: "after" })

      if (result.value) {
        console.log(`✅ Price item updated successfully: ${result.value.description?.substring(0, 50)}`)
        return { ...result.value, id: result.value._id.toString() }
      }

      console.log(`❌ Price item not found for update: ${id}`)
      return null
    } catch (error) {
      console.error("❌ Error updating price item:", error)
      throw error
    }
  }

  // Delete price item
  static async deletePriceItem(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting price item: ${id}`)
      await this.connect()

      const result = await this.db.collection("priceitems").deleteOne({ _id: new ObjectId(id) })

      if (result.deletedCount > 0) {
        console.log(`✅ Price item deleted successfully: ${id}`)
        return true
      }

      console.log(`❌ Price item not found for deletion: ${id}`)
      return false
    } catch (error) {
      console.error("❌ Error deleting price item:", error)
      throw error
    }
  }

  static async createPriceItem(itemData: Partial<PriceItem>): Promise<PriceItem> {
    console.log("💰 Creating new price item:", itemData.description?.substring(0, 50))

    try {
      await this.connect()

      const newItem = {
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await this.db.collection("priceitems").insertOne(newItem)
      console.log("✅ Price item created with ID:", result.insertedId)

      return {
        ...newItem,
        id: result.insertedId.toString(),
      }
    } catch (error) {
      console.error("❌ Error creating price item:", error)
      throw error
    }
  }

  // User management methods
  static async getAllUsers(): Promise<User[]> {
    console.log("👥 Getting all users from database")
    try {
      await this.connect()
      const users = await this.db.collection("users").find({}).toArray()
      console.log("✅ Retrieved users:", users.length)
      return users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || "user",
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      }))
    } catch (error) {
      console.error("❌ Error getting users:", error)
      throw error
    }
  }

  static async updateUserVerification(userId: string, isVerified: boolean): Promise<boolean> {
    console.log("✅ Updating user verification:", { userId, isVerified })
    try {
      await this.connect()
      const result = await this.db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            isVerified,
            updatedAt: new Date(),
          },
        },
      )
      console.log("✅ User verification updated:", result.modifiedCount > 0)
      return result.modifiedCount > 0
    } catch (error) {
      console.error("❌ Error updating user verification:", error)
      throw error
    }
  }
}

// Export the class and the legacy function for backward compatibility
export default MongoDBService
export { MongoDBService }

// Legacy export for backward compatibility
export const connectToDatabase = async (): Promise<{ client: MongoClient; db: Db }> => {
  await MongoDBService.connect()
  return { client: MongoDBService["client"], db: MongoDBService["db"] }
}
