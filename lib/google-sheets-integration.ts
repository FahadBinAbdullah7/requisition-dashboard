// Enhanced Google Sheets API integration for your specific sheet
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
      // Try different sheet names/ranges
      const possibleRanges = [
        "Sheet1!A:CE", // Default sheet name
        "'Form Responses 1'!A:CE", // Common Google Form response sheet name
        "'Form responses 1'!A:CE", // Alternative naming
        "A:CE", // No sheet name specified
      ]

      let data = null
      let lastError = null

      for (const range of possibleRanges) {
        try {
          let url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}`
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          }

          // Use OAuth token if available (for managers), otherwise use API key
          if (this.accessToken && this.accessToken !== "team-member-token") {
            headers.Authorization = `Bearer ${this.accessToken}`
          } else if (this.apiKey) {
            url += `?key=${this.apiKey}`
          } else {
            throw new Error("No authentication method available")
          }

          console.log(`Trying to fetch from range: ${range}`)
          const response = await fetch(url, { headers })

          if (response.ok) {
            data = await response.json()
            console.log(`Successfully fetched data from range: ${range}`)
            break
          } else {
            const errorText = await response.text()
            console.log(`Failed to fetch from ${range}:`, errorText)
            lastError = errorText
          }
        } catch (error) {
          console.log(`Error with range ${range}:`, error)
          lastError = error
        }
      }

      if (!data) {
        throw new Error(`Failed to fetch data from any range. Last error: ${lastError}`)
      }

      const rows = data.values || []

      if (rows.length === 0) {
        console.log("No data found in the sheet")
        return []
      }

      console.log(`Found ${rows.length} rows of data`)
      console.log("First few rows:", rows.slice(0, 3))

      // Skip header row and map data based on your column structure
      const dataRows = rows.slice(1)

      return dataRows
        .map((row: string[], index: number) => ({
          id: (index + 1).toString(),
          timestamp: row[0] || "", // Column A: Timestamp
          email: row[1] || "", // Column B: Email Address
          productName: row[2] || "", // Column C: Product/Course/Requisition Name
          type: row[3] || "", // Column D: Type of the Product/Course/Requisition
          deliveryTimeline: row[4] || "", // Column E: Delivery Requirement Timeline
          assignedTeam: row[5] || "", // Column F: Select a Team or a Combination of Teams
          pocEmail: row[6] || "", // Column G: Email of the POC
          details: row[7] || "", // Column H: Details of the Product/Course/Requisition
          requisitionBreakdown: row[8] || "", // Column I: Requisition Breakdown (Google Sheet/Docs Link)
          estimatedStartDate: row[9] || "", // Column J: Estimated Start Date
          expectedDeliveryDate: row[10] || "", // Column K: Expected Delivery Date
          pocName: row[75] || "", // Column BX: Name of the POC (adjust based on your actual column)
          status: row[82] || "pending", // Column CE: Status (0-indexed, so 82)
        }))
        .filter((req) => req.timestamp) // Filter out empty rows
    } catch (error) {
      console.error("Error fetching requisitions:", error)
      throw error
    }
  }

  async updateRequisitionStatus(rowIndex: number, status: string): Promise<boolean> {
    try {
      if (!this.accessToken || this.accessToken === "team-member-token") {
        console.error("Cannot update status: OAuth token required for write operations")
        return false
      }

      // Try different sheet names for updating
      const possibleSheetNames = ["Sheet1", "Form Responses 1", "Form responses 1"]

      for (const sheetName of possibleSheetNames) {
        try {
          const range = `'${sheetName}'!CE${rowIndex + 2}`
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

          if (response.ok) {
            console.log(`Successfully updated status in ${sheetName}`)
            return true
          }
        } catch (error) {
          console.log(`Failed to update in ${sheetName}:`, error)
        }
      }

      return false
    } catch (error) {
      console.error("Error updating status:", error)
      return false
    }
  }

  // Method to test sheet access
  async testSheetAccess(): Promise<{ success: boolean; sheetNames: string[]; error?: string }> {
    try {
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (this.accessToken && this.accessToken !== "team-member-token") {
        headers.Authorization = `Bearer ${this.accessToken}`
      } else if (this.apiKey) {
        url += `?key=${this.apiKey}`
      }

      const response = await fetch(url, { headers })

      if (response.ok) {
        const data = await response.json()
        const sheetNames = data.sheets?.map((sheet: any) => sheet.properties.title) || []
        return { success: true, sheetNames }
      } else {
        const errorText = await response.text()
        return { success: false, sheetNames: [], error: errorText }
      }
    } catch (error) {
      return { success: false, sheetNames: [], error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}
