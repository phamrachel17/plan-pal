'use client';

import { useEffect, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { parseISO, format } from "date-fns";
import moment from "moment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react"; // ✅ modern icons

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function CalendarModal() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data: CalendarEvent[]) => {
        const formatted = data.map(event => {
          let start, end;

          if (event.start.dateTime) {
            start = parseISO(event.start.dateTime);
            end = parseISO(event.end.dateTime!);
          } else {
            start = parseISO(event.start.date!);
            end = parseISO(event.end.date!);
          }

          return {
            id: event.id,
            title: event.summary || "(No title)",
            description: event.description || "",
            location: event.location || "",
            start,
            end,
            allDay: !event.start.dateTime,
          };
        });

        setEvents(formatted);
      })
      .catch(err => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading events...</p>;

  const handleNavigate = (action: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (action === "prev") newDate.setMonth(prev.getMonth() - 1);
      if (action === "next") newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {/* Modern Navbar */}
        <div className="flex items-center justify-between p-3 border-b mb-2 bg-gray-50 rounded-md shadow-sm flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200"
            onClick={() => handleNavigate("prev")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold tracking-wide">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200"
            onClick={() => handleNavigate("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar */}
        <div className="flex-1 w-full">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["month"]}
            date={currentDate}
            onNavigate={date => setCurrentDate(date)}
            defaultView={Views.MONTH}
            toolbar={false}
            popup
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            onSelectEvent={(event: any) => setSelectedEvent(event)}
            onShowMore={(dayEvents, date) => {
              // open a modal listing all events for that day
              setSelectedEvent({
                title: `${dayEvents.length} events on ${format(date, "MMMM d, yyyy")}`,
                description: dayEvents.map((e: any) => {
                  const timeStr = e.allDay ? "All day" : `${format(e.start, "h:mm a")} - ${format(e.end, "h:mm a")}`;
                  const locationStr = e.location ? ` (${e.location})` : "";
                  return `${e.title} - ${timeStr}${locationStr}`;
                }).join("\n"),
                start: date,
                allDay: true,
                isMultipleEvents: true,
                events: dayEvents
              });
            }}
          />
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md w-full p-0">
          {selectedEvent && (
            <>
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  {format(selectedEvent.start, "EEEE, MMMM d, yyyy")}
                  {!selectedEvent.allDay && (
                    <span className="block mt-1">
                      {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                    </span>
                  )}
                  {selectedEvent.allDay && (
                    <span className="block mt-1 text-sm text-gray-500">All day</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="px-6 pb-6 space-y-4">
                {selectedEvent.isMultipleEvents ? (
                  <div className="space-y-3">
                    {selectedEvent.events.map((event: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.allDay ? "All day" : `${format(event.start, "h:mm a")} - ${format(event.end, "h:mm a")}`}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {selectedEvent.location && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.description && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Description</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {!selectedEvent.location && !selectedEvent.description && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No additional details available</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
