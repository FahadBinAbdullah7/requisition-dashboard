import { google } from "googleapis"

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
  private serviceAccountCredentials: any // To store parsed credentials

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || null
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "1wbuI0ZlGaXgEuUnGi3HVqZ38R8gA9-vnG0UnIqDPu4o"

    // Load service account credentials from environment variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      try {
        this.serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
      } catch (e) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:", e)
        this.serviceAccountCredentials = null
      }
    } else {
      console.warn("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable not set.")
      this.serviceAccountCredentials = null
    }
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
            pocName: row[11] || "",
            status: row[82] || "pending",
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
        .filter((req: RequisitionData) => req.timestamp && req.email) // Filter out empty rows
        .sort((a, b) => {
          const dateA = new Date(a.timestamp)
          const dateB = new Date(b.timestamp)
          return dateB.getTime() - dateA.getTime()
        })

      console.log("Final processed data count:", processedData.length)
      return processedData
    } catch (error) {
      console.error("Error in getRequisitions:", error)
      throw error
    }
  }

  async updateRequisitionStatus(rowIndex: number, status: string): Promise<boolean> {
    try {
      console.log("=== UPDATING REQUISITION STATUS ===")
      console.log("Row index:", rowIndex)
      console.log("New status:", status)

      if (!this.serviceAccountCredentials) {
        console.error("Service account credentials not loaded. Cannot update sheet.")
        return false
      }

      // Authenticate using the service account
      const auth = new google.auth.JWT({
        email: this.serviceAccountCredentials.client_email,
        key: this.serviceAccountCredentials.private_key.replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })

      const sheets = google.sheets({ version: "v4", auth })

      const range = `CE${rowIndex + 2}` // CE column, +2 for header and 1-indexed
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`

      console.log("Update URL:", updateUrl)
      console.log("Update range:", range)

      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: "RAW",
        requestBody: {
          values: [[status]],
        },
      })

      console.log("Status updated successfully in Google Sheets via Service Account")
      return true
    } catch (error) {
      console.error("Error updating status with service account:", error)
      return false
    }
  }

  async testSheetAccess(): Promise<any> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?key=${this.apiKey}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          title: data.properties?.title,
          sheets: data.sheets?.map((s: any) => s.properties.title),
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: errorText,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
