/**
 * @module mongoose-status-trackable-with-meta.plugin
 * @description Adds a status field with meta and transition history to a schema. Supports status transitions, history, and meta info.
 * @param {Schema} schema - The Mongoose schema to enhance.
 * @param {Object} [options]
 * @example
 * schema.plugin(mongooseStatusTrackableWithMetaPlugin, { field: 'status', trackHistory: true });
 */
// plugins/status-trackable-meta.js
import mongoose from 'mongoose';
import { STATUS_META, STATUS_ENUMS } from '../../config/status.constants.js';

export function statusTrackableWithMetaPlugin(schema, options = {}) {
  const { field = 'status', userField = 'updatedBy', trackHistory = true, enum: statusEnum = STATUS_ENUMS, meta: statusMeta = STATUS_META } = options;

  // Core field
  schema.add({
    [field]: {
      type: String,
      enum: statusEnum,
      default: statusEnum[0],
    },
  });

  // Optional status history
  if (trackHistory) {
    schema.add({
      [`${field}History`]: [
        {
          value: { type: String, enum: statusEnum },
          changedAt: { type: Date, default: Date.now },
          [userField]: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          reason: String,
        },
      ],
    });
  }

  // Set status with validation
  schema.methods.setStatus = function (newStatus, updatedBy = null, reason = null) {
    const currentStatus = this[field];
    const allowed = statusMeta[currentStatus]?.transitionsTo || [];

    if (!statusEnum.includes(newStatus)) {
      throw new Error(`Invalid status: "${newStatus}". Must be one of: ${statusEnum.join(', ')}`);
    }

    if (currentStatus === newStatus) return this; // No-op

    if (allowed.length > 0 && !allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: "${currentStatus}" → "${newStatus}" not allowed.`);
    }

    this[field] = newStatus;

    if (trackHistory) {
      this[`${field}History`] = this[`${field}History`] || [];
      this[`${field}History`].push({
        value: newStatus,
        changedAt: new Date(),
        [userField]: updatedBy,
        reason,
      });
    }

    return this;
  };

  schema.methods.isStatus = function (status) {
    return this[field] === status;
  };

  schema.methods.getStatusHistory = function () {
    return this[`${field}History`] || [];
  };

  schema.methods.getStatusMeta = function () {
    return statusMeta[this[field]] || {};
  };

  schema.statics.getAllStatusMeta = function () {
    return statusMeta;
  };
}
