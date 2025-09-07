import { NextRequest, NextResponse } from 'next/server';
import { parseEventWithGemini, generateConfirmationMessage } from '@/lib/api/gemini';
import { ChatResponse, ApiResponse, EventSuggestion } from '@/lib/types';
import { checkConflicts, getAvailableSlots } from '@/lib/api/calendar';
import { createEventDateTime } from '@/lib/utils/dateUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { message, rescheduleContext } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    console.log('Chat API received message:', message);
    console.log('Reschedule context:', rescheduleContext);

    // Handle reschedule context
    if (rescheduleContext?.type === 'existing') {
      // User is providing a new time for an existing event
      // For reschedule, we only need to parse the time, not create a full event
      let newTime = '';
      let newDate = rescheduleContext.originalEvent?.start?.dateTime?.split('T')[0] || '';
      
      // Simple time parsing for common formats
      const timeMatch = message.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const ampm = timeMatch[3]?.toLowerCase();
        
        // Convert to 24-hour format
        if (ampm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        // Fallback to Gemini parsing if simple parsing fails
        try {
          const parsedEvent = await parseEventWithGemini(message);
          newTime = parsedEvent.time;
          newDate = parsedEvent.date;
        } catch (error) {
          console.error('Error parsing time with Gemini:', error);
          return NextResponse.json({
            success: false,
            error: 'Could not understand the time. Please try formats like "9am", "2:30pm", or "14:30"'
          } as ApiResponse<null>, { status: 400 });
        }
      }
      
      // Create a modified event suggestion for the existing event
      const eventSuggestion: EventSuggestion = {
        title: rescheduleContext.originalEvent?.summary || '',
        date: newDate,
        time: newTime,
        location: rescheduleContext.originalEvent?.location || '',
        description: rescheduleContext.originalEvent?.description || '',
        duration: 60, // Default duration
        isConfirmed: false,
        rescheduleExisting: {
          originalEventId: rescheduleContext.conflictId,
          originalEvent: rescheduleContext.originalEvent
        }
      };

      // Check for conflicts with the new time
      const session = await getServerSession(authOptions);
      if (session?.accessToken) {
        try {
          const { start, end } = createEventDateTime(
            newDate,
            newTime,
            60
          );
          
          const conflicts = await checkConflicts(
            session.accessToken as string,
            start,
            end
          );

          if (conflicts && conflicts.length > 0) {
            eventSuggestion.conflicts = conflicts;
            const response: ChatResponse = {
              message: `I found a conflict with "${conflicts[0].summary}" at that time. Would you like to reschedule or keep your existing event?`,
              eventSuggestion,
              requiresConfirmation: true
            };
            return NextResponse.json({ success: true, data: response } as ApiResponse<ChatResponse>);
          }
        } catch (error) {
          console.error('Error checking conflicts for reschedule:', error);
        }
      }

      // No conflicts, proceed with reschedule
      const response: ChatResponse = {
        message: `Great! I can reschedule "${rescheduleContext.originalEvent?.summary}" to ${newTime}. Would you like me to update the event?`,
        eventSuggestion,
        requiresConfirmation: true
      };
      return NextResponse.json({ success: true, data: response } as ApiResponse<ChatResponse>);
    }

    // Parse the user input with Gemini
    let parsedEvent;
    try {
      parsedEvent = await parseEventWithGemini(message);
    } catch (error) {
      console.error('Error parsing event with Gemini:', error);
      return NextResponse.json({
        success: false,
        error: 'I\'m having trouble understanding that. Could you try rephrasing your request? For example: \'Dinner with Rachel at 7 PM tomorrow\' or \'Meeting on Friday at 2 PM\''
      } as ApiResponse<null>, { status: 400 });
    }
    
    // Create event suggestion
    const eventSuggestion: EventSuggestion = {
      title: parsedEvent.title,
      date: parsedEvent.date,
      time: parsedEvent.time,
      location: parsedEvent.location,
      description: parsedEvent.description,
      duration: parsedEvent.duration,
      isConfirmed: false
    };

    // Check for conflicts if user is authenticated
    const session = await getServerSession(authOptions);
    if (session?.accessToken) {
      try {
        const { start, end } = createEventDateTime(
          parsedEvent.date,
          parsedEvent.time,
          parsedEvent.duration || 60
        );
        
        const conflicts = await checkConflicts(
          session.accessToken as string,
          start,
          end
        );
        
        if (conflicts.length > 0) {
          // Add conflicts to the event suggestion
          eventSuggestion.conflicts = conflicts;
          
          // Generate a conflict-aware message
          const conflictMessage = `I found a conflict with "${conflicts[0].summary}" at that time. Would you like to reschedule or keep your existing event?`;
          
          const chatResponse: ChatResponse = {
            message: conflictMessage,
            eventSuggestion,
            requiresConfirmation: true
          };

          return NextResponse.json(
            { success: true, data: chatResponse } as ApiResponse<ChatResponse>,
            { status: 200 }
          );
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
        // Continue with normal flow if conflict check fails
      }
    }

    // Generate confirmation message for non-conflicting events
    const confirmationMessage = await generateConfirmationMessage(parsedEvent);

    // Create chat response
    const chatResponse: ChatResponse = {
      message: confirmationMessage,
      eventSuggestion,
      requiresConfirmation: parsedEvent.confidence > 0.7 // Only require confirmation for high-confidence parses
    };

    return NextResponse.json(
      { success: true, data: chatResponse } as ApiResponse<ChatResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return a fallback response
    const fallbackResponse: ChatResponse = {
      message: "I'm having trouble understanding that. Could you try rephrasing your request? For example: 'Dinner with Rachel at 7 PM tomorrow' or 'Meeting on Friday at 2 PM'",
      requiresConfirmation: false
    };

    return NextResponse.json(
      { success: true, data: fallbackResponse } as ApiResponse<ChatResponse>,
      { status: 200 }
    );
  }
}