import { type NextRequest, NextResponse } from "next/server"
import { TeamAuthService } from "@/lib/team-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const authService = new TeamAuthService()
    const teamMember = await authService.authenticateTeamMember(email, password)

    if (!teamMember) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Set session cookie for team member
    const response = NextResponse.json({
      user: {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        team: teamMember.team,
      },
    })

    response.cookies.set("team_member_session", teamMember.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Team login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
