// Run this script once to add the Status column to your Google Sheet
const { GoogleAuth } = require("google-auth-library")
const google = require("googleapis") // Declare the google variable

async function addStatusColumn() {
  const auth = new GoogleAuth({
    keyFile: "path/to/your/service-account-key.json", // You'll need to create this
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = "1sxvfRTotejH8teKTOB27Eqqr00YR6LEsr6PBj58Iuns"

  try {
    // Add "Status" header to column CA (column 79)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!CA1",
      valueInputOption: "RAW",
      resource: {
        values: [["Status"]],
      },
    })

    console.log("Status column added successfully!")
  } catch (error) {
    console.error("Error adding status column:", error)
  }
}

addStatusColumn()
