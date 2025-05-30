import UserModel from '../models/user/user.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

// Create the TypeComposer from the Mongoose Model
const UserTC = composeMongoose(UserModel, {});

// Export the TypeComposer
export { UserTC }; 