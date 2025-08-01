// Enhanced Google Sheets API integration with better debugging
export interface RequisitionData {
  id: string
  timestamp: string
  email: string
  productName: string
  type: string
  deliveryTimeline: string
  assignedTeam: string
  pocEmail: string
  details: string
  requisitionBreakdown: string
  estimatedStartDate: string
  expectedDeliveryDate: string
  pocName: string
  status: string
}

export class GoogleSheetsIntegration {
  private accessToken: string | null
  private apiKey: string | null
  private spreadsheetId: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || null
    this.spreadsheetId = "1sxvfRTotejH8teKTOB27Eqqr00YR6LEsr6PBj58Iuns"
  }

  async getRequisitions(): Promise<RequisitionData[]> {
    try {
      console.log("=== FETCHING REQUISITIONS ===")
      console.log("Spreadsheet ID:", this.spreadsheetId)
      console.log("API Key present:", !!this.apiKey)
      console.log("Access Token present:", !!this.accessToken)

      // First, let's get the sheet metadata to see available sheets
      let metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (this.accessToken && this.accessToken !== "team-member-token") {
        headers.Authorization = `Bearer ${this.accessToken}`
      } else if (this.apiKey) {
        metadataUrl += `?key=${this.apiKey}`
      } else {
        throw new Error("No authentication method available")
      }

      console.log("Fetching metadata from:", metadataUrl)
      const metadataResponse = await fetch(metadataUrl, { headers })

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text()
        console.error("Metadata fetch failed:", errorText)
        throw new Error(`Cannot access spreadsheet: ${metadataResponse.status} ${errorText}`)
      }

      const metadata = await metadataResponse.json()
      const availableSheets = metadata.sheets?.map((s: any) => s.properties.title) || []
      console.log("Available sheets:", availableSheets)

      // Determine the correct sheet name
      let sheetName = "Form Responses 1"
      if (!availableSheets.includes(sheetName)) {
        // Try alternative names
        const alternatives = ["Form responses 1", "Sheet1", availableSheets[0]]
        sheetName = alternatives.find((name) => availableSheets.includes(name)) || "Sheet1"
      }

      console.log("Using sheet name:", sheetName)

      // Now fetch the actual data
      const range = `'${sheetName}'!A:CE`
      let dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}`

      if (this.accessToken && this.accessToken !== "team-member-token") {
        // Use OAuth token
      } else if (this.apiKey) {
        dataUrl += `?key=${this.apiKey}`
      }

      console.log("Fetching data from:", dataUrl)
      const dataResponse = await fetch(dataUrl, { headers })

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text()
        console.error("Data fetch failed:", errorText)
        throw new Error(`Failed to fetch data: ${dataResponse.status} ${errorText}`)
      }

      const data = await dataResponse.json()
      const rows = data.values || []

      console.log("Raw data received:")
      console.log("- Total rows:", rows.length)
      console.log("- First row (headers):", rows[0])
      console.log("- Second row (first data):", rows[1])
      console.log("- Sample of first 3 rows:", rows.slice(0, 3))

      if (rows.length === 0) {
        console.log("No data found in the sheet")
        return []
      }

      if (rows.length === 1) {
        console.log("Only header row found, no data rows")
        return []
      }

      // Skip header row and map data
      const dataRows = rows.slice(1)
      console.log("Processing", dataRows.length, "data rows")

      const processedData = dataRows
        .map((row: string[], index: number) => {
          const requisition = {
            id: (index + 1).toString(),
            timestamp: row[0] || "",
            email: row[1] || "",
            productName: row[2] || "",
            type: row[3] || "",
            deliveryTimeline: row[4] || "",
            assignedTeam: row[5] || "",
            pocEmail: row[6] || "",
            details: row[7] || "",
            requisitionBreakdown: row[8] || "",
            estimatedStartDate: row[9] || "",
            expectedDeliveryDate: row[10] || "",
            pocName: row[75] || "", // Adjust this index based on your actual data
            status: row[82] || "pending", // Column CE (0-indexed, so 82)
          }

          // Log first few processed items for debugging
          if (index < 3) {
            console.log(`Processed row ${index + 1}:`, requisition)
          }

          return requisition
        })
        .filter((req) => req.timestamp) // Filter out empty rows

      console.log("Final processed data count:", processedData.length)
      return processedData
    } catch (error) {
      console.error("Error in getRequisitions:", error)
      throw error
    }
  }

  async updateRequisitionStatus(rowIndex: number, status: string): Promise<boolean> {
    try {
      if (!this.accessToken || this.accessToken === "team-member-token") {
        console.error("Cannot update status: OAuth token required for write operations")
        return false
      }

      const range = `'Form Responses 1'!CE${rowIndex + 2}`
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[status]],
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Update error:", errorText)
      }

      return response.ok
    } catch (error) {
      console.error("Error updating status:", error)
      return false
    }
  }
}
