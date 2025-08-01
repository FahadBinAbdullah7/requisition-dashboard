import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value
    const userEmail = request.cookies.get("user_email")?.value

    if (!accessToken || !userEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const googleUser = await userResponse.json()

    // Determine user role based on email
    const getUserRole = (email: string): string => {
      const managers = ["manager@company.com", "admin@company.com"]
      const teamMembers = [
        "alice@company.com",
        "bob@company.com",
        "carol@company.com",
        "david@company.com",
        "eve@company.com",
        "frank@company.com",
        "grace@company.com",
        "henry@company.com",
      ]

      if (managers.includes(email)) {
        return "manager"
      } else if (teamMembers.includes(email)) {
        return "team_member"
      } else {
        return "submitter"
      }
    }

    const user = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      role: getUserRole(googleUser.email),
    }

    return NextResponse.json({ user, accessToken })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
