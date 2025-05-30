import CreditTransactionModel from '../models/credits/credit-transaction.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const CreditTransactionTC = composeMongoose(CreditTransactionModel, {});

export { CreditTransactionTC }; 