# Plan Pal - AI-Powered Schedule Management

A conversational web application that helps users manage their schedules using Google's Gemini AI.

## Features

- **Chat Interface**: Natural language conversation with AI assistant
- **Event Parsing**: AI automatically extracts event details from natural language
- **Event Confirmation**: Interactive confirmation flow for scheduled events
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI**: Google Gemini API
- **Calendar**: Google Calendar API (planned)
- **SMS**: Twilio API (planned)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Google Calendar API Configuration (for future use)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Twilio SMS Configuration (for future use)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Start a conversation**: Type natural language messages like:
   - "Dinner with Rachel at 7 PM tomorrow"
   - "Meeting on Friday at 2 PM"
   - "Coffee with John next Tuesday at 10 AM"

2. **Review AI suggestions**: The AI will parse your message and show a structured event card

3. **Confirm or modify**: Click "Confirm" to accept or "Modify" to change the event

4. **Quick Add**: Use the "+" button for manual event entry (coming soon)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/          # Chat API endpoints
│   └── page.tsx           # Main page
├── components/
│   ├── chat/              # Chat UI components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api/               # API utilities (Gemini, Google Calendar)
│   ├── types/             # TypeScript type definitions
│   └── utils.ts           # Utility functions
```

## API Endpoints

### POST /api/chat

Processes user messages and returns AI responses with event suggestions.

**Request:**
```json
{
  "message": "Dinner with Rachel at 7 PM tomorrow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "I'd like to schedule \"Dinner with Rachel\" on 2024-01-15 at 19:00. Does this look correct?",
    "eventSuggestion": {
      "title": "Dinner with Rachel",
      "date": "2024-01-15",
      "time": "19:00",
      "location": null,
      "description": null,
      "duration": 60,
      "isConfirmed": false
    },
    "requiresConfirmation": true
  }
}
```
## License

MIT License - see LICENSE file for details
