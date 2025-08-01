import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  console.log("=== API KEY TEST ===")
  console.log("API Key present:", !!apiKey)
  console.log("API Key length:", apiKey?.length)
  console.log("Spreadsheet ID:", spreadsheetId)

  if (!apiKey) {
    return NextResponse.json({
      error: "Missing API key",
      message: "Please add GOOGLE_SHEETS_API_KEY to your .env.local file",
    })
  }

  if (!spreadsheetId) {
    return NextResponse.json({
      error: "Missing spreadsheet ID",
      message: "Please add GOOGLE_SPREADSHEET_ID to your .env.local file",
    })
  }

  try {
    // Test 1: Get spreadsheet metadata
    console.log("Testing spreadsheet access...")
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`

    const metadataResponse = await fetch(metadataUrl)
    const metadataData = await metadataResponse.json()

    if (!metadataResponse.ok) {
      return NextResponse.json({
        error: "Metadata fetch failed",
        status: metadataResponse.status,
        details: metadataData,
        troubleshooting: [
          "1. Check if your API key is correct",
          "2. Make sure Google Sheets API is enabled",
          "3. Verify your sheet is public (Anyone with link can view)",
          "4. Wait a few minutes for the API key to activate",
        ],
      })
    }

    // Test 2: Get actual data
    console.log("Testing data access...")
    const sheetName = metadataData.sheets?.[0]?.properties?.title || "Sheet1"
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z10?key=${apiKey}`

    const dataResponse = await fetch(dataUrl)
    const data = await dataResponse.json()

    if (!dataResponse.ok) {
      return NextResponse.json({
        error: "Data fetch failed",
        status: dataResponse.status,
        details: data,
        metadata: {
          title: metadataData.properties?.title,
          sheets: metadataData.sheets?.map((s: any) => s.properties.title),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "✅ API key is working perfectly!",
      spreadsheet: {
        title: metadataData.properties?.title,
        sheets: metadataData.sheets?.map((s: any) => s.properties.title),
      },
      data: {
        rowCount: data.values?.length || 0,
        columnCount: data.values?.[0]?.length || 0,
        firstRow: data.values?.[0] || [],
        sampleData: data.values?.slice(0, 3) || [],
      },
      nextSteps: ["Your API key is working!", "Now restart your development server", "Try logging in to the dashboard"],
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      error: "Connection test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      suggestion: "Check your internet connection and API key",
    })
  }
}
