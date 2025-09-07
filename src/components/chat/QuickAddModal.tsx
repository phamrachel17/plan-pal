'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Check, X } from 'lucide-react';
import { EventSuggestion } from '@/lib/types';

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (event: EventSuggestion) => void;
}

export default function QuickAddModal({ open, onOpenChange, onEventCreated }: QuickAddModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    duration: 60
  });

  // Quick options
  const quickTimes = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  const quickDates = [
    { label: 'Today', value: getToday() },
    { label: 'Tomorrow', value: getTomorrow() },
    { label: 'This Weekend', value: getThisWeekend() },
    { label: 'Next Week', value: getNextWeek() }
  ];

  const quickTitles = [
    'Meeting', 'Lunch', 'Dinner', 'Workout', 'Call', 'Appointment',
    'Coffee', 'Breakfast', 'Study Session', 'Team Meeting', 'Doctor Visit', 'Personal Time'
  ];

  const quickLocations = [
    'Office', 'Home', 'Restaurant', 'Gym', 'Coffee Shop', 'Library',
    'Park', 'Mall', 'Hospital', 'School', 'Virtual Meeting', 'Outdoor'
  ];

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function getTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function getThisWeekend() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    return saturday.toISOString().split('T')[0];
  }

  function getNextWeek() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  const convertTo24Hour = (time12: string) => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleQuickSelect = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!session) {
      alert('Please sign in to create events');
      return;
    }

    if (!formData.title || !formData.date || !formData.time) {
      alert('Please fill in at least title, date, and time');
      return;
    }

    setIsLoading(true);

    try {
      const eventData: EventSuggestion = {
        title: formData.title,
        date: formData.date,
        time: convertTo24Hour(formData.time),
        location: formData.location || undefined,
        description: formData.description || undefined,
        duration: formData.duration,
        isConfirmed: false
      };

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventData }),
      });

      const data = await response.json();

      if (data.success) {
        onEventCreated?.(eventData);
        onOpenChange(false);
        resetForm();
        alert('Event created successfully!');
      } else if (response.status === 409) {
        // Handle conflicts
        alert('There\'s a conflict at that time. Please choose a different time.');
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Sorry, there was an error creating your event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      duration: 60
    });
    setStep(1);
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Add Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>

          {/* Step 1: Title */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What&apos;s the event?</h3>
              
              {/* Quick Title Options */}
              <div className="grid grid-cols-3 gap-2">
                {quickTitles.map((title) => (
                  <Button
                    key={title}
                    variant={formData.title === title ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect('title', title)}
                    className="text-sm"
                  >
                    {title}
                  </Button>
                ))}
              </div>

              {/* Custom Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Or enter custom title:</label>
                <Input
                  placeholder="Enter event title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">When?</h3>
              
              {/* Quick Date Options */}
              <div className="grid grid-cols-2 gap-3">
                {quickDates.map((date) => (
                  <Button
                    key={date.label}
                    variant={formData.date === date.value ? "default" : "outline"}
                    onClick={() => handleQuickSelect('date', date.value)}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    {date.label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Or pick a specific date:</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={getToday()}
                />
              </div>
            </div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What time?</h3>
              
              {/* Quick Time Options */}
              <div className="grid grid-cols-4 gap-2">
                {quickTimes.map((time) => (
                  <Button
                    key={time}
                    variant={formData.time === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect('time', time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>

              {/* Custom Time Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Or enter custom time:</label>
                
                {/* Show currently selected time */}
                {formData.time && (
                  <div className="text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded">
                    Selected: {formData.time}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={(() => {
                      // Convert 12-hour format back to 24-hour for the input
                      if (formData.time && formData.time.includes(' ')) {
                        const [timePart, ampm] = formData.time.split(' ');
                        const [hours, minutes] = timePart.split(':');
                        let hour24 = parseInt(hours);
                        
                        if (ampm === 'PM' && hour24 !== 12) {
                          hour24 += 12;
                        } else if (ampm === 'AM' && hour24 === 12) {
                          hour24 = 0;
                        }
                        
                        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const hour24 = parseInt(hours);
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const ampm = hour24 >= 12 ? 'PM' : 'AM';
                        const customTime = `${hour12}:${minutes} ${ampm}`;
                        setFormData(prev => ({ ...prev, time: customTime }));
                      }
                    }}
                    className="flex-1"
                    placeholder="Select time"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
                      if (timeInput && timeInput.value) {
                        const [hours, minutes] = timeInput.value.split(':');
                        const hour24 = parseInt(hours);
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        const ampm = hour24 >= 12 ? 'PM' : 'AM';
                        const customTime = `${hour12}:${minutes} ${ampm}`;
                        setFormData(prev => ({ ...prev, time: customTime }));
                      }
                    }}
                  >
                    Set Time
                  </Button>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration (minutes):</label>
                <div className="flex gap-2 mb-2">
                  {[30, 60, 90, 120].map((duration) => (
                    <Button
                      key={duration}
                      variant={formData.duration === duration ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, duration }))}
                    >
                      {duration}m
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Custom duration"
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration && ![30, 60, 90, 120].includes(formData.duration) ? formData.duration : ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value && value >= 15 && value <= 480) {
                        setFormData(prev => ({ ...prev, duration: value }));
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const durationInput = document.querySelector('input[type="number"]') as HTMLInputElement;
                      if (durationInput && durationInput.value) {
                        const value = parseInt(durationInput.value);
                        if (value >= 15 && value <= 480) {
                          setFormData(prev => ({ ...prev, duration: value }));
                        }
                      }
                    }}
                  >
                    Set Duration
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Location & Description */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Where & Details</h3>
              
              {/* Quick Location Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location:</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickLocations.map((location) => (
                    <Button
                      key={location}
                      variant={formData.location === location ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickSelect('location', location)}
                      className="text-sm"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Or enter custom location..."
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description (optional):</label>
                <Textarea
                  placeholder="Add any additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Event Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Event Summary:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                  <div><strong>Date:</strong> {formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString() : 'Not set'}</div>
                  <div><strong>Time:</strong> {formData.time || 'Not set'}</div>
                  <div><strong>Duration:</strong> {formData.duration} minutes</div>
                  {formData.location && <div><strong>Location:</strong> {formData.location}</div>}
                  {formData.description && <div><strong>Description:</strong> {formData.description}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 4 ? (
              <Button onClick={nextStep} disabled={!formData.title}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.title || !formData.date || !formData.time}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Event
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
