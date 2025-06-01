import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage
} from '../../../utils/analytics/shared-utils.js';

/**
 * Monthly revenue report with optional date field and extra filters.
 * @param {Object} deps - Dependencies: Invoice (model), parseISO (function)
 * @returns {Function} (options) => Promise<Array<{ year: number, month: number, totalRevenue: number, invoiceCount: number }>>
 *
 * @param {string} [options.dateField] - Date field to filter on (default: 'paidAt')
 * @param {Object} [options.extraMatch] - Additional match criteria (e.g., { customerId })
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getRevenueMonthlyReport = ({ Invoice, parseISO }) => async (options = {}) => {
  const {
    dateField = 'paidAt',
    extraMatch = {},
    startDate,
    endDate
  } = options;

  // Validate dates
  let from = startDate ? parseISO(startDate) : undefined;
  let to = endDate ? parseISO(endDate) : undefined;
  if (from && to && from > to) throw new Error('startDate must be before endDate');

  const timeWindow = (from || to)
    ? createFieldTimeWindow({ field: dateField, from, to })
    : {};

  const pipeline = [
    buildMatchStage({ ...timeWindow, ...extraMatch }),
    buildGroupStage(
      { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
      { totalRevenue: { $sum: '$amountDue' }, invoiceCount: { $sum: 1 } }
    ),
    buildProjectStage({
      year: '$_id.year',
      month: '$_id.month',
      totalRevenue: 1,
      invoiceCount: 1
    }),
    buildSortStage({ year: 1, month: 1 })
  ];

  const results = await Invoice.aggregate(pipeline);
  return results ?? [];
};

export default getRevenueMonthlyReport; 