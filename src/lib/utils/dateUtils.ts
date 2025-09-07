/**
 * Utility functions for date and time handling
 */

/**
 * Parse a date string and ensure it's valid
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Valid Date object
 */
export function parseEventDate(dateString: string): Date {
  const date = new Date(dateString + 'T00:00:00');
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  return date;
}

/**
 * Parse a time string and ensure it's valid
 * @param timeString - Time string in HH:MM format
 * @returns Object with hours and minutes
 */
export function parseEventTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time string: ${timeString}`);
  }
  
  return { hours, minutes };
}

/**
 * Create a proper datetime for calendar events
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format
 * @param timeZone - Timezone (defaults to local)
 * @returns Object with start and end datetime strings
 */
export function createEventDateTime(
  dateString: string, 
  timeString: string, 
  duration: number = 60
): { start: string; end: string } {
  const eventDate = parseEventDate(dateString);
  const { hours, minutes } = parseEventTime(timeString);
  
  // Create start time
  const startDateTime = new Date(eventDate);
  startDateTime.setHours(hours, minutes, 0, 0);
  
  // Create end time
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + duration);
  
  return {
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString()
  };
}

/**
 * Format a date string for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a time string for display
 * @param timeString - Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Validate that a date is not in the past
 * @param dateString - Date string to validate
 * @returns true if date is valid and not in the past
 */
export function validateEventDate(dateString: string): boolean {
  try {
    const eventDate = parseEventDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventDate >= today;
  } catch {
    return false;
  }
}
