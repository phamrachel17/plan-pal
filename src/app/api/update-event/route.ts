import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCalendarClient } from '@/lib/api/calendar';
import { createEventDateTime } from '@/lib/utils/dateUtils';
import { ApiResponse } from '@/lib/types';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const { eventId, eventData } = await request.json();

    if (!eventId || !eventData) {
      return NextResponse.json(
        { success: false, error: 'Event ID and event data are required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    console.log('Update Event API - Event ID:', eventId);
    console.log('Update Event API - Event Data:', eventData);

    const calendar = getCalendarClient(session.accessToken as string);

    // Create the updated event
    const { start, end } = createEventDateTime(
      eventData.date,
      eventData.time,
      eventData.duration || 60
    );

    const updatedEvent = {
      summary: eventData.title,
      description: eventData.description || '',
      location: eventData.location || '',
      start: {
        dateTime: start.toISOString(),
        timeZone: 'America/New_York', // TODO: Get from user preferences
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'America/New_York', // TODO: Get from user preferences
      },
    };

    // Update the event
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: updatedEvent,
    });

    console.log('Event updated successfully:', response.data.id);

    return NextResponse.json({
      success: true,
      data: {
        eventId: response.data.id,
        message: `Successfully updated "${eventData.title}" to ${eventData.time}`
      }
    } as ApiResponse<{ eventId: string; message: string }>);

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
