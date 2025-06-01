import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage
} from '../../../utils/analytics/shared-utils.js';

/**
 * Breakdown of invoice statuses (extensible, robust).
 * @param {Object} deps - Dependencies: Invoice (model), parseISO (function)
 * @returns {Function} (options) => Promise<Object>
 *
 * @param {Array<string>} [options.statuses] - List of statuses to count (default: ['paid', 'open', 'void'])
 * @param {string} [options.dateField] - Date field to filter on (default: 'createdAt')
 * @param {Object} [options.extraMatch] - Additional match criteria (e.g., { customerId })
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getInvoiceStatusBreakdown = ({ Invoice, parseISO }) => async (options = {}) => {
  const {
    statuses = ['paid', 'open', 'void'],
    dateField = 'createdAt',
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

  // Build facets dynamically for each status
  const facetObj = {};
  for (const status of statuses) {
    facetObj[status] = [
      buildMatchStage({ ...timeWindow, status, ...extraMatch }),
      { $count: 'count' }
    ];
  }
  const facet = buildFacetStage(facetObj);

  const [result] = await Invoice.aggregate([
    facet
  ]);
  // Ensure all statuses are present in result
  for (const status of statuses) {
    if (!result[status]) result[status] = [];
  }
  return result;
};

export default getInvoiceStatusBreakdown; 