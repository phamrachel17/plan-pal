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
      id: event.id || undefined,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: {
        dateTime: event.start?.dateTime || undefined,
        date: event.start?.date || undefined,
        timeZone: event.start?.timeZone || undefined,
      },
      end: {
        dateTime: event.end?.dateTime || undefined,
        date: event.end?.date || undefined,
        timeZone: event.end?.timeZone || undefined,
      },
      location: event.location || undefined,
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName || undefined,
      })),
    })) || [];
  } catch (error: any) {
    console.error('Error checking conflicts:', error);
    
    // Handle authentication errors specifically
    if (error.code === 401 || error.status === 401) {
      throw new Error('Authentication failed. Please sign out and sign in again to refresh your calendar access.');
    }
    
    // Handle other API errors
    if (error.code === 403) {
      throw new Error('Calendar access denied. Please check your Google Calendar permissions.');
    }
    
    throw new Error('Failed to check calendar conflicts. Please try again.');
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
      id: response.data.id || undefined,
      summary: response.data.summary || 'Untitled Event',
      description: response.data.description || undefined,
      start: {
        dateTime: response.data.start?.dateTime || undefined,
        date: response.data.start?.date || undefined,
        timeZone: response.data.start?.timeZone || undefined,
      },
      end: {
        dateTime: response.data.end?.dateTime || undefined,
        date: response.data.end?.date || undefined,
        timeZone: response.data.end?.timeZone || undefined,
      },
      location: response.data.location || undefined,
      attendees: response.data.attendees?.map(attendee => ({
        email: attendee.email || '',
        displayName: attendee.displayName || undefined,
      })),
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
    // Handle authentication errors specifically
    if (error.code === 401 || error.status === 401) {
      throw new Error('Authentication failed. Please sign out and sign in again to refresh your calendar access.');
    }
    
    // Handle other API errors
    if (error.code === 403) {
      throw new Error('Calendar access denied. Please check your Google Calendar permissions.');
    }
    
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
  duration: number = 60,
  originalTime?: string
): Promise<string[]> {
  try {
    const calendar = getCalendarClient(accessToken);
    
    // Get events for the entire day
    // Parse the date string properly to avoid timezone issues
    const dateObj = new Date(date + 'T00:00:00');
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateObj);
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
    
    console.log('Available slots - Events found:', events.length);
    console.log('Available slots - Original time:', originalTime);
    console.log('Available slots - Duration:', duration);
    console.log('Available slots - Query date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
    console.log('Available slots - Query date range (local):', startOfDay.toLocaleString(), 'to', endOfDay.toLocaleString());
    
    // Log the conflicting events for debugging
    events.forEach((event, index) => {
      console.log(`Event ${index}: ${event.summary} from ${event.start?.dateTime || event.start?.date} to ${event.end?.dateTime || event.end?.date}`);
      console.log(`  - Start type: ${event.start?.dateTime ? 'dateTime' : 'date'}`);
      console.log(`  - End type: ${event.end?.dateTime ? 'dateTime' : 'date'}`);
      
      // Add more detailed date information
      if (event.start?.dateTime) {
        const startDate = new Date(event.start.dateTime);
        console.log(`  - Start dateTime parsed: ${startDate.toISOString()} (${startDate.toLocaleString()})`);
      }
      if (event.start?.date) {
        const startDate = new Date(event.start.date);
        console.log(`  - Start date parsed: ${startDate.toISOString()} (${startDate.toLocaleString()})`);
      }
    });
    
    // If we have an original time, generate slots around that time first
    if (originalTime) {
      const [hours, minutes] = originalTime.split(':').map(Number);
      const originalHour = hours;
      
      // Generate slots around the original time (±2 hours, every 30 minutes)
      // But skip the original time if it conflicts
      for (let offset = -2; offset <= 2; offset += 0.5) {
        const slotHour = originalHour + offset;
        if (slotHour >= 6 && slotHour <= 22) { // Reasonable time range
          // Create slot times using the same date parsing method as the query
          const slotStart = new Date(date + 'T00:00:00');
          slotStart.setHours(Math.floor(slotHour), (slotHour % 1) * 60, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + duration);
          
          // Check if this slot conflicts with any existing events
          const hasConflict = events.some(event => {
            const eventStartStr = event.start?.dateTime || event.start?.date;
            const eventEndStr = event.end?.dateTime || event.end?.date;
            
            // Skip events with undefined dates
            if (!eventStartStr || !eventEndStr) {
              console.log(`Skipping event "${event.summary}" - undefined dates`);
              return false;
            }
            
            const eventStart = new Date(eventStartStr);
            const eventEnd = new Date(eventEndStr);
            
            // Check if dates are valid
            if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
              console.log(`Skipping event "${event.summary}" - invalid dates`);
              return false;
            }
            
            // Handle all-day events (date only, no time)
            if (event.start?.date && !event.start?.dateTime) {
              // All-day event - check if the slot date falls within the event date range
              const eventStartDate = eventStart.toDateString();
              const eventEndDate = eventEnd.toDateString();
              const slotDate = slotStart.toDateString();
              
              // Check if slot date is between event start and end (inclusive)
              const slotTime = slotStart.getTime();
              const eventStartTime = eventStart.getTime();
              const eventEndTime = eventEnd.getTime();
              
              if (slotTime >= eventStartTime && slotTime < eventEndTime) {
                console.log(`Slot ${formatTimeTo12Hour(slotStart.getHours(), slotStart.getMinutes())} conflicts with all-day event "${event.summary}" (${eventStartStr} to ${eventEndStr})`);
                return true;
              }
              return false;
            }
            
            // More precise conflict detection for timed events
            const conflicts = (
              (slotStart >= eventStart && slotStart < eventEnd) ||
              (slotEnd > eventStart && slotEnd <= eventEnd) ||
              (slotStart <= eventStart && slotEnd >= eventEnd) ||
              // Also check for partial overlaps
              (slotStart < eventStart && slotEnd > eventStart) ||
              (slotStart < eventEnd && slotEnd > eventEnd)
            );
            
            if (conflicts) {
              console.log(`Slot ${formatTimeTo12Hour(slotStart.getHours(), slotStart.getMinutes())} conflicts with "${event.summary}"`);
            }
            
            return conflicts;
          });
          
          if (!hasConflict) {
            // Format time in 12-hour format
            const formattedTime = formatTimeTo12Hour(slotStart.getHours(), slotStart.getMinutes());
            availableSlots.push(formattedTime);
          } else {
            console.log(`Slot ${formatTimeTo12Hour(slotStart.getHours(), slotStart.getMinutes())} conflicts with existing event`);
          }
        }
      }
    }
    
    // If we don't have enough slots around the original time, add more general slots
    if (availableSlots.length < 3) {
      // Generate hourly slots from 8 AM to 8 PM
      for (let hour = 8; hour <= 20; hour++) {
        // Create slot times using the same date parsing method as the query
        const slotStart = new Date(date + 'T00:00:00');
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);
        
        // Check if this slot conflicts with any existing events
        const hasConflict = events.some(event => {
          const eventStartStr = event.start?.dateTime || event.start?.date;
          const eventEndStr = event.end?.dateTime || event.end?.date;
          
          // Skip events with undefined dates
          if (!eventStartStr || !eventEndStr) {
            return false;
          }
          
          const eventStart = new Date(eventStartStr);
          const eventEnd = new Date(eventEndStr);
          
          // Check if dates are valid
          if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            return false;
          }
          
          // Handle all-day events (date only, no time)
          if (event.start?.date && !event.start?.dateTime) {
            // All-day event - check if the slot date falls within the event date range
            const slotTime = slotStart.getTime();
            const eventStartTime = eventStart.getTime();
            const eventEndTime = eventEnd.getTime();
            
            // Check if slot date is between event start and end (inclusive)
            return slotTime >= eventStartTime && slotTime < eventEndTime;
          }
          
          // More precise conflict detection for timed events
          return (
            (slotStart >= eventStart && slotStart < eventEnd) ||
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (slotStart <= eventStart && slotEnd >= eventEnd) ||
            // Also check for partial overlaps
            (slotStart < eventStart && slotEnd > eventStart) ||
            (slotStart < eventEnd && slotEnd > eventEnd)
          );
        });
        
        if (!hasConflict) {
          const formattedTime = formatTimeTo12Hour(slotStart.getHours(), slotStart.getMinutes());
          if (!availableSlots.includes(formattedTime)) {
            availableSlots.push(formattedTime);
          }
        }
      }
    }
    
    console.log('Available slots generated:', availableSlots);
    return availableSlots.slice(0, 6); // Return max 6 suggestions
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}

// Helper function to format time in 12-hour format
function formatTimeTo12Hour(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${ampm}`;
}
