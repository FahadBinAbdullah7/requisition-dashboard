import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsIntegration } from "@/lib/google-sheets-integration"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "")

    const sheetsService = new GoogleSheetsIntegration(accessToken)
    const testResult = await sheetsService.testSheetAccess()

    return NextResponse.json({
      message: "Sheet access test",
      ...testResult,
      spreadsheetId: "1sxvfRTotejH8teKTOB27Eqqr00YR6LEsr6PBj58Iuns",
      apiKey: process.env.GOOGLE_SHEETS_API_KEY ? "Present" : "Missing",
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
