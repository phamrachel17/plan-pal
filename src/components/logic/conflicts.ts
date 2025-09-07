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
    // Try to schedule the event again to get suggested slots
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventData }),
    });
    
    if (response.status === 409) {
      const data = await response.json();
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are some available time slots for your event:",
        timestamp: new Date(),
        eventData: {
          ...eventData,
          suggestedSlots: data.data.suggestedSlots,
          conflicts: undefined // Clear conflicts since we're showing alternatives
        },
      };
      setMessages((prev: ChatMessage[]) => [...prev, msg]);
    } else {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I couldn't find alternative time slots. Please try a different time.",
        timestamp: new Date(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, msg]);
    }
  } catch (error) {
    console.error('Error getting suggested slots:', error);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I couldn't find alternative time slots. Please try again.",
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

