import { type NextRequest, NextResponse } from "next/server"
import { TeamAuthService } from "@/lib/team-auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, email, password, team } = await request.json()
    const authService = new TeamAuthService()

    const updates: any = { name, email, team }
    if (password) {
      updates.password = password // In production, hash this
    }

    const success = await authService.updateTeamMember(params.id, updates)

    if (success) {
      return NextResponse.json({ message: "Team member updated successfully" })
    } else {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authService = new TeamAuthService()
    const success = await authService.deleteTeamMember(params.id)

    if (success) {
      return NextResponse.json({ message: "Team member deleted successfully" })
    } else {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting team member:", error)
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 })
  }
}
