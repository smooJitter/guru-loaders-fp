import withNamespace from '../../utils/withNamespace';

/**
 * Bulk actions for billing/invoice
 * @module billing/invoice/invoice-bulk.actions
 */

const actions = [
  /**
   * Example: Bulk import invoices
   * @param {Object} params - { context, invoices }
   * @returns {Promise<Array>} Array of created invoice objects
   */
  {
    name: 'bulkImportInvoices',
    method: async ({ context, invoices }) => {
      // # Reason: Bulk operation, handled by billing service
      return context.services.billing.bulkImportInvoices(invoices);
    },
  },
];

export default withNamespace('invoice', actions); 