// Team member authentication system
export interface TeamMember {
  id: string
  email: string
  password: string // In production, this should be hashed
  name: string
  team: string
  role: "team_member"
  createdAt: string
  isActive: boolean
}

export interface Manager {
  id: string
  email: string
  name: string
  role: "manager"
  googleId: string
}

// In production, replace this with a proper database
// For now, we'll use environment variables and a JSON structure
export class TeamAuthService {
  private teamMembers: TeamMember[] = []
  private managers: Manager[] = []

  constructor() {
    this.loadTeamMembers()
    this.loadManagers()
  }

  private loadTeamMembers() {
    // Load from environment variable or database
    const teamMembersData = process.env.TEAM_MEMBERS_DATA
    if (teamMembersData) {
      try {
        this.teamMembers = JSON.parse(teamMembersData)
      } catch (error) {
        console.error("Error parsing team members data:", error)
      }
    }
  }

  private loadManagers() {
    // Load managers from environment variable
    const managersData = process.env.MANAGERS_DATA
    if (managersData) {
      try {
        this.managers = JSON.parse(managersData)
      } catch (error) {
        console.error("Error parsing managers data:", error)
      }
    }
  }

  async authenticateTeamMember(email: string, password: string): Promise<TeamMember | null> {
    const member = this.teamMembers.find((m) => m.email === email && m.password === password && m.isActive)
    return member || null
  }

  async authenticateManager(googleEmail: string): Promise<Manager | null> {
    const manager = this.managers.find((m) => m.email === googleEmail)
    return manager || null
  }

  async createTeamMember(memberData: Omit<TeamMember, "id" | "createdAt">): Promise<TeamMember> {
    const newMember: TeamMember = {
      ...memberData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    this.teamMembers.push(newMember)
    await this.saveTeamMembers()
    return newMember
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<boolean> {
    const index = this.teamMembers.findIndex((m) => m.id === id)
    if (index === -1) return false

    this.teamMembers[index] = { ...this.teamMembers[index], ...updates }
    await this.saveTeamMembers()
    return true
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const index = this.teamMembers.findIndex((m) => m.id === id)
    if (index === -1) return false

    this.teamMembers.splice(index, 1)
    await this.saveTeamMembers()
    return true
  }

  getAllTeamMembers(): TeamMember[] {
    return this.teamMembers.filter((m) => m.isActive)
  }

  getTeamMembersByTeam(team: string): TeamMember[] {
    return this.teamMembers.filter((m) => m.team === team && m.isActive)
  }

  private async saveTeamMembers() {
    // In production, save to database
    // For now, you'll need to manually update the environment variable
    console.log("Team members updated. Update TEAM_MEMBERS_DATA environment variable with:")
    console.log(JSON.stringify(this.teamMembers, null, 2))
  }

  // Utility method to generate initial data
  static generateInitialData() {
    const teams = ["Content Development", "Design Team", "Technical Writing", "Quality Assurance"]
    const teamMembers: TeamMember[] = [
      {
        id: "1",
        email: "alice@company.com",
        password: "password123", // In production, hash this
        name: "Alice Johnson",
        team: "Content Development",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "2",
        email: "bob@company.com",
        password: "password123",
        name: "Bob Smith",
        team: "Content Development",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "3",
        email: "carol@company.com",
        password: "password123",
        name: "Carol Davis",
        team: "Design Team",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "4",
        email: "david@company.com",
        password: "password123",
        name: "David Wilson",
        team: "Design Team",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ]

    const managers: Manager[] = [
      {
        id: "1",
        email: "manager@company.com",
        name: "Manager User",
        role: "manager",
        googleId: "google-oauth-id",
      },
    ]

    return { teamMembers, managers }
  }
}
