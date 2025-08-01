import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const spreadsheetId = "1sxvfRTotejH8teKTOB27Eqqr00YR6LEsr6PBj58Iuns"
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  console.log("=== DEBUGGING GOOGLE SHEETS ACCESS ===")
  console.log("Spreadsheet ID:", spreadsheetId)
  console.log("API Key present:", apiKey ? "YES" : "NO")
  console.log("API Key (first 10 chars):", apiKey?.substring(0, 10))

  try {
    // Step 1: Test basic spreadsheet access
    console.log("\n--- Step 1: Testing basic spreadsheet access ---")
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`

    const metadataResponse = await fetch(url)
    console.log("Metadata response status:", metadataResponse.status)

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      console.log("Metadata error:", errorText)
      return NextResponse.json({
        error: "Cannot access spreadsheet metadata",
        status: metadataResponse.status,
        details: errorText,
        suggestion: "Make sure your Google Sheet is public (Anyone with link can view)",
      })
    }

    const metadata = await metadataResponse.json()
    console.log("Sheet title:", metadata.properties?.title)
    console.log(
      "Available sheets:",
      metadata.sheets?.map((s: any) => s.properties.title),
    )

    // Step 2: Test different ranges
    console.log("\n--- Step 2: Testing different data ranges ---")
    const rangesToTest = [
      "Form Responses 1!A1:Z100",
      "'Form Responses 1'!A1:Z100",
      "A1:Z100",
      "Form Responses 1!A:Z",
      "'Form Responses 1'!A:Z",
    ]

    const results = []

    for (const range of rangesToTest) {
      try {
        console.log(`Testing range: ${range}`)
        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

        const dataResponse = await fetch(dataUrl)
        console.log(`Range ${range} - Status:`, dataResponse.status)

        if (dataResponse.ok) {
          const data = await dataResponse.json()
          const rowCount = data.values?.length || 0
          const colCount = data.values?.[0]?.length || 0

          console.log(`Range ${range} - Rows: ${rowCount}, Cols: ${colCount}`)
          console.log(`Range ${range} - First row:`, data.values?.[0])

          results.push({
            range,
            success: true,
            rowCount,
            colCount,
            firstRow: data.values?.[0],
            sampleData: data.values?.slice(0, 3),
          })

          // If we found data, break
          if (rowCount > 0) {
            break
          }
        } else {
          const errorText = await dataResponse.text()
          console.log(`Range ${range} - Error:`, errorText)
          results.push({
            range,
            success: false,
            error: errorText,
          })
        }
      } catch (error) {
        console.log(`Range ${range} - Exception:`, error)
        results.push({
          range,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: "Debug complete",
      spreadsheetId,
      apiKeyPresent: !!apiKey,
      metadata: {
        title: metadata.properties?.title,
        sheets: metadata.sheets?.map((s: any) => ({
          title: s.properties.title,
          sheetId: s.properties.sheetId,
          gridProperties: s.properties.gridProperties,
        })),
      },
      rangeTests: results,
      instructions: [
        "1. Make sure your Google Sheet is public: Share > Anyone with link can view",
        "2. Check if 'Form Responses 1' is the correct sheet name",
        "3. Verify your sheet has data in the first few rows",
        "4. Make sure column headers are in row 1",
      ],
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your API key and sheet permissions",
      },
      { status: 500 },
    )
  }
}
