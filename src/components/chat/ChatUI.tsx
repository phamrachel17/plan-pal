'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent,  DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatMessage, EventSuggestion } from '@/lib/types';
import CalendarModal from '../calendar/CalendarModal';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import CalendarDialog from '../calendar/CalendarDialog';
import ChatMessages from './ChatMessages';
import PhoneNumberModal from '../PhoneNumberModal';
import { declineNewEvent, rescheduleNewEvent, rescheduleExistingEvent } from '../logic/conflicts';

interface ChatUIProps {
  onEventConfirm?: (event: EventSuggestion) => void;
  onQuickAdd?: () => void;
}

export default function ChatUI({ onEventConfirm, onQuickAdd }: ChatUIProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schedulingIds, setSchedulingIds] = useState<Record<string, boolean>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>('');
  const [pendingEventForSms, setPendingEventForSms] = useState<EventSuggestion | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Check if the previous message has reschedule context
    const lastMessage = messages[messages.length - 1];
    const rescheduleContext = lastMessage?.rescheduleContext;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue.trim(),
          rescheduleContext: rescheduleContext
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          eventData: data.data.eventSuggestion
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const confirmEvent = async (eventData: EventSuggestion, messageId: string) => {
    if (!session) {
      const authMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please sign in with Google to schedule events to your calendar.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authMessage]);
      return;
    }

    setSchedulingIds(prev => ({ ...prev, [messageId]: true }));

    try {
      // Check if this is a reschedule existing event
      if (eventData.rescheduleExisting) {
        const response = await fetch('/api/update-event', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            eventId: eventData.rescheduleExisting.originalEventId,
            eventData 
          }),
        });

        const data = await response.json();

        if (data.success) {
          const confirmationMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Great! I've rescheduled "${eventData.title}" to ${formatDate(eventData.date)} at ${formatTime(eventData.time)}.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        } else {
          throw new Error(data.error || 'Failed to update event');
        }
      } else {
        // Regular new event creation
        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventData }),
        });

        const data = await response.json();

        if (data.success) {
          const confirmedEvent = { ...eventData, isConfirmed: true };
          onEventConfirm?.(confirmedEvent);
          
          // Check if user has phone number for SMS reminders
          if (!userPhoneNumber) {
            setPendingEventForSms(eventData);
            setShowPhoneModal(true);
          } else {
            // Schedule SMS reminder
            await scheduleSmsReminder(eventData);
          }
          
          const confirmationMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ Great! I've scheduled "${eventData.title}" for ${formatDate(eventData.date)} at ${formatTime(eventData.time)}.${userPhoneNumber ? ' 📱 SMS reminder scheduled!' : ''}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        } else if (response.status === 409) {
          // Handle conflicts
          const conflictMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⚠️ I found a conflict at that time. Here are some alternative slots:`,
            timestamp: new Date(),
            eventData: {
              ...eventData,
              conflicts: data.data.conflicts,
              suggestedSlots: data.data.suggestedSlots
            }
          };
          setMessages(prev => [...prev, conflictMessage]);
        } else {
          throw new Error(data.error || 'Failed to schedule event');
        }
      }
    } catch (error) {
      console.error('Error scheduling event:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error scheduling your event. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSchedulingIds(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const scheduleSmsReminder = async (eventData: EventSuggestion) => {
    if (!userPhoneNumber) return;

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Date.now().toString(), // In production, use actual event ID from calendar
          eventTitle: eventData.title,
          eventTime: eventData.time,
          eventDate: eventData.date,
          phoneNumber: userPhoneNumber,
          reminderMinutes: 30
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('SMS reminder scheduled:', data.data);
      } else {
        console.error('Failed to schedule SMS reminder:', data.error);
      }
    } catch (error) {
      console.error('Error scheduling SMS reminder:', error);
    }
  };

  const handlePhoneNumberSaved = async (phoneNumber: string) => {
    setUserPhoneNumber(phoneNumber);
    
    // If there's a pending event, schedule SMS reminder for it
    if (pendingEventForSms) {
      await scheduleSmsReminder(pendingEventForSms);
      setPendingEventForSms(null);
      
      // Update the confirmation message to include SMS info
      const smsMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📱 SMS reminder scheduled for "${pendingEventForSms.title}"! You'll get a text 30 minutes before the event.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, smsMessage]);
    }
  };
  

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <ChatHeader
        onQuickAdd={onQuickAdd || (() => {})}
        onShowCalendar={() => setShowCalendar(true)}
      />

      <CalendarDialog
        open={showCalendar}
        onOpenChange={setShowCalendar}
      />

      {/* Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-7xl h-[90vh] w-[95vw]">
          <DialogHeader>
            <DialogTitle>My Google Calendar</DialogTitle>
          </DialogHeader>
          <CalendarModal />
        </DialogContent>
      </Dialog>


      {/* Chat Messages Logic */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="pt-8">
            <div className="text-center text-gray-600">
              <p className="text-lg font-medium">👋 Welcome! I'm here to help you schedule events effortlessly ✨</p>
              <p className="text-sm mt-2">Try saying something like "Dinner at 7 PM tomorrow" or use the "Quick Add" button above!</p>
            </div>
          </div>
        )}
        
        <ChatMessages
          messages={messages}
          confirmEvent={confirmEvent}
          declineNewEvent={(id) => declineNewEvent(id, setMessages)}
          rescheduleNewEvent={(event, id) => rescheduleNewEvent(event, id, setMessages)}
          rescheduleExistingEvent={(conflict, id) => rescheduleExistingEvent(conflict, id, setMessages)}
          schedulingIds={schedulingIds}
          isLoading={isLoading}
          setMessages={setMessages}
        />
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />

      {/* Phone Number Modal for SMS Reminders */}
      <PhoneNumberModal
        open={showPhoneModal}
        onOpenChange={setShowPhoneModal}
        onPhoneNumberSaved={handlePhoneNumberSaved}
      />
      
    </div>
  );
}
