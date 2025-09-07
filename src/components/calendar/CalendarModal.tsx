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
    <div className="h-[70vh] w-full flex flex-col">
      {/* Modern Navbar */}
      <div className="flex items-center justify-between p-3 border-b mb-2 bg-gray-50 rounded-md shadow-sm">
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
      <div className="flex-1">
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
        style={{ height: "100%", borderRadius: "0.5rem" }}
        onSelectEvent={(event: any) => setSelectedEvent(event)}
        onShowMore={(dayEvents, date) => {
            // open a modal listing all events for that day
            setSelectedEvent({
            title: `${dayEvents.length} events on ${format(date, "MMMM d, yyyy")}`,
            description: dayEvents.map((e: any) => e.title).join(", "),
            start: date,
            allDay: true
            });
        }}
        />

      </div>

        {/* Event Details Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="!max-w-[1600px] !w-[95vw] !h-[90vh] p-0">
            {selectedEvent && (
            <>
                <DialogHeader className="p-4 border-b">
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                    {format(selectedEvent.start, "EEEE, MMMM d, yyyy")}{" "}
                    {!selectedEvent.allDay && ` at ${format(selectedEvent.start, "h:mm a")}`}
                </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                {selectedEvent.description && (
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                )}
                </div>
            </>
            )}
        </DialogContent>
        </Dialog>


    </div>
  );
}
