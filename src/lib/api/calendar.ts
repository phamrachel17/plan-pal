import { google } from 'googleapis';
import { CalendarEvent } from '@/lib/types';

/**
 * Initialize Google Calendar API client
 * @param accessToken - OAuth access token from NextAuth
 * @returns Google Calendar API client
 */
export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.calendar({ version: 'v3', auth });
}

/**
 * Check for calendar conflicts
 * @param accessToken - OAuth access token
 * @param startTime - Event start time (ISO string)
 * @param endTime - Event end time (ISO string)
 * @returns Array of conflicting events
 */
export async function checkConflicts(
  accessToken: string,
  startTime: string,
  endTime: string
): Promise<CalendarEvent[]> {
  try {
    const calendar = getCalendarClient(accessToken);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description,
      start: {
        dateTime: event.start?.dateTime,
        date: event.start?.date,
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime,
        date: event.end?.date,
        timeZone: event.end?.timeZone,
      },
      location: event.location,
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName,
      })),
    })) || [];
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return [];
  }
}

/**
 * Create a new calendar event
 * @param accessToken - OAuth access token
 * @param eventData - Event data to create
 * @returns Created event
 */
export async function createCalendarEvent(
  accessToken: string,
  eventData: Omit<CalendarEvent, 'id'>
): Promise<CalendarEvent> {
  try {
    const calendar = getCalendarClient(accessToken);
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        attendees: eventData.attendees,
      },
    });

    return {
      id: response.data.id,
      summary: response.data.summary || 'Untitled Event',
      description: response.data.description,
      start: {
        dateTime: response.data.start?.dateTime,
        date: response.data.start?.date,
        timeZone: response.data.start?.timeZone,
      },
      end: {
        dateTime: response.data.end?.dateTime,
        date: response.data.end?.date,
        timeZone: response.data.end?.timeZone,
      },
      location: response.data.location,
      attendees: response.data.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName,
      })),
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Get available time slots
 * @param accessToken - OAuth access token
 * @param date - Date to check (ISO string)
 * @param duration - Duration in minutes
 * @returns Array of available time slots
 */
export async function getAvailableSlots(
  accessToken: string,
  date: string,
  duration: number = 60
): Promise<string[]> {
  try {
    const calendar = getCalendarClient(accessToken);
    
    // Get events for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const availableSlots: string[] = [];
    
    // Generate hourly slots from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      // Check if this slot conflicts with any existing events
      const hasConflict = events.some(event => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
        const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
        
        return (
          (slotStart >= eventStart && slotStart < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (slotStart <= eventStart && slotEnd >= eventEnd)
        );
      });
      
      if (!hasConflict) {
        availableSlots.push(slotStart.toISOString());
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}
