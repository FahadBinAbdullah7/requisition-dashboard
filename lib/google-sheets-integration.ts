// Enhanced Google Sheets API integration with proper column mapping
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

      if (!this.apiKey) {
        throw new Error("No Google Sheets API key found")
      }

      // Get all data from the sheet (A to CE columns)
      const range = "A:CE"
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}?key=${this.apiKey}`

      console.log("Fetching from URL:", url)
      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const rows = data.values || []

      console.log("Raw data received:")
      console.log("- Total rows:", rows.length)
      console.log("- Headers:", rows[0])
      console.log("- Sample row:", rows[1])

      if (rows.length <= 1) {
        console.log("No data rows found")
        return []
      }

      // Skip header row and process data
      const dataRows = rows.slice(1)

      const processedData = dataRows
        .map((row: string[], index: number) => {
          // Map columns based on your Google Form structure
          const requisition: RequisitionData = {
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
            pocName: row[11] || "", // Adjust based on your actual column
            status: row[82] || "pending", // Column CE (82 in 0-indexed)
          }

          // Log first few items for debugging
          if (index < 2) {
            console.log(`Processed row ${index + 1}:`, {
              id: requisition.id,
              productName: requisition.productName,
              email: requisition.email,
              status: requisition.status,
              timestamp: requisition.timestamp,
            })
          }

          return requisition
        })
        .filter((req) => req.timestamp && req.email) // Filter out empty rows

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

      const range = `CE${rowIndex + 2}` // CE column, +2 for header and 1-indexed
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

      return response.ok
    } catch (error) {
      console.error("Error updating status:", error)
      return false
    }
  }
}
