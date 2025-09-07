// Chat and Event Types for Plan Pal

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  eventData?: EventSuggestion;
  rescheduleContext?: {
    type: 'existing' | 'new';
    conflictId?: string;
    originalEvent?: CalendarEvent | EventSuggestion;
  };
}

export interface EventSuggestion {
  title: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  location?: string;
  description?: string;
  duration?: number; // in minutes
  isConfirmed: boolean;
  conflicts?: CalendarEvent[]; // For conflict detection
  suggestedSlots?: string[]; // Alternative time slots
  rescheduleExisting?: {
    originalEventId?: string;
    originalEvent?: CalendarEvent;
  };
}

export interface ChatResponse {
  message: string;
  eventSuggestion?: EventSuggestion;
  requiresConfirmation: boolean;
}

export interface GeminiEventParse {
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  duration?: number;
  confidence: number; // 0-1 confidence score
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Calendar Event types (for Google Calendar integration)
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

// User preferences
export interface UserPreferences {
  timeZone: string;
  reminderMinutes: number; // default 30
  phoneNumber?: string;
  calendarId: string; // Google Calendar ID
}