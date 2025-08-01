import { type NextRequest, NextResponse } from "next/server"
import { TeamAuthService } from "@/lib/team-auth"

export async function GET() {
  try {
    const authService = new TeamAuthService()
    const teamMembers = authService.getAllTeamMembers()
    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, team } = await request.json()

    if (!name || !email || !password || !team) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const authService = new TeamAuthService()
    const newMember = await authService.createTeamMember({
      email,
      password, // In production, hash this password
      name,
      team,
      role: "team_member",
      isActive: true,
    })

    return NextResponse.json(newMember)
  } catch (error) {
    console.error("Error creating team member:", error)
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
  }
}
