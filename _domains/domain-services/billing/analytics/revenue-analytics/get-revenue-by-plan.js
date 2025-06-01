import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildLookupStage,
  buildProjectStage,
  buildSortStage
} from '../../../utils/analytics/shared-utils.js';

/**
 * Revenue by plan with optional date filter and extra filters.
 * @param {Object} deps - Dependencies: Invoice (model), parseISO (function), STATUS_PAID (string)
 * @returns {Function} (options) => Promise<Array<{ planId: string, planName: string, revenue: number, invoices: number }>>
 *
 * @param {string} [options.dateField] - Date field to filter on (default: 'paidAt')
 * @param {Object} [options.extraMatch] - Additional match criteria (e.g., { customerId })
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getRevenueByPlan = ({ Invoice, parseISO, STATUS_PAID }) => async (options = {}) => {
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
    buildMatchStage({ status: STATUS_PAID, ...timeWindow, ...extraMatch }),
    buildGroupStage(
      { planId: '$planId' },
      { revenue: { $sum: '$amountDue' }, invoices: { $sum: 1 } }
    ),
    buildLookupStage({
      from: 'plans',
      localField: '_id.planId',
      foreignField: '_id',
      as: 'plan'
    }),
    { $unwind: '$plan' },
    buildProjectStage({
      planId: '$_id.planId',
      planName: '$plan.name',
      revenue: 1,
      invoices: 1
    }),
    buildSortStage({ revenue: -1 })
  ];

  const results = await Invoice.aggregate(pipeline);
  return results ?? [];
};

export default getRevenueByPlan; 