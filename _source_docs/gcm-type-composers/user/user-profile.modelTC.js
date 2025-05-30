import UserProfileModel from '../models/user/user-profile.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const UserProfileTC = composeMongoose(UserProfileModel, {});

export { UserProfileTC }; 