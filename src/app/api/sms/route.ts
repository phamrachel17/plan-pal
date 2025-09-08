import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SmsReminderRequest {
  eventId: string;
  eventTitle: string;
  eventTime: string;
  eventDate: string;
  phoneNumber: string;
  reminderMinutes?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { eventId, eventTitle, eventTime, eventDate, phoneNumber, reminderMinutes = 30 }: SmsReminderRequest = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Calculate reminder time
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    const reminderTime = new Date(eventDateTime.getTime() - (reminderMinutes * 60 * 1000));
    
    // Format the reminder message
    const formattedDate = eventDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = eventDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const message = `🔔 Reminder: "${eventTitle}" is starting in ${reminderMinutes} minutes at ${formattedTime} on ${formattedDate}. Don't forget! - Plan Pal`;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      // For demo purposes, simulate SMS sending
      console.log(`📱 DEMO SMS: Would send to ${phoneNumber}:`);
      console.log(`"${message}"`);
      console.log(`⏰ Scheduled for: ${reminderTime.toLocaleString()}`);
      
      return NextResponse.json(
        { success: true, data: { 
          message: 'SMS reminder scheduled successfully (Demo Mode)',
          reminderTime: reminderTime.toISOString(),
          eventTitle,
          phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
          note: 'Demo mode: SMS would be sent 30 minutes before event. Configure Twilio for real SMS.',
          demoMessage: message
        }},
        { status: 200 }
      );
    }

    // Schedule the SMS reminder (COMMENTED OUT FOR NOW)
    // const scheduledSms = await scheduleSmsReminder({
    //   to: phoneNumber,
    //   message,
    //   sendAt: reminderTime,
    //   eventId
    // });

    // For demo purposes, just log the SMS details
    console.log(`📱 DEMO SMS: Would send to ${phoneNumber}:`);
    console.log(`"${message}"`);
    console.log(`⏰ Scheduled for: ${reminderTime.toLocaleString()}`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'SMS reminder scheduled successfully (Demo Mode)',
        reminderTime: reminderTime.toISOString(),
        eventTitle,
        phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'), // Format for display
        note: 'Demo mode: SMS would be sent 30 minutes before event. Twilio logic commented out.',
        demoMessage: message
      }
    });

  } catch (error) {
    console.error('Error scheduling SMS reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule SMS reminder' },
      { status: 500 }
    );
  }
}

async function scheduleSmsReminder({
  to,
  message,
  sendAt,
  eventId
}: {
  to: string;
  message: string;
  sendAt: Date;
  eventId: string;
}) {
  try {
    const twilio = (await import('twilio')).default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Check if the reminder time is in the future
    const now = new Date();
    if (sendAt <= now) {
      throw new Error('Reminder time must be in the future');
    }

    // Calculate delay in milliseconds
    const delayMs = sendAt.getTime() - now.getTime();
    
    // For demo purposes, we'll send immediately with a note about the scheduled time
    // In production, you'd use a proper job queue like Bull, Agenda, or Twilio's TaskRouter
    const immediateMessage = `${message}\n\n⏰ This reminder was scheduled for ${sendAt.toLocaleString()}`;
    
    const messageResult = await twilio.messages.create({
      body: immediateMessage,
      from: TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`SMS reminder sent immediately (was scheduled for ${sendAt.toISOString()}):`, messageResult.sid);
    
    // Optional: Set up a simple timeout for demo purposes (not recommended for production)
    // setTimeout(() => {
    //   console.log(`Would send reminder now for event ${eventId}`);
    // }, delayMs);
    
    return {
      messageSid: messageResult.sid,
      scheduledTime: sendAt.toISOString(),
      status: 'sent_immediately',
      note: 'For demo purposes, sent immediately. In production, this would be scheduled.'
    };

  } catch (error) {
    console.error('Twilio error:', error);
    throw error;
  }
}

// GET endpoint to check reminder status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd query your database for scheduled reminders
    // For now, we'll return a mock response
    return NextResponse.json({
      success: true,
      data: {
        eventId,
        reminders: [
          {
            id: 'reminder_1',
            scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            status: 'scheduled',
            phoneNumber: '+1234567890'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching reminder status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminder status' },
      { status: 500 }
    );
  }
}
