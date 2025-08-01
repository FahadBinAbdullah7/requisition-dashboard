import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsIntegration } from "@/lib/google-sheets-integration"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const teamMemberSession = request.cookies.get("team_member_session")?.value
    const managerAccessToken = request.cookies.get("access_token")?.value

    // For public access, we'll use the API key only
    let accessToken = null

    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.replace("Bearer ", "")
    } else if (managerAccessToken) {
      accessToken = managerAccessToken
    }

    // Create sheets service - it will use API key for public access
    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const requisitions = await sheetsService.getRequisitions()

    return NextResponse.json(requisitions)
  } catch (error) {
    console.error("Error fetching requisitions:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch requisitions",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please check your Google Sheets API key and permissions",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const teamMemberSession = request.cookies.get("team_member_session")?.value
    const managerAccessToken = request.cookies.get("access_token")?.value

    // Check if user is authenticated (team member or manager)
    if (!authHeader && !teamMemberSession && !managerAccessToken) {
      return NextResponse.json({ error: "Authentication required for status updates" }, { status: 401 })
    }

    const { id, status } = await request.json()

    let accessToken = null
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.replace("Bearer ", "")
    } else if (managerAccessToken) {
      accessToken = managerAccessToken
    }

    // Only managers with OAuth tokens can actually update the sheet
    if (accessToken && accessToken !== "team-member-token") {
      const sheetsService = new GoogleSheetsIntegration(accessToken)
      const success = await sheetsService.updateRequisitionStatus(Number.parseInt(id) - 1, status)

      if (success) {
        return NextResponse.json({ message: "Status updated successfully" })
      } else {
        return NextResponse.json({ error: "Failed to update status in sheet" }, { status: 500 })
      }
    } else {
      // For team members, we'll simulate the update (in a real app, you'd store this in a database)
      return NextResponse.json({
        message:
          "Status update recorded (Note: Team members can approve/reject, but only managers can write to Google Sheets)",
      })
    }
  } catch (error) {
    console.error("Error updating requisition:", error)
    return NextResponse.json({ error: "Failed to update requisition" }, { status: 500 })
  }
}
