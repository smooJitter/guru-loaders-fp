import InvoiceModel from '../models/billing/invoice.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const InvoiceTC = composeMongoose(InvoiceModel, {});

export { InvoiceTC }; 