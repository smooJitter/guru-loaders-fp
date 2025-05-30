import mongoose from 'mongoose';
import { roleSchema } from '../../lib/plugins/rbac.js'; // Import the schema from the plugin file

const { model } = mongoose;

/**
 * Role model based on the rbacPlugin's schema definition.
 * This model stores available roles and their permissions.
 */
const Role = model('Role', roleSchema);

export default Role; 