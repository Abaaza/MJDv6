interface Permission {
  id: string
  name: string
  description: string
  category: "system" | "projects" | "clients" | "pricing" | "analytics" | "admin"
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

interface UserProfile {
  id: string
  email: string
  name: string
  roles: string[]
  department?: string
  position?: string
  phone?: string
  avatar?: string
  preferences: {
    theme: "light" | "dark" | "system"
    notifications: {
      email: boolean
      push: boolean
      desktop: boolean
    }
    defaultModel: "v0" | "v1" | "v2"
    language: string
  }
  lastLogin?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class UserManagementService {
  private static instance: UserManagementService
  private permissions: Permission[] = []
  private roles: Map<string, Role> = new Map()
  private userProfiles: Map<string, UserProfile> = new Map()

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService()
      UserManagementService.instance.initializeDefaultData()
    }
    return UserManagementService.instance
  }

  private initializeDefaultData(): void {
    // Initialize default permissions
    this.permissions = [
      // System permissions
      { id: "system.admin", name: "System Administration", description: "Full system access", category: "system" },
      { id: "system.settings", name: "System Settings", description: "Manage system settings", category: "system" },
      { id: "system.users", name: "User Management", description: "Manage users and roles", category: "system" },
      { id: "system.audit", name: "Audit Logs", description: "View audit logs", category: "system" },

      // Project permissions
      { id: "projects.create", name: "Create Projects", description: "Create new projects", category: "projects" },
      { id: "projects.edit", name: "Edit Projects", description: "Edit existing projects", category: "projects" },
      { id: "projects.delete", name: "Delete Projects", description: "Delete projects", category: "projects" },
      { id: "projects.view", name: "View Projects", description: "View project details", category: "projects" },

      // Client permissions
      { id: "clients.create", name: "Create Clients", description: "Add new clients", category: "clients" },
      { id: "clients.edit", name: "Edit Clients", description: "Edit client information", category: "clients" },
      { id: "clients.delete", name: "Delete Clients", description: "Delete clients", category: "clients" },
      { id: "clients.view", name: "View Clients", description: "View client details", category: "clients" },

      // Pricing permissions
      { id: "pricing.edit", name: "Edit Pricing", description: "Modify price lists", category: "pricing" },
      { id: "pricing.view", name: "View Pricing", description: "View price lists", category: "pricing" },
      { id: "pricing.match", name: "Price Matching", description: "Use AI price matching", category: "pricing" },
      { id: "pricing.batch", name: "Batch Processing", description: "Process multiple files", category: "pricing" },

      // Analytics permissions
      { id: "analytics.view", name: "View Analytics", description: "View analytics dashboards", category: "analytics" },
      { id: "analytics.export", name: "Export Analytics", description: "Export analytics data", category: "analytics" },

      // Admin permissions
      { id: "admin.api", name: "API Management", description: "Manage API keys and settings", category: "admin" },
      {
        id: "admin.billing",
        name: "Billing Management",
        description: "Manage billing and subscriptions",
        category: "admin",
      },
    ]

    // Initialize default roles
    const adminRole: Role = {
      id: "admin",
      name: "Administrator",
      description: "Full system access with all permissions",
      permissions: this.permissions.map((p) => p.id),
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const managerRole: Role = {
      id: "manager",
      name: "Project Manager",
      description: "Manage projects, clients, and pricing",
      permissions: [
        "projects.create",
        "projects.edit",
        "projects.view",
        "clients.create",
        "clients.edit",
        "clients.view",
        "pricing.view",
        "pricing.match",
        "pricing.batch",
        "analytics.view",
      ],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const userRole: Role = {
      id: "user",
      name: "Standard User",
      description: "Basic access to view and use price matching",
      permissions: ["projects.view", "clients.view", "pricing.view", "pricing.match"],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const viewerRole: Role = {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access to projects and pricing",
      permissions: ["projects.view", "clients.view", "pricing.view"],
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.roles.set("admin", adminRole)
    this.roles.set("manager", managerRole)
    this.roles.set("user", userRole)
    this.roles.set("viewer", viewerRole)
  }

  // Permission management
  getAllPermissions(): Permission[] {
    return this.permissions
  }

  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter((p) => p.category === category)
  }

  // Role management
  createRole(roleData: Omit<Role, "id" | "createdAt" | "updatedAt">): Role {
    const role: Role = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...roleData,
    }

    this.roles.set(role.id, role)
    return role
  }

  updateRole(roleId: string, updates: Partial<Omit<Role, "id" | "createdAt">>): Role | null {
    const role = this.roles.get(roleId)
    if (!role) return null

    const updatedRole = {
      ...role,
      ...updates,
      updatedAt: new Date(),
    }

    this.roles.set(roleId, updatedRole)
    return updatedRole
  }

  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId)
    if (!role || role.isSystem) return false

    this.roles.delete(roleId)
    return true
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null
  }

  // User profile management
  createUserProfile(profileData: Omit<UserProfile, "id" | "createdAt" | "updatedAt">): UserProfile {
    const profile: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...profileData,
    }

    this.userProfiles.set(profile.id, profile)
    return profile
  }

  updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, "id" | "createdAt">>): UserProfile | null {
    const profile = this.userProfiles.get(userId)
    if (!profile) return null

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    }

    this.userProfiles.set(userId, updatedProfile)
    return updatedProfile
  }

  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null
  }

  getAllUserProfiles(): UserProfile[] {
    return Array.from(this.userProfiles.values())
  }

  // Permission checking
  userHasPermission(userId: string, permission: string): boolean {
    const profile = this.getUserProfile(userId)
    if (!profile) return false

    for (const roleId of profile.roles) {
      const role = this.getRole(roleId)
      if (role && role.permissions.includes(permission)) {
        return true
      }
    }

    return false
  }

  getUserPermissions(userId: string): string[] {
    const profile = this.getUserProfile(userId)
    if (!profile) return []

    const permissions = new Set<string>()

    for (const roleId of profile.roles) {
      const role = this.getRole(roleId)
      if (role) {
        role.permissions.forEach((p) => permissions.add(p))
      }
    }

    return Array.from(permissions)
  }

  // User activity tracking
  recordUserLogin(userId: string): void {
    const profile = this.getUserProfile(userId)
    if (profile) {
      profile.lastLogin = new Date()
      profile.updatedAt = new Date()
      this.userProfiles.set(userId, profile)
    }
  }

  getActiveUsers(days = 30): UserProfile[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return this.getAllUserProfiles().filter(
      (profile) => profile.isActive && profile.lastLogin && profile.lastLogin > cutoffDate,
    )
  }

  // Bulk operations
  assignRoleToUsers(userIds: string[], roleId: string): void {
    const role = this.getRole(roleId)
    if (!role) return

    for (const userId of userIds) {
      const profile = this.getUserProfile(userId)
      if (profile && !profile.roles.includes(roleId)) {
        profile.roles.push(roleId)
        profile.updatedAt = new Date()
        this.userProfiles.set(userId, profile)
      }
    }
  }

  removeRoleFromUsers(userIds: string[], roleId: string): void {
    for (const userId of userIds) {
      const profile = this.getUserProfile(userId)
      if (profile) {
        profile.roles = profile.roles.filter((r) => r !== roleId)
        profile.updatedAt = new Date()
        this.userProfiles.set(userId, profile)
      }
    }
  }

  // Export/Import
  exportUserData(): any {
    return {
      permissions: this.permissions,
      roles: Array.from(this.roles.values()),
      userProfiles: Array.from(this.userProfiles.values()),
      exportedAt: new Date(),
    }
  }

  importUserData(data: any): void {
    if (data.permissions) this.permissions = data.permissions
    if (data.roles) {
      this.roles.clear()
      data.roles.forEach((role: Role) => this.roles.set(role.id, role))
    }
    if (data.userProfiles) {
      this.userProfiles.clear()
      data.userProfiles.forEach((profile: UserProfile) => this.userProfiles.set(profile.id, profile))
    }
  }
}
