import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCalendarEvent, checkConflicts, getAvailableSlots } from '@/lib/api/calendar';
import { createEventDateTime, validateEventDate } from '@/lib/utils/dateUtils';
import { EventSuggestion, ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    console.log('Schedule API - Session:', session); // Debug log
    console.log('Schedule API - Access token:', session?.accessToken); // Debug log
    
    if (!session?.user) {
      console.log('Schedule API - No user in session');
      return NextResponse.json(
        { success: false, error: 'User not authenticated' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    // Check if we have the access token
    if (!session.accessToken) {
      console.log('Schedule API - No access token in session');
      return NextResponse.json(
        { success: false, error: 'Calendar access not granted. Please sign in again.' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const { eventData } = await request.json();

    if (!eventData) {
      return NextResponse.json(
        { success: false, error: 'Event data is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Convert EventSuggestion to CalendarEvent format
    // Validate the date first
    if (!validateEventDate(eventData.date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date or date is in the past' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Create proper datetime objects
    const { start, end } = createEventDateTime(
      eventData.date, 
      eventData.time, 
      eventData.duration || 60
    );
    
    console.log('Event scheduling details:');
    console.log('- Original date:', eventData.date);
    console.log('- Original time:', eventData.time);
    console.log('- Duration:', eventData.duration || 60, 'minutes');
    console.log('- Start datetime:', start);
    console.log('- End datetime:', end);
    console.log('- Local start:', new Date(start).toLocaleString());
    console.log('- Local end:', new Date(end).toLocaleString());

    const calendarEvent = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: eventData.location,
    };

    // Check for conflicts
    const conflicts = await checkConflicts(
      session.accessToken as string,
      start,
      end
    );

    if (conflicts.length > 0) {
      // Return conflict information
      return NextResponse.json(
        {
          success: false,
          error: 'Time conflict detected',
          data: {
            conflicts,
            suggestedSlots: await getAvailableSlots(
              session.accessToken as string,
              eventData.date,
              eventData.duration || 60
            ),
          },
        } as ApiResponse<any>,
        { status: 409 }
      );
    }

    // Create the event
    const createdEvent = await createCalendarEvent(
      session.accessToken as string,
      calendarEvent
    );

    return NextResponse.json(
      { success: true, data: createdEvent } as ApiResponse<any>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Schedule API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to schedule event' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}