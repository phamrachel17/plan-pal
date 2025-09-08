import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log("Session in /api/calendar:", session);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // Fetch events for a wider range - 6 months back and 12 months forward
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const twelveMonthsFromNow = new Date();
    twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: sixMonthsAgo.toISOString(),
      timeMax: twelveMonthsFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json(response.data.items || []);
  } catch (error: any) {
    console.error("Google Calendar API error:", error);
    
    // Handle authentication errors specifically
    if (error.code === 401 || error.status === 401) {
      return NextResponse.json(
        { 
          error: "Authentication failed. Please sign out and sign in again to refresh your calendar access.",
          code: "AUTH_ERROR"
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    );
  }
}
