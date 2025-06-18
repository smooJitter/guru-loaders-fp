/**
 * Time Slot Schema
 * @module domain-models/lib/shared_schema/scheduling/timeSlot
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const RecurrenceRuleSchema = new Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    min: 1,
    default: 1
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  daysOfMonth: [{
    type: Number,
    min: 1,
    max: 31
  }],
  monthsOfYear: [{
    type: Number,
    min: 0,
    max: 11
  }],
  endDate: Date,
  occurrences: {
    type: Number,
    min: 1
  },
  exceptions: [Date]
}, { _id: false });

const TimeSlotSchema = new Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,  // in minutes
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['available', 'booked', 'blocked', 'maintenance'],
    required: true
  },
  capacity: {
    type: Number,
    min: 0,
    default: 1
  },
  currentBookings: {
    type: Number,
    min: 0,
    default: 0
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  recurrence: RecurrenceRuleSchema,
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  bookings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'no_show'],
      default: 'confirmed'
    },
    bookedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
TimeSlotSchema.index({ entityType: 1, entityId: 1 });
TimeSlotSchema.index({ startTime: 1, endTime: 1 });
TimeSlotSchema.index({ type: 1, status: 1 });
TimeSlotSchema.index({ 'bookings.userId': 1 });

// Virtuals
TimeSlotSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         this.type === 'available' &&
         this.currentBookings < this.capacity;
});

TimeSlotSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.currentBookings);
});

// Methods
TimeSlotSchema.methods.book = function(userId, quantity = 1) {
  if (!this.isAvailable || quantity > this.availableSpots) {
    throw new Error('Time slot not available');
  }

  this.bookings.push({
    userId,
    quantity,
    status: 'confirmed',
    bookedAt: new Date()
  });
  
  this.currentBookings += quantity;
  
  if (this.currentBookings >= this.capacity) {
    this.type = 'booked';
  }
};

TimeSlotSchema.methods.cancel = function(userId) {
  const booking = this.bookings.find(b => 
    b.userId.toString() === userId.toString() &&
    b.status === 'confirmed'
  );
  
  if (booking) {
    booking.status = 'cancelled';
    this.currentBookings -= booking.quantity;
    
    if (this.currentBookings < this.capacity) {
      this.type = 'available';
    }
  }
};

TimeSlotSchema.methods.generateRecurrences = function(until) {
  if (!this.recurrence) return [this];
  
  const slots = [];
  let current = new Date(this.startTime);
  const end = until || this.recurrence.endDate;
  let count = 0;
  
  while ((!end || current <= end) && 
         (!this.recurrence.occurrences || count < this.recurrence.occurrences)) {
    
    if (!this.recurrence.exceptions.some(d => d.getTime() === current.getTime())) {
      slots.push({
        ...this.toObject(),
        startTime: current,
        endTime: new Date(current.getTime() + this.duration * 60000),
        recurrence: null
      });
    }
    
    switch (this.recurrence.frequency) {
      case 'daily':
        current.setDate(current.getDate() + this.recurrence.interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + (7 * this.recurrence.interval));
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + this.recurrence.interval);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + this.recurrence.interval);
        break;
    }
    
    count++;
  }
  
  return slots;
};

export { TimeSlotSchema, RecurrenceRuleSchema }; 