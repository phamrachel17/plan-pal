'use client';

import { useState } from 'react';
import ChatUI from '@/components/chat/ChatUI';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import QuickAddModal from '@/components/chat/QuickAddModal';
import { EventSuggestion } from '@/lib/types';

export default function Home() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleEventConfirm = (event: EventSuggestion) => {
    console.log('Event confirmed:', event);
    // Event is now scheduled to Google Calendar via the API
  };

  const handleQuickAdd = () => {
    setShowQuickAdd(true);
  };

  const handleEventCreated = (event: EventSuggestion) => {
    console.log('Quick add event created:', event);
    // Event is now scheduled to Google Calendar via the API
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Pal
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Your AI-powered planning assistant for seamless event scheduling
          </p>
          <div className="flex justify-center">
            <GoogleSignIn />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="h-[600px]">
            <ChatUI 
              onEventConfirm={handleEventConfirm}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        </div>

        {/* Quick Add Modal */}
        <QuickAddModal
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          onEventCreated={handleEventCreated}
        />
      </div>
    </div>
  );
}