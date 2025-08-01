// Google Sheets API integration
export interface RequisitionData {
  timestamp: string
  email: string
  productName: string
  type: string
  deliveryTimeline: string
  assignedTeam: string
  pocEmail: string
  details: string
  status?: string
  estimatedStartDate: string
  expectedDeliveryDate: string
}

export class GoogleSheetsService {
  private apiKey: string
  private spreadsheetId: string

  constructor(apiKey: string, spreadsheetId: string) {
    this.apiKey = apiKey
    this.spreadsheetId = spreadsheetId
  }

  async getRequisitions(): Promise<RequisitionData[]> {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1?key=${this.apiKey}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch data from Google Sheets")
      }

      const data = await response.json()
      const rows = data.values || []

      // Skip header row
      const dataRows = rows.slice(1)

      return dataRows.map((row: string[], index: number) => ({
        id: (index + 1).toString(),
        timestamp: row[0] || "",
        email: row[1] || "",
        productName: row[2] || "",
        type: row[3] || "",
        deliveryTimeline: row[4] || "",
        assignedTeam: row[5] || "",
        pocEmail: row[6] || "",
        details: row[7] || "",
        status: row[8] || "pending", // Add status column to your sheet
        estimatedStartDate: row[9] || "",
        expectedDeliveryDate: row[10] || "",
      }))
    } catch (error) {
      console.error("Error fetching requisitions:", error)
      return []
    }
  }

  async updateRequisitionStatus(rowIndex: number, status: string): Promise<boolean> {
    try {
      // This would require OAuth2 authentication for write access
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Sheet1!I${rowIndex + 2}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
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

  private getAccessToken(): string {
    // This should be implemented with proper OAuth2 flow
    // For now, return empty string - you'll need to implement OAuth2
    return ""
  }
}
