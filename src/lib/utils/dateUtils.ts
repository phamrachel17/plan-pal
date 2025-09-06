/**
 * Utility functions for date and time handling
 */

/**
 * Parse a date string and ensure it's valid
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Valid Date object
 */
export function parseEventDate(dateString: string): Date {
  // Handle potential year issues - if year seems wrong, assume current year
  const currentYear = new Date().getFullYear();
  const dateParts = dateString.split('-');
  
  if (dateParts.length === 3) {
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    
    // If year is way off (like 2025 when we're in 2024), correct it
    if (year > currentYear + 1 || year < currentYear - 1) {
      console.log(`Correcting year from ${year} to ${currentYear} for date: ${dateString}`);
      dateString = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
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
  duration: number = 60,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
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
