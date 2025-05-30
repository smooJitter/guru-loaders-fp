import RoleModel from '../../domain-models/user/role.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const RoleTC = composeMongoose(RoleModel, {});

export { RoleTC }; 