import type { ChatMessage, EventSuggestion, CalendarEvent } from "@/lib/types";

export const declineNewEvent = (messageId: string, setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void) => {
  const msg: ChatMessage = {
    id: Date.now().toString(),
    role: "assistant",
    content: "Okay, I kept your existing event and did not schedule the new one.",
    timestamp: new Date(),
  };
  setMessages((prev: ChatMessage[]) => [...prev, msg]);
};

export const rescheduleNewEvent = async (
  eventData: EventSuggestion,
  messageId: string,
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void
) => {
  try {
    // For rescheduling new events, we need to create a special message
    // that indicates we're waiting for a new time to reschedule the new event
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `To reschedule "${eventData.title}", what time would work better for you? You can choose from the suggested slots below or tell me your own time.`,
      timestamp: new Date(),
      eventData: {
        ...eventData,
        conflicts: undefined // Clear conflicts since we're showing alternatives
      },
      // Add metadata to indicate we're waiting for a reschedule time for the NEW event
      rescheduleContext: {
        type: 'new',
        originalEvent: eventData
      }
    };
    
    // Try to get suggested slots
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventData }),
    });
    
    if (response.status === 409) {
      const data = await response.json();
      msg.eventData = {
        ...msg.eventData,
        suggestedSlots: data.data.suggestedSlots
      } as EventSuggestion;
    }
    
    setMessages((prev: ChatMessage[]) => [...prev, msg]);
  } catch (error) {
    console.error('Error handling reschedule new:', error);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I couldn't help with rescheduling the new event. Please try again.",
      timestamp: new Date(),
    };
    setMessages((prev: ChatMessage[]) => [...prev, msg]);
  }
};

export const rescheduleExistingEvent = async (
  conflict: CalendarEvent,
  messageId: string,
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void
) => {
  try {
    // For rescheduling existing events, we need to create a special message
    // that indicates we're waiting for a new time to reschedule the existing event
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `To reschedule "${conflict.summary}", I can help you find alternative times. What time would work better for you?`,
      timestamp: new Date(),
      // Add metadata to indicate we're waiting for a reschedule time
      rescheduleContext: {
        type: 'existing',
        conflictId: conflict.id,
        originalEvent: conflict
      }
    };
    setMessages((prev: ChatMessage[]) => [...prev, msg]);
  } catch (error) {
    console.error('Error handling reschedule existing:', error);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I couldn't help with rescheduling the existing event. Please try manually editing it in your calendar.",
      timestamp: new Date(),
    };
    setMessages((prev: ChatMessage[]) => [...prev, msg]);
  }
};

