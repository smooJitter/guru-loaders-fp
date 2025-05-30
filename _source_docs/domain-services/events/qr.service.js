/**
 * QR Code Service
 * Handles QR code generation and validation for tickets
 * @module domain-services/events/qr.service
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import { ValidationError } from '../../lib/errors.js';

// Constants
const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const QR_SECRET = process.env.QR_SECRET || 'default-secret-change-in-prod';

/**
 * Generate a QR code payload for a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} QR code data and expiry
 */
export const generateQRPayload = async (ticketId, eventId, userId) => {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_EXPIRY_MS;
  
  // Create payload
  const payload = {
    ticketId,
    eventId,
    userId,
    timestamp,
    expiresAt
  };

  // Sign payload
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Combine payload and signature
  const qrData = {
    ...payload,
    signature
  };

  // Generate QR code
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

  return {
    qrCode,
    expiresAt,
    payload: qrData
  };
};

/**
 * Validate a QR code payload
 * @param {Object} qrData - Decoded QR code data
 * @returns {Object} Validated payload
 * @throws {ValidationError} If QR code is invalid
 */
export const validateQRPayload = (qrData) => {
  // Verify signature
  const { signature, ...payload } = qrData;
  const expectedSignature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new ValidationError('Invalid QR code signature');
  }

  // Check expiry
  if (Date.now() > qrData.expiresAt) {
    throw new ValidationError('QR code has expired');
  }

  return payload;
};

/**
 * Process QR code entry
 * @param {Object} qrData - QR code data
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Entry result
 */
export const processQREntry = async (qrData, context) => {
  const payload = validateQRPayload(qrData);
  
  // Get ticket and validate
  const ticket = await context.services.ticket.getTicketById(payload.ticketId);
  if (!ticket.canBeUsed) {
    throw new ValidationError('Ticket cannot be used');
  }

  // Update ticket with QR usage
  const updatedTicket = await context.services.ticket.updateTicketAfterQRUse(
    payload.eventId,
    payload.ticketId,
    {
      method: 'qr',
      location: context.location,
      qrExpiresAt: payload.expiresAt,
      qrTimestamp: payload.timestamp
    },
    context
  );

  // Process entry
  const entry = await context.services.attendee.checkInAttendee(
    payload.eventId,
    payload.userId,
    {
      method: 'qr',
      ticketId: payload.ticketId,
      location: context.location
    },
    context
  );

  return {
    success: true,
    ticket: updatedTicket,
    entry
  };
}; 