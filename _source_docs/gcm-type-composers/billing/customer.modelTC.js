import CustomerModel from '../models/billing/customer.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const CustomerTC = composeMongoose(CustomerModel, {});

export { CustomerTC }; 