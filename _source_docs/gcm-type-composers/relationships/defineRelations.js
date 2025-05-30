import { UserTC } from '../user/user.modelTC.js';
import { UserAccountTC } from '../user/user-account.modelTC.js';
import { UserAuthTC } from '../user/user-auth.modelTC.js';
import { UserProfileTC } from '../user/user-profile.modelTC.js';
import { CustomerTC } from '../billing/customer.modelTC.js';
import { InvoiceTC } from '../billing/invoice.modelTC.js';
import { PaymentMethodTC } from '../billing/payment-method.modelTC.js';
import { PlanTC } from '../billing/plan.modelTC.js';
import { SubscriptionTC } from '../billing/subscription.modelTC.js';
import { CreditAccountTC } from '../credits/credit-account.modelTC.js';
import { CreditTransactionTC } from '../credits/credit-transaction.modelTC.js';
import { RoleTC } from '../user/role.modelTC.js';
import { SongTC } from '../music/song.modelTC.js';
import { SongSwipeTC } from '../music/song-swipe.modelTC.js';
import { SongRequestTC } from '../music/song-request.modelTC.js';

import {
  addOneToManyRelation,
  addManyToOneRelation,
  // Import other wrapper functions as needed
} from './relationWrappers.js';

export function applyAllModelRelations() {
  // Define relationships using the wrapper functions

  // User relations
  addOneToManyRelation(UserTC, SubscriptionTC, '_id', 'userId', 'subscriptions'); // User has many Subscriptions
  addOneToManyRelation(UserTC, InvoiceTC, '_id', 'userId', 'invoices'); // User has many Invoices
  addOneToManyRelation(UserTC, CreditAccountTC, '_id', 'userId', 'creditAccounts'); // User has many CreditAccounts
  addOneToManyRelation(UserTC, SongSwipeTC, '_id', 'userId', 'swipes'); // User has many SongSwipes
  addOneToManyRelation(UserTC, SongRequestTC, '_id', 'userId', 'requests'); // User has many SongRequests
  // Assuming UserAccount, UserAuth, UserProfile are related to User one-to-one
  addManyToOneRelation(UserAccountTC, UserTC, 'userId', '_id', 'user');
  addManyToOneRelation(UserAuthTC, UserTC, 'userId', '_id', 'user');
  addManyToOneRelation(UserProfileTC, UserTC, 'userId', '_id', 'user');

  // Billing relations
  addManyToOneRelation(SubscriptionTC, UserTC, 'userId', '_id', 'user'); // Subscription belongs to one User
  addManyToOneRelation(SubscriptionTC, PlanTC, 'planId', '_id', 'plan'); // Subscription belongs to one Plan
  addManyToOneRelation(InvoiceTC, UserTC, 'userId', '_id', 'user'); // Invoice belongs to one User
  addManyToOneRelation(InvoiceTC, CustomerTC, 'customerId', '_id', 'customer'); // Invoice belongs to one Customer
  addManyToOneRelation(PaymentMethodTC, UserTC, 'userId', '_id', 'user'); // PaymentMethod belongs to one User
  addManyToOneRelation(CustomerTC, UserTC, 'userId', '_id', 'user'); // Customer belongs to one User

  // Credits relations
  addManyToOneRelation(CreditAccountTC, UserTC, 'userId', '_id', 'user'); // CreditAccount belongs to one User
  addOneToManyRelation(CreditAccountTC, CreditTransactionTC, '_id', 'accountId', 'transactions'); // CreditAccount has many Transactions
  addManyToOneRelation(CreditTransactionTC, CreditAccountTC, 'accountId', '_id', 'account'); // CreditTransaction belongs to one CreditAccount
  addManyToOneRelation(CreditTransactionTC, UserTC, 'userId', '_id', 'user'); // CreditTransaction belongs to one User

  // Music relations
  // Song relations
  addOneToManyRelation(SongTC, SongSwipeTC, '_id', 'songId', 'swipes'); // Song has many Swipes
  addOneToManyRelation(SongTC, SongRequestTC, '_id', 'songId', 'requests'); // Song has many Requests

  // SongSwipe relations
  addManyToOneRelation(SongSwipeTC, UserTC, 'userId', '_id', 'user'); // Swipe belongs to one User
  addManyToOneRelation(SongSwipeTC, SongTC, 'songId', '_id', 'song'); // Swipe belongs to one Song
  addManyToOneRelation(SongSwipeTC, SongRequestTC, '_id', 'swipeId', 'request'); // Swipe has one Request

  // SongRequest relations
  addManyToOneRelation(SongRequestTC, UserTC, 'userId', '_id', 'user'); // Request belongs to one User
  addManyToOneRelation(SongRequestTC, SongTC, 'songId', '_id', 'song'); // Request belongs to one Song
  addManyToOneRelation(SongRequestTC, SongSwipeTC, 'swipeId', '_id', 'swipe'); // Request belongs to one Swipe

  // Configs relations
  // Add relations for Role if needed
} 