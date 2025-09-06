import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiEventParse } from '@/lib/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Parse user input into structured event data using Gemini
 * @param userInput - Natural language input from user
 * @returns Parsed event data with confidence score
 */
export async function parseEventWithGemini(userInput: string): Promise<GeminiEventParse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an AI assistant that helps users schedule events. Parse the following user input into structured event data.

User input: "${userInput}"

Extract the following information and return ONLY a valid JSON object with these exact fields:
- title: string (event title)
- date: string (ISO date format YYYY-MM-DD, use current date if not specified)
- time: string (24-hour format HH:MM, use reasonable default if not specified)
- location: string (optional, if mentioned)
- description: string (optional, additional details)
- duration: number (optional, duration in minutes, default 60)
- confidence: number (0-1 confidence score for the parsing)

Rules:
1. If date is not specified, use today's date
2. If time is not specified, suggest a reasonable time (e.g., 7:00 PM becomes "19:00")
3. For relative dates, calculate the actual date:
   - "tomorrow" = current date + 1 day
   - "next week" = current date + 7 days
   - "next Monday" = find the next Monday
4. For specific dates, use the current year unless specified otherwise
5. Always return dates in YYYY-MM-DD format
6. Always return times in HH:MM format (24-hour)
7. Be conservative with confidence scores
8. Return ONLY the JSON object, no markdown formatting, no additional text
9. The time zone is Eastern (UTC-4)


IMPORTANT DATE CALCULATIONS:
- Today is: ${new Date().toISOString().split('T')[0]}
- Tomorrow is: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- When user says "tomorrow", use: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
`;

    const generateResult = await model.generateContent(prompt);
    const response = await generateResult.response;
    const text = response.text();

    // Parse the JSON response - handle markdown code blocks
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsedData = JSON.parse(jsonText);
    
    console.log('Gemini parsed data:', parsedData);
    
    const parsedResult = {
      title: parsedData.title || 'Untitled Event',
      date: parsedData.date,
      time: parsedData.time || '19:00',
      location: parsedData.location,
      description: parsedData.description,
      duration: parsedData.duration || 60,
      confidence: parsedData.confidence || 0.5
    };
    
    console.log('Final parsed result:', parsedResult);
    
    return parsedResult;
  } catch (error) {
    console.error('Error parsing event with Gemini:', error);
    throw new Error('Failed to parse event data');
  }
}

/**
 * Generate a friendly confirmation message for the user
 * @param eventData - Parsed event data
 * @returns User-friendly confirmation message
 */
export async function generateConfirmationMessage(eventData: GeminiEventParse): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('Event data:', eventData);

    const prompt = `
                    Generate a friendly, conversational confirmation message for this event:

                    Title: ${eventData.title}
                    Date: ${eventData.date}
                    Time: ${eventData.time}
                    Location: ${eventData.location || 'Not specified'}
                    Duration: ${eventData.duration} minutes

                    Write a short, friendly message (1-2 sentences) asking the user to confirm this event. Be conversational and helpful.
                    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating confirmation message:', error);
    return `I'd like to schedule "${eventData.title}" on ${eventData.date} at ${eventData.time}. Does this look correct?`;
  }
}
