// models/index.js

import CreditAccount from './credits/credit-account.model.js';
import CreditTransaction from './credits/credit-transaction.model.js';
import Customer from './billing/customer.model.js';
import Invoice from './billing/invoice.model.js';
import PaymentMethod from './billing/payment-method.model.js';
import Plan from './billing/plan.model.js';
import Role from './user/role.model.js';
import Subscription from './billing/subscription.model.js';
import User from './user/user.model.js';
import UserAccount from './user/user-account.model.js';
import UserAuth from './user/user-auth.model.js';
import UserProfile from './user/user-profile.model.js';
import { Song, SongSwipe } from './music/index.js';
import { Event, Attendee } from './events/index.js';

export default {
  CreditAccount,
  CreditTransaction,
  Customer,
  Invoice,
  PaymentMethod,
  Plan,
  Role,
  Subscription,
  User,
  UserAccount,
  UserAuth,
  UserProfile,
  Song,
  SongSwipe,
  Event,
  Attendee
}; 