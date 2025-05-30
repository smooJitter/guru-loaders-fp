import { UserTC } from './user/user.modelTC.js';
import { UserAccountTC } from './user/user-account.modelTC.js';
import { UserAuthTC } from './user/user-auth.modelTC.js';
import { UserProfileTC } from './user/user-profile.modelTC.js';
import { CustomerTC } from './billing/customer.modelTC.js';
import { InvoiceTC } from './billing/invoice.modelTC.js';
import { PaymentMethodTC } from './billing/payment-method.modelTC.js';
import { PlanTC } from './billing/plan.modelTC.js';
import { SubscriptionTC } from './billing/subscription.modelTC.js';
import { CreditAccountTC } from './credits/credit-account.modelTC.js';
import { CreditTransactionTC } from './credits/credit-transaction.modelTC.js';
import { RoleTC } from './user/role.modelTC.js';

// Import the function to apply relationships
import { applyAllModelRelations } from './relationships/defineRelations.js';

// Apply all relationships to the imported TypeComposers
applyAllModelRelations();

export {
  UserTC,
  UserAccountTC,
  UserAuthTC,
  UserProfileTC,
  CustomerTC,
  InvoiceTC,
  PaymentMethodTC,
  PlanTC,
  SubscriptionTC,
  CreditAccountTC,
  CreditTransactionTC,
  RoleTC,
}; 