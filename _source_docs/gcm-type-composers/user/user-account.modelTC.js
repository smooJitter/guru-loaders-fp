import UserAccountModel from '../models/user/user-account.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const UserAccountTC = composeMongoose(UserAccountModel, {});

export { UserAccountTC }; 