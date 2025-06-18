/**
 * Shared Contact Schema
 * Reusable contact information schema for embedding in other models
 */
import mongoose from 'mongoose';
import { schemaComposer } from 'graphql-compose';

// Email Schema
const EmailSchema = new mongoose.Schema({
  address: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  },
  type: {
    type: String,
    enum: ['personal', 'work', 'other'],
    default: 'other',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
}, { _id: false, timestamps: false });

// Phone Schema
const PhoneSchema = new mongoose.Schema({
  number: {
    type: String,
    trim: true,
  },
  extension: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['mobile', 'home', 'work', 'fax', 'other'],
    default: 'other',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
}, { _id: false, timestamps: false });

// Full Contact Information Schema
const ContactSchema = new mongoose.Schema({
  emails: [EmailSchema],
  phones: [PhoneSchema],
  website: {
    type: String,
    trim: true,
    match: [
      /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
      'Please use a valid URL.'
    ],
  },
  socialMedia: {
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    github: { type: String, trim: true },
    other: { type: Map, of: String },
  },
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'mail', 'any'],
    default: 'email',
  },
}, { _id: false, timestamps: false });

// Create the GraphQL types directly without Mongoose models
const EmailTC = schemaComposer.createObjectTC({
  name: 'Email',
  description: 'Email contact information',
  fields: {
    address: 'String!',
    type: {
      type: 'String!',
      description: 'Type of email address',
    },
    isVerified: 'Boolean!',
    isDefault: 'Boolean!',
    verifiedAt: 'Date',
  },
});

const PhoneTC = schemaComposer.createObjectTC({
  name: 'Phone',
  description: 'Phone contact information',
  fields: {
    number: 'String!',
    extension: 'String',
    type: {
      type: 'String!',
      description: 'Type of phone number',
    },
    isVerified: 'Boolean!',
    isDefault: 'Boolean!',
    verifiedAt: 'Date',
  },
});

const SocialMediaTC = schemaComposer.createObjectTC({
  name: 'SocialMedia',
  description: 'Social media links',
  fields: {
    facebook: 'String',
    twitter: 'String',
    linkedin: 'String',
    instagram: 'String',
    youtube: 'String',
    github: 'String',
  },
});

const ContactTC = schemaComposer.createObjectTC({
  name: 'Contact',
  description: 'Full contact information including emails, phones, and social media',
  fields: {
    emails: [EmailTC],
    phones: [PhoneTC],
    website: 'String',
    socialMedia: SocialMediaTC,
    preferredContactMethod: 'String!',
  },
});

// Export schemas and type composers
export {
  EmailSchema,
  EmailTC,
  PhoneSchema,
  PhoneTC,
  ContactSchema,
  ContactTC
}; 