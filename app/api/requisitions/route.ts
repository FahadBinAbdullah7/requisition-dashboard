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
    console.log("=== STATUS UPDATE REQUEST ===")

    const authHeader = request.headers.get("authorization")
    const teamMemberSession = request.cookies.get("team_member_session")?.value
    const managerAccessToken = request.cookies.get("access_token")?.value

    console.log("Auth header present:", !!authHeader)
    console.log("Team member session:", !!teamMemberSession)
    console.log("Manager access token:", !!managerAccessToken)

    // Check if user is authenticated (team member or manager)
    if (!authHeader && !teamMemberSession && !managerAccessToken) {
      return NextResponse.json({ error: "Authentication required for status updates" }, { status: 401 })
    }

    const { id, status } = await request.json()
    console.log("Update request - ID:", id, "Status:", status)

    let accessToken = null
    if (authHeader?.startsWith("Bearer ")) {
      accessToken = authHeader.replace("Bearer ", "")
    } else if (managerAccessToken) {
      accessToken = managerAccessToken
    } else if (teamMemberSession) {
      accessToken = "team-member-token"
    }

    console.log("Using access token type:", accessToken === "team-member-token" ? "team-member" : "manager")

    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const success = await sheetsService.updateRequisitionStatus(Number.parseInt(id) - 1, status)

    if (success) {
      console.log("Status update successful")
      return NextResponse.json({
        message: "Status updated successfully",
        updated: true,
        id,
        status,
      })
    } else {
      console.log("Status update failed")
      return NextResponse.json(
        {
          error: "Failed to update status in sheet",
          updated: false,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error updating requisition:", error)
    return NextResponse.json(
      {
        error: "Failed to update requisition",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
