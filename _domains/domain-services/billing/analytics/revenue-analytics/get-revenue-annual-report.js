import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage
} from '../../../utils/analytics/shared-utils.js';

/**
 * Annual revenue report with optional date field and extra filters.
 * @param {Object} deps - Dependencies: Invoice (model)
 * @returns {Function} (options) => Promise<Array<{ year: number, totalRevenue: number, invoiceCount: number }>>
 *
 * @param {string} [options.dateField] - Date field to filter on (default: 'paidAt')
 * @param {Object} [options.extraMatch] - Additional match criteria (e.g., { customerId })
 * @param {string|Date} [options.startYear]
 * @param {string|Date} [options.endYear]
 */
const getRevenueAnnualReport = ({ Invoice }) => async (options = {}) => {
  const {
    dateField = 'paidAt',
    extraMatch = {},
    startYear,
    endYear
  } = options;

  // Validate years
  let from = startYear ? new Date(startYear, 0, 1) : undefined;
  let to = endYear ? new Date(endYear + 1, 0, 1) : undefined;
  if (from && to && from > to) throw new Error('startYear must be before endYear');

  const timeWindow = (from || to)
    ? createFieldTimeWindow({ field: dateField, from, to })
    : {};

  const pipeline = [
    buildMatchStage({ ...timeWindow, ...extraMatch }),
    buildGroupStage(
      { year: { $year: `$${dateField}` } },
      { totalRevenue: { $sum: '$amountDue' }, invoiceCount: { $sum: 1 } }
    ),
    buildProjectStage({
      year: '$_id.year',
      totalRevenue: 1,
      invoiceCount: 1
    }),
    buildSortStage({ year: 1 })
  ];

  const results = await Invoice.aggregate(pipeline);
  return results ?? [];
};

export default getRevenueAnnualReport; 