import { type NextRequest, NextResponse } from "next/server"
import TeamAuthService from "@/lib/team-auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("=== TEAM LOGIN ATTEMPT ===")
    console.log("Email:", email)
    console.log("Password provided:", !!password)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const authService = new TeamAuthService()
    const teamMember = await authService.authenticateTeamMember(email.trim(), password)

    if (!teamMember) {
      console.log("❌ Authentication failed for:", email)
      return NextResponse.json(
        {
          error: "Invalid email or password. Please check your credentials and try again.",
        },
        { status: 401 },
      )
    }

    console.log("✅ Authentication successful for:", teamMember.email)

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        team: teamMember.team,
      },
      message: "Login successful",
    })

    // Set secure session cookie
    response.cookies.set("team_member_session", teamMember.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      sameSite: "lax",
      path: "/",
    })

    console.log("✅ Session cookie set for team member")
    return response
  } catch (error) {
    console.error("❌ Team login error:", error)
    return NextResponse.json(
      {
        error: "Login failed. Please try again later.",
      },
      { status: 500 },
    )
  }
}
