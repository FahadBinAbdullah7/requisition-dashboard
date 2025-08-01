// Google OAuth authentication
export interface User {
  email: string
  name: string
  role: "submitter" | "team_member" | "manager"
  picture?: string
}

export class AuthService {
  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      // Initialize Google OAuth
      const response = await fetch("https://accounts.google.com/o/oauth2/v2/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          redirect_uri: window.location.origin + "/auth/callback",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets",
        }),
      })

      // This is a simplified version - you'll need to implement the full OAuth2 flow
      return null
    } catch (error) {
      console.error("Authentication error:", error)
      return null
    }
  }

  async getUserRole(email: string): Promise<string> {
    // This should check against your team member database
    // For now, return based on email domain or hardcoded list
    const managers = ["manager@company.com"]
    const teamMembers = [
      "alice@company.com",
      "bob@company.com",
      "carol@company.com",
      "david@company.com",
      "eve@company.com",
      "frank@company.com",
      "grace@company.com",
      "henry@company.com",
    ]

    if (managers.includes(email)) {
      return "manager"
    } else if (teamMembers.includes(email)) {
      return "team_member"
    } else {
      return "submitter"
    }
  }

  signOut(): void {
    // Clear authentication tokens
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
  }
}
