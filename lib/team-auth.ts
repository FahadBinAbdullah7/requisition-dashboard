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
export default class TeamAuthService {
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
        email: "umama@10minuteschool.com",
        password: "password123", // In production, hash this
        name: "Umama",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "2",
        email: "shafqat@10minuteschool.com",
        password: "password123",
        name: "Shafqat",
        team: "QAC",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "3",
        email: "fahad@10minuteschool.com",
        password: "password123",
        name: "Fahad",
        team: "CM",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "4",
        email: "refat@10minuteschool.com",
        password: "password123",
        name: "Refat",
        team: "Class Ops",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "5",
        email: "nafish@10minuteschool.com",
        password: "password123",
        name: "Nafish",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "6",
        email: "sakibul@10minuteschool.com",
        password: "password123",
        name: "Sakibul",
        team: "QAC",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "7",
        email: "alamin@10minuteschool.com",
        password: "password123",
        name: "Alamin",
        team: "CM",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "8",
        email: "mahedi.tuhin@10minuteschool.com",
        password: "password123",
        name: "Mahedi Tuhin",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "9",
        email: "sagor@10minuteschool.com",
        password: "password123",
        name: "Sagor",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "10",
        email: "homaira@10minuteschool.com",
        password: "password123",
        name: "Homaira",
        team: "QAC",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "11",
        email: "gm.mehedi@10minuteschool.com",
        password: "password123",
        name: "GM Mehedi",
        team: "CM",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "12",
        email: "asif.khan@10minuteschool.com",
        password: "password123",
        name: "Asif Khan",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "13",
        email: "mehedi.shuvo@10minuteschool.com",
        password: "password123",
        name: "Mehedi Shuvo",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "14",
        email: "mdjunayetalama@gmail.com",
        password: "password123",
        name: "Md Junayet Alama",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "15",
        email: "rasel@10minuteschool.com",
        password: "password123",
        name: "Rasel",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "16",
        email: "mdabdullah@10minuteschool.com",
        password: "password123",
        name: "Md Abdullah",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "17",
        email: "naziha@10minuteschool.com",
        password: "password123",
        name: "Naziha",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "18",
        email: "yeasin@10minuteschool.com",
        password: "password123",
        name: "Yeasin",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "19",
        email: "zafir@10minuteschool.com",
        password: "password123",
        name: "Zafir",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "20",
        email: "nayem.ahmed@10minuteschool.com",
        password: "password123",
        name: "Nayem Ahmed",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "21",
        email: "sojib@10minuteschool.com",
        password: "password123",
        name: "Sojib",
        team: "SMD",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "22",
        email: "hasib@10minuteschool.com",
        password: "password123",
        name: "Hasib",
        team: "CLASS OPS",
        role: "team_member",
        createdAt: new Date().toISOString(),
        isActive: true,
      }
    ]

    const managers: Manager[] = [
      {
        id: "1",
        email: "akram@10minuteschool.com",
        name: "Akram",
        role: "manager",
        googleId: "google-oauth-manager-id",
      },
    ]

    return { teamMembers, managers }
  }
}
