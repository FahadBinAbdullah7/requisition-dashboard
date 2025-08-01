import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsIntegration } from "@/lib/google-sheets-integration"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const requisitions = await sheetsService.getRequisitions()

    return NextResponse.json(requisitions)
  } catch (error) {
    console.error("Error fetching requisitions:", error)
    return NextResponse.json({ error: "Failed to fetch requisitions" }, { status: 500 })
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
