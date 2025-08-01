import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsIntegration } from "@/lib/google-sheets-integration"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const teamMemberSession = request.cookies.get("team_member_session")?.value
    const managerAccessToken = request.cookies.get("access_token")?.value

    // Handle team member authentication
    if (teamMemberSession) {
      // For team members, we need to use a service account or manager's token
      // Since team members don't have Google Sheets access, we'll use a fallback
      if (!managerAccessToken) {
        // Return mock data or use service account
        return NextResponse.json([])
      }
    }

    // Handle manager authentication
    const accessToken = authHeader?.replace("Bearer ", "") || managerAccessToken

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const requisitions = await sheetsService.getRequisitions()

    return NextResponse.json(requisitions)
  } catch (error) {
    console.error("Error fetching requisitions:", error)

    // Return more detailed error information
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
    const accessToken = authHeader?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status } = await request.json()
    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const success = await sheetsService.updateRequisitionStatus(Number.parseInt(id) - 1, status)

    if (success) {
      return NextResponse.json({ message: "Status updated successfully" })
    } else {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating requisition:", error)
    return NextResponse.json({ error: "Failed to update requisition" }, { status: 500 })
  }
}
