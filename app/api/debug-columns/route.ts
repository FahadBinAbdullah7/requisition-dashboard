import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!apiKey || !spreadsheetId) {
    return NextResponse.json({
      error: "Missing configuration",
      apiKey: !!apiKey,
      spreadsheetId: !!spreadsheetId,
    })
  }

  try {
    // Get first 3 rows to see headers and sample data
    const range = "A1:CE3"
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        error: "Failed to fetch data",
        details: data,
      })
    }

    const rows = data.values || []
    const headers = rows[0] || []
    const sampleRow1 = rows[1] || []
    const sampleRow2 = rows[2] || []

    // Map column letters to indices
    const columnMap: Record<string, number> = {}
    for (let i = 0; i < headers.length; i++) {
      const columnLetter = String.fromCharCode(65 + (i % 26))
      columnMap[columnLetter] = i
    }

    return NextResponse.json({
      success: true,
      totalColumns: headers.length,
      headers: headers.map((header: string, index: number) => ({
        index,
        letter:
          index < 26
            ? String.fromCharCode(65 + index)
            : `${String.fromCharCode(64 + Math.floor(index / 26))}${String.fromCharCode(65 + (index % 26))}`,
        header,
      })),
      sampleData: {
        row1: sampleRow1,
        row2: sampleRow2,
      },
      statusColumn: {
        index: 82, // CE column
        letter: "CE",
        value: sampleRow1[82] || "empty",
      },
      mapping: {
        timestamp: { index: 0, value: sampleRow1[0] },
        email: { index: 1, value: sampleRow1[1] },
        productName: { index: 2, value: sampleRow1[2] },
        type: { index: 3, value: sampleRow1[3] },
        status: { index: 82, value: sampleRow1[82] },
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
