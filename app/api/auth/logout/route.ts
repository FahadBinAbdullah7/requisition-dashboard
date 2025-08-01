import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" })

  // Clear authentication cookies
  response.cookies.delete("access_token")
  response.cookies.delete("user_email")
  response.cookies.delete("team_member_session")

  return response
}
