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
  // Add more fields as needed from your complex form
}

export class GoogleSheetsIntegration {
  private accessToken: string
  private spreadsheetId: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
    this.spreadsheetId = "1sxvfRTotejH8teKTOB27Eqqr00YR6LEsr6PBj58Iuns"
  }

  async getRequisitions(): Promise<RequisitionData[]> {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1!A:AZ`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
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
          timestamp: row[0] || "", // Timestamp
          email: row[1] || "", // Email Address
          productName: row[2] || "", // Product/Course/Requisition Name
          type: row[3] || "", // Type of the Product/Course/Requisition
          deliveryTimeline: row[4] || "", // Delivery Requirement Timeline
          assignedTeam: row[5] || "", // Select a Team or a Combination of Teams
          pocEmail: row[6] || "", // Email of the POC
          details: row[7] || "", // Details of the Product/Course/Requisition
          requisitionBreakdown: row[8] || "", // Requisition Breakdown (Google Sheet/Docs Link)
          estimatedStartDate: row[9] || "", // Estimated Start Date
          expectedDeliveryDate: row[10] || "", // Expected Delivery Date
          pocName: row[75] || "", // Name of the POC (based on your headers)
          status: row[82] || "pending", // CE column (0-indexed, so 82)
        }))
        .filter((req) => req.timestamp) // Filter out empty rows
    } catch (error) {
      console.error("Error fetching requisitions:", error)
      throw error
    }
  }

  async updateRequisitionStatus(rowIndex: number, status: string): Promise<boolean> {
    try {
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

      return response.ok
    } catch (error) {
      console.error("Error updating status:", error)
      return false
    }
  }

  async addStatusColumn(): Promise<boolean> {
    try {
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
