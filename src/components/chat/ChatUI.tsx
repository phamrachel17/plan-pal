'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, EventSuggestion } from '@/lib/types';
import { Send, Plus, Calendar, Clock, MapPin, Check, X, AlertTriangle } from 'lucide-react';

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue.trim() }),
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
        
        const confirmationMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Great! I've scheduled "${eventData.title}" for ${formatDate(eventData.date)} at ${formatTime(eventData.time)}.`,
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
  

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onQuickAdd}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">👋 Hi! I'm your AI scheduling assistant.</p>
            <p className="text-sm">Try saying something like:</p>
            <p className="text-sm italic">"Dinner with Rachel at 7 PM tomorrow"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Event Suggestion Card */}
              {message.eventData && !message.eventData.isConfirmed && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200 text-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{message.eventData.title}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span>{formatDate(message.eventData.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span>{formatTime(message.eventData.time)}</span>
                    </div>
                    
                    {message.eventData.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span>{message.eventData.location}</span>
                      </div>
                    )}
                    
                    {message.eventData.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {message.eventData.description}
                      </p>
                    )}
                  </div>

                  {/* Conflicts Display */}
                  {message.eventData.conflicts && message.eventData.conflicts.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">Conflicts:</span>
                      </div>
                      {message.eventData.conflicts.map((conflict: any, index: number) => (
                        <div key={index} className="text-xs text-red-600">
                          • {conflict.summary} at {formatTime(conflict.start.dateTime?.split('T')[1]?.substring(0, 5) || '')}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alternative Slots */}
                  {message.eventData.suggestedSlots && message.eventData.suggestedSlots.length > 0 && (
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-2">Available times:</div>
                      <div className="flex flex-wrap gap-1">
                        {message.eventData.suggestedSlots.slice(0, 6).map((slot: string, index: number) => {
                          const time = new Date(slot);
                          const timeString = time.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          });
                          return (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={() => {
                                const updatedEvent: EventSuggestion = {
                                  title: message.eventData!.title,
                                  date: message.eventData!.date,
                                  time: time.toTimeString().substring(0, 5),
                                  location: message.eventData!.location,
                                  description: message.eventData!.description,
                                  duration: message.eventData!.duration,
                                  isConfirmed: false
                                };
                                confirmEvent(updatedEvent, message.id);
                              }}
                            >
                              {timeString}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => confirmEvent(message.eventData!, message.id)}
                      disabled={schedulingIds[message.id]}
                      className="text-xs flex items-center gap-1"
                    >
                      {schedulingIds[message.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Confirm
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const declineMessage: ChatMessage = {
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: 'No problem! How would you like to modify this event?',
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, declineMessage]);
                      }}
                      className="text-xs flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Modify
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (e.g., 'Dinner with Rachel at 7 PM tomorrow')"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
