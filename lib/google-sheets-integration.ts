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
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1!A:CE`
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

      const response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Google Sheets API Error:", errorText)
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const rows = data.values || []

      if (rows.length === 0) {
        return []
      }

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

      // Update status in column CE (column 83)
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1!CE${rowIndex + 2}?valueInputOption=RAW`,
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

  async addStatusColumn(): Promise<boolean> {
    try {
      if (!this.accessToken || this.accessToken === "team-member-token") {
        console.error("Cannot add column: OAuth token required for write operations")
        return false
      }

      // Add "Status" header to column CE
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1!CE1?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [["Status"]],
          }),
        },
      )

      return response.ok
    } catch (error) {
      console.error("Error adding status column:", error)
      return false
    }
  }
}
