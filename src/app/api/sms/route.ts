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

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

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

    // Schedule the SMS reminder
    const scheduledSms = await scheduleSmsReminder({
      to: phoneNumber,
      message,
      sendAt: reminderTime,
      eventId
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'SMS reminder scheduled successfully',
        reminderTime: reminderTime.toISOString(),
        eventTitle,
        phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') // Format for display
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
    // For now, we'll use Twilio's Messaging API
    // In production, you might want to use Twilio's TaskRouter or a job queue
    const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Check if the reminder time is in the future
    const now = new Date();
    if (sendAt <= now) {
      throw new Error('Reminder time must be in the future');
    }

    // Schedule the message
    const scheduledMessage = await twilio.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to,
      scheduleType: 'fixed',
      sendAt: sendAt.toISOString()
    });

    console.log(`SMS reminder scheduled for ${sendAt.toISOString()}:`, scheduledMessage.sid);
    
    return {
      messageSid: scheduledMessage.sid,
      scheduledTime: sendAt.toISOString(),
      status: 'scheduled'
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
