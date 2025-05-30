import UserAuthModel from '../models/user/user-auth.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const UserAuthTC = composeMongoose(UserAuthModel, {});

export { UserAuthTC }; 