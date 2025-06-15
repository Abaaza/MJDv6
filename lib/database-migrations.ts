import { MongoClient, type Db } from "mongodb"

interface Migration {
  version: string
  name: string
  description: string
  up: (db: Db) => Promise<void>
  down: (db: Db) => Promise<void>
}

export class DatabaseMigrations {
  private client: MongoClient | null = null
  private db: Db | null = null

  private migrations: Migration[] = [
    {
      version: "1.0.0",
      name: "initial_setup",
      description: "Initial database setup with indexes",
      up: async (db: Db) => {
        // Create indexes for better performance
        await db.collection("users").createIndex({ email: 1 }, { unique: true })
        await db.collection("clients").createIndex({ email: 1 }, { unique: true, sparse: true })
        await db.collection("projects").createIndex({ clientId: 1 })
        await db.collection("projects").createIndex({ status: 1 })
        await db.collection("priceitems").createIndex({ code: 1 }, { unique: true, sparse: true })
        await db.collection("priceitems").createIndex({ category: 1 })
        await db.collection("priceitems").createIndex({ "$**": "text" })
        await db.collection("matching_jobs").createIndex({ projectId: 1 })
        await db.collection("matching_jobs").createIndex({ createdAt: -1 })
      },
      down: async (db: Db) => {
        // Drop indexes
        await db.collection("users").dropIndex({ email: 1 })
        await db.collection("clients").dropIndex({ email: 1 })
        await db.collection("projects").dropIndex({ clientId: 1 })
        await db.collection("projects").dropIndex({ status: 1 })
        await db.collection("priceitems").dropIndex({ code: 1 })
        await db.collection("priceitems").dropIndex({ category: 1 })
        await db.collection("matching_jobs").dropIndex({ projectId: 1 })
        await db.collection("matching_jobs").dropIndex({ createdAt: -1 })
      },
    },
    {
      version: "1.1.0",
      name: "add_user_roles",
      description: "Add role-based permissions to users",
      up: async (db: Db) => {
        // Add default role to existing users
        await db.collection("users").updateMany({ role: { $exists: false } }, { $set: { role: "user" } })

        // Create roles collection
        await db.collection("roles").insertMany([
          {
            _id: "admin",
            name: "Administrator",
            permissions: ["*"],
            description: "Full system access",
          },
          {
            _id: "manager",
            name: "Project Manager",
            permissions: ["projects:*", "clients:*", "reports:read"],
            description: "Project and client management",
          },
          {
            _id: "user",
            name: "User",
            permissions: ["projects:read", "clients:read", "price-matching:*"],
            description: "Basic user access",
          },
        ])
      },
      down: async (db: Db) => {
        // Remove role field from users
        await db.collection("users").updateMany({}, { $unset: { role: "" } })
        // Drop roles collection
        await db.collection("roles").drop()
      },
    },
    {
      version: "1.2.0",
      name: "add_audit_logging",
      description: "Add audit logging for user actions",
      up: async (db: Db) => {
        // Create audit_logs collection with indexes
        await db.collection("audit_logs").createIndex({ userId: 1 })
        await db.collection("audit_logs").createIndex({ action: 1 })
        await db.collection("audit_logs").createIndex({ timestamp: -1 })
        await db.collection("audit_logs").createIndex({ resource: 1 })

        // Add audit fields to existing collections
        const now = new Date()
        await db.collection("users").updateMany({}, { $set: { auditInfo: { createdAt: now, updatedAt: now } } })
        await db.collection("clients").updateMany({}, { $set: { auditInfo: { createdAt: now, updatedAt: now } } })
        await db.collection("projects").updateMany({}, { $set: { auditInfo: { createdAt: now, updatedAt: now } } })
      },
      down: async (db: Db) => {
        // Drop audit_logs collection
        await db.collection("audit_logs").drop()
        // Remove audit fields
        await db.collection("users").updateMany({}, { $unset: { auditInfo: "" } })
        await db.collection("clients").updateMany({}, { $unset: { auditInfo: "" } })
        await db.collection("projects").updateMany({}, { $unset: { auditInfo: "" } })
      },
    },
  ]

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

  async runMigrations(): Promise<{ success: boolean; message: string; migrationsRun: string[] }> {
    try {
      const { db } = await this.connect()

      // Get current migration version
      const currentMigration = await db.collection("_migrations").findOne({ type: "current" })
      const currentVersion = currentMigration?.version || "0.0.0"

      const migrationsToRun = this.migrations.filter((migration) => {
        return this.compareVersions(migration.version, currentVersion) > 0
      })

      if (migrationsToRun.length === 0) {
        return {
          success: true,
          message: "No migrations to run",
          migrationsRun: [],
        }
      }

      const migrationsRun: string[] = []

      for (const migration of migrationsToRun) {
        console.log(`Running migration: ${migration.name} (${migration.version})`)

        try {
          await migration.up(db)

          // Record migration
          await db.collection("_migrations").insertOne({
            version: migration.version,
            name: migration.name,
            description: migration.description,
            runAt: new Date(),
            type: "completed",
          })

          migrationsRun.push(`${migration.name} (${migration.version})`)
        } catch (error) {
          console.error(`Migration ${migration.name} failed:`, error)
          throw new Error(`Migration ${migration.name} failed: ${error}`)
        }
      }

      // Update current version
      await db.collection("_migrations").replaceOne(
        { type: "current" },
        {
          type: "current",
          version: migrationsToRun[migrationsToRun.length - 1].version,
          updatedAt: new Date(),
        },
        { upsert: true },
      )

      return {
        success: true,
        message: `Successfully ran ${migrationsRun.length} migrations`,
        migrationsRun,
      }
    } catch (error) {
      console.error("Migration error:", error)
      throw error
    }
  }

  async rollbackMigration(targetVersion: string): Promise<{ success: boolean; message: string }> {
    try {
      const { db } = await this.connect()

      const currentMigration = await db.collection("_migrations").findOne({ type: "current" })
      const currentVersion = currentMigration?.version || "0.0.0"

      const migrationsToRollback = this.migrations
        .filter((migration) => {
          return (
            this.compareVersions(migration.version, targetVersion) > 0 &&
            this.compareVersions(migration.version, currentVersion) <= 0
          )
        })
        .reverse()

      for (const migration of migrationsToRollback) {
        console.log(`Rolling back migration: ${migration.name} (${migration.version})`)
        await migration.down(db)

        // Remove migration record
        await db.collection("_migrations").deleteOne({
          version: migration.version,
          name: migration.name,
          type: "completed",
        })
      }

      // Update current version
      await db.collection("_migrations").replaceOne(
        { type: "current" },
        {
          type: "current",
          version: targetVersion,
          updatedAt: new Date(),
        },
        { upsert: true },
      )

      return {
        success: true,
        message: `Successfully rolled back to version ${targetVersion}`,
      }
    } catch (error) {
      console.error("Rollback error:", error)
      throw error
    }
  }

  async getMigrationStatus(): Promise<{
    currentVersion: string
    availableMigrations: Array<{ version: string; name: string; description: string; status: string }>
  }> {
    try {
      const { db } = await this.connect()

      const currentMigration = await db.collection("_migrations").findOne({ type: "current" })
      const currentVersion = currentMigration?.version || "0.0.0"

      const completedMigrations = await db.collection("_migrations").find({ type: "completed" }).toArray()

      const completedVersions = new Set(completedMigrations.map((m) => m.version))

      const availableMigrations = this.migrations.map((migration) => ({
        version: migration.version,
        name: migration.name,
        description: migration.description,
        status: completedVersions.has(migration.version) ? "completed" : "pending",
      }))

      return {
        currentVersion,
        availableMigrations,
      }
    } catch (error) {
      console.error("Error getting migration status:", error)
      throw error
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number)
    const v2Parts = version2.split(".").map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }
}

export const databaseMigrations = new DatabaseMigrations()
