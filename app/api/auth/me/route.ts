import { type NextRequest, NextResponse } from "next/server"
import TeamAuthService from "@/lib/team-auth"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value
    const userEmail = request.cookies.get("user_email")?.value
    const teamMemberSession = request.cookies.get("team_member_session")?.value

    console.log("Auth check - Access token:", !!accessToken)
    console.log("Auth check - User email:", userEmail)
    console.log("Auth check - Team member session:", teamMemberSession)

    // Handle team member authentication first
    if (teamMemberSession) {
      const authService = new TeamAuthService()
      const teamMembers = authService.getAllTeamMembers()
      const teamMember = teamMembers.find((m) => m.id === teamMemberSession)

      if (teamMember) {
        console.log("Found team member:", teamMember.email)
        return NextResponse.json({
          user: {
            id: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            role: teamMember.role,
            team: teamMember.team,
          },
          accessToken: "team-member-token",
        })
      }
    }

    // Handle manager authentication
    if (!accessToken || !userEmail) {
      console.log("No authentication found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      console.log("Invalid Google token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const googleUser = await userResponse.json()

    // Determine user role based on email
    const getUserRole = (email: string): string => {
      const managers = ["manager@company.com", "admin@company.com"]

      if (managers.includes(email)) {
        return "manager"
      } else {
        return "submitter"
      }
    }

    const user = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      role: getUserRole(googleUser.email),
    }

    console.log("Found manager:", user.email)
    return NextResponse.json({ user, accessToken })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
