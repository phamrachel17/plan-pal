import EventSuggestionCard from "./EventSuggestionCard";
import type { ChatMessage, EventSuggestion, CalendarEvent } from "@/lib/types";

type Props = {
  messages: ChatMessage[];
  confirmEvent: (event: EventSuggestion, id: string) => void;
  declineNewEvent: (id: string) => void;
  rescheduleNewEvent: (event: EventSuggestion, id: string) => void;
  rescheduleExistingEvent: (conflict: CalendarEvent, id: string) => void;
  schedulingIds: Record<string, boolean>;
  isLoading: boolean;
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
};

export default function ChatMessages({
  messages,
  confirmEvent,
  declineNewEvent,
  rescheduleNewEvent,
  rescheduleExistingEvent,
  schedulingIds,
  isLoading,
}: Props) {
  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            <p className="text-sm">{message.content}</p>

            {message.eventData && !message.eventData.isConfirmed && (
              <EventSuggestionCard
                message={message}
                confirmEvent={confirmEvent}
                declineNewEvent={declineNewEvent}
                rescheduleNewEvent={rescheduleNewEvent}
                rescheduleExistingEvent={rescheduleExistingEvent}
                schedulingIds={schedulingIds}
              />
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600">Thinking...</span>
          </div>
        </div>
      )}
    </>
  );
}
