import PaymentMethodModel from '../models/billing/payment-method.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const PaymentMethodTC = composeMongoose(PaymentMethodModel, {});

export { PaymentMethodTC }; 