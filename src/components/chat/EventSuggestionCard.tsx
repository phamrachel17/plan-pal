import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Calendar, Clock, MapPin } from "lucide-react";
import type { ChatMessage, EventSuggestion, CalendarEvent } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/utils/dateUtils";

type Props = {
  message: ChatMessage;
  confirmEvent: (event: EventSuggestion, id: string) => void;
  declineNewEvent: (id: string) => void;
  rescheduleNewEvent: (event: EventSuggestion, id: string) => void;
  rescheduleExistingEvent: (conflict: CalendarEvent, id: string) => void;
  schedulingIds: Record<string, boolean>;
};

export default function EventCard({
  message,
  confirmEvent,
  declineNewEvent,
  rescheduleNewEvent,
  rescheduleExistingEvent,
  schedulingIds,
}: Props) {
  const { eventData } = message;

  if (!eventData) return null;

  const handleTimeSlotSelect = (selectedTime: string) => {
    // Convert 12-hour format back to 24-hour format for the API
    const [time, period] = selectedTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const time24 = `${hour24.toString().padStart(2, '0')}:${minutes}`;
    
    // Create updated event data with the selected time
    const updatedEventData = {
      ...eventData,
      time: time24,
      suggestedSlots: undefined // Clear suggested slots since user made a selection
    };
    
    // Confirm the event with the new time
    confirmEvent(updatedEventData, message.id);
  };

  return (
    <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-gray-800">
      {/* Event Details */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-900">{eventData.title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(eventData.date)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formatTime(eventData.time)}</span>
          {eventData.duration && (
            <span className="text-xs text-gray-500">({eventData.duration} min)</span>
          )}
        </div>
        
        {eventData.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{eventData.location}</span>
          </div>
        )}
        
        {eventData.description && (
          <div className="text-sm text-gray-600 mt-2">
            <p>{eventData.description}</p>
          </div>
        )}
      </div>

      {/* Conflicts */}
      {eventData.conflicts && eventData.conflicts.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Conflicts:</span>
          </div>
          {eventData.conflicts.map((conflict: CalendarEvent, idx: number) => (
            <div key={idx} className="text-xs text-red-600">
              • {conflict.summary} at {conflict.start.dateTime ? formatTime(conflict.start.dateTime.split('T')[1].split(':').slice(0, 2).join(':')) : 'Unknown time'}
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => declineNewEvent(message.id)}>
              Keep Existing
            </Button>
            <Button size="sm" variant="outline" onClick={() => rescheduleNewEvent(eventData, message.id)}>
              Reschedule New
            </Button>
            <Button size="sm" variant="outline" onClick={() => eventData.conflicts?.[0] && rescheduleExistingEvent(eventData.conflicts[0], message.id)}>
              Reschedule Existing
            </Button>
          </div>
        </div>
      )}

      {/* Suggested Slots - Only show when specifically requested */}
      {eventData.suggestedSlots && eventData.suggestedSlots.length > 0 && !eventData.conflicts && (
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Suggested Time Slots:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {eventData.suggestedSlots.map((slot: string, idx: number) => (
              <Button
                key={idx}
                size="sm"
                variant="outline"
                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={() => handleTimeSlotSelect(slot)}
              >
                {slot}
              </Button>
            ))}
          </div>
          <div className="text-xs text-blue-600">
            Or ask me to schedule at a different time!
          </div>
        </div>
      )}

      {/* Confirm/Modify buttons */}
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => confirmEvent(eventData, message.id)}
          disabled={schedulingIds[message.id]}
        >
          {schedulingIds[message.id] ? "Scheduling..." : "Confirm"}
        </Button>
        <Button size="sm" variant="outline">
          <X className="h-3 w-3" /> Modify
        </Button>
      </div>
    </div>
  );
}
