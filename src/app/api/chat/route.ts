import { NextRequest, NextResponse } from 'next/server';
import { parseEventWithGemini, generateConfirmationMessage } from '@/lib/api/gemini';
import { ChatResponse, ApiResponse, EventSuggestion } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    console.log('Chat API received message:', message);

    // Parse the user input with Gemini
    const parsedEvent = await parseEventWithGemini(message);
    
    // Generate confirmation message
    const confirmationMessage = await generateConfirmationMessage(parsedEvent);

    // Create event suggestion
    const eventSuggestion: EventSuggestion = {
      title: parsedEvent.title,
      date: parsedEvent.date,
      time: parsedEvent.time,
      location: parsedEvent.location,
      description: parsedEvent.description,
      duration: parsedEvent.duration,
      isConfirmed: false
    };

    // Create chat response
    const chatResponse: ChatResponse = {
      message: confirmationMessage,
      eventSuggestion,
      requiresConfirmation: parsedEvent.confidence > 0.7 // Only require confirmation for high-confidence parses
    };

    return NextResponse.json(
      { success: true, data: chatResponse } as ApiResponse<ChatResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return a fallback response
    const fallbackResponse: ChatResponse = {
      message: "I'm having trouble understanding that. Could you try rephrasing your request? For example: 'Dinner with Rachel at 7 PM tomorrow' or 'Meeting on Friday at 2 PM'",
      requiresConfirmation: false
    };

    return NextResponse.json(
      { success: true, data: fallbackResponse } as ApiResponse<ChatResponse>,
      { status: 200 }
    );
  }
}