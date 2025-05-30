import PlanModel from '../../domain-models/billing/plan.model.js';
import { composeMongoose } from 'graphql-compose-mongoose';
import { schemaComposer } from 'graphql-compose';

const PlanTC = composeMongoose(PlanModel, {});

export { PlanTC }; 