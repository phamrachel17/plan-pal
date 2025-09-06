'use client';

import ChatUI from '@/components/chat/ChatUI';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import { EventSuggestion } from '@/lib/types';

export default function Home() {
  const handleEventConfirm = (event: EventSuggestion) => {
    console.log('Event confirmed:', event);
    // Event is now scheduled to Google Calendar via the API
  };

  const handleQuickAdd = () => {
    console.log('Quick add clicked');
    // TODO: Open quick add modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Pal
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Your AI-powered planning assistant powered by Gemini
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
      </div>
    </div>
  );
}