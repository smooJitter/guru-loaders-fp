import CreditAccountModel from '../models/credits/credit-account.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const CreditAccountTC = composeMongoose(CreditAccountModel, {});

export { CreditAccountTC }; 