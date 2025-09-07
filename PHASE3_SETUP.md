# Plan Pal - Phase 3 Setup Guide

## ✅ **Phase 3 Features Implemented:**

### **1. Google OAuth Authentication**
- **NextAuth.js integration** with Google provider
- **Calendar scope permissions** for reading/writing events
- **Session management** with access token storage

### **2. Event Scheduling Flow**
- **Confirmation step** with ✅ Approve and ❌ Decline buttons
- **Event summary display** showing title, date, and time
- **Real-time scheduling** to Google Calendar

### **3. Conflict Detection**
- **Automatic conflict checking** before scheduling
- **Alternative time suggestions** when conflicts are found
- **Visual conflict indicators** with red warning boxes

### **4. Enhanced Chat UI**
- **Loading states** during scheduling
- **Success/error feedback** with emojis
- **Alternative time slots** as clickable buttons
- **Authentication prompts** for non-signed-in users

## 🔧 **Setup Instructions:**

### **1. Google Cloud Console Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Enable "Google Calendar API"
   - Enable "Google+ API" (for OAuth)

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

5. **Copy your credentials**:
   - Client ID
   - Client Secret

### **2. Update Environment Variables**

Update your `.env.local` file with the real credentials:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here

# Other APIs (for future use)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
DATABASE_URL=your_database_url_here
```

### **3. Generate NextAuth Secret**

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use any random string generator.

### **4. Restart Development Server**

```bash
npm run dev
```

## 🚀 **How to Test:**

### **1. Sign In**
- Click "Sign in with Google" button
- Complete OAuth flow
- Grant calendar permissions

### **2. Test Event Scheduling**
Try these natural language inputs:
- "Dinner with Rachel at 7 PM tomorrow"
- "Meeting on Friday at 2 PM"
- "Coffee with John next Tuesday at 10 AM"

### **3. Test Conflict Detection**
- Schedule an event for a time when you already have something
- The AI will show conflicts and suggest alternative times
- Click on alternative time slots to reschedule

### **4. Test Confirmation Flow**
- Review the event summary
- Click ✅ "Confirm" to schedule
- Click ❌ "Modify" to change details

## 🎯 **Key Features Working:**

- ✅ **Google OAuth authentication** with calendar permissions
- ✅ **Natural language event parsing** with Gemini AI
- ✅ **Real-time conflict detection** against Google Calendar
- ✅ **Alternative time suggestions** when conflicts occur
- ✅ **One-click event scheduling** to Google Calendar
- ✅ **Visual feedback** with loading states and success messages
- ✅ **Responsive UI** with modern design

## 🔄 **User Flow:**

1. **Sign in** with Google (grants calendar access)
2. **Chat naturally** about scheduling events
3. **Review AI suggestions** with event details
4. **Handle conflicts** by choosing alternative times
5. **Confirm events** to schedule them instantly
6. **Events appear** in Google Calendar immediately

## 🛠 **API Endpoints:**

- `POST /api/chat` - Process natural language and suggest events
- `POST /api/schedule` - Schedule events to Google Calendar
- `GET/POST /api/auth/[...nextauth]` - Handle OAuth authentication

## 📱 **Next Steps:**

- [ ] SMS reminders with Twilio
- [ ] Calendar view component
- [ ] Event editing and deletion
- [ ] Recurring events support
- [ ] Team scheduling features

The application now has full Google Calendar integration with intelligent conflict detection and user-friendly confirmation flows!
