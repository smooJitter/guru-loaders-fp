import SubscriptionModel from '../models/billing/subscription.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const SubscriptionTC = composeMongoose(SubscriptionModel, {});

export { SubscriptionTC }; 