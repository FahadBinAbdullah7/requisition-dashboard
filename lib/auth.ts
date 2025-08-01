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
    // List of managers and team members
    const managers = ["akram@10minuteschool.com"]
    const teamMembers = [
      "umama@10minuteschool.com", "shafqat@10minuteschool.com", "refat@10minuteschool.com", "nafish@10minuteschool.com",
      "sakibul@10minuteschool.com", "alamin@10minuteschool.com", "mahedi.tuhin@10minuteschool.com", "sagor@10minuteschool.com",
      "homaira@10minuteschool.com", "gm.mehedi@10minuteschool.com", "asif.khan@10minuteschool.com", "mehedi.shuvo@10minuteschool.com",
      "mdjunayetalama@gmail.com", "rasel@10minuteschool.com", "mdabdullah@10minuteschool.com", "naziha@10minuteschool.com",
      "yeasin@10minuteschool.com", "zafir@10minuteschool.com", "nayem.ahmed@10minuteschool.com", "sojib@10minuteschool.com",
      "hasib@10minuteschool.com"
    ]

    // Determine the user role based on the email
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
