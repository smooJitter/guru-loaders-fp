import { parseISO } from 'date-fns';
import Invoice from '../../models/Invoice.js';

const STATUS_PAID = 'paid';
const STATUS_OPEN = 'open';
const STATUS_VOID = 'void';

/**
 * Monthly revenue report.
 * @param {Object} params
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<Array<{ year: number, month: number, totalRevenue: number, invoiceCount: number }>>}
 */
export const getMonthlyRevenueReport = async ({ startDate, endDate } = {}) => {
  const match = { status: STATUS_PAID };
  if (startDate || endDate) match.paidAt = {};
  if (startDate) match.paidAt.$gte = parseISO(startDate);
  if (endDate)   match.paidAt.$lt  = parseISO(endDate);

  const results = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year:  { $year: '$paidAt' },
          month: { $month: '$paidAt' }
        },
        totalRevenue: { $sum: '$amountDue' },
        invoiceCount: { $sum: 1 }
      }
    },
    {
      $project: {
        year:         '$_id.year',
        month:        '$_id.month',
        totalRevenue: 1,
        invoiceCount: 1
      }
    },
    { $sort: { year: 1, month: 1 } }
  ]);
  return results ?? [];
};

/**
 * Annual revenue report.
 * @param {Object} params
 * @param {number} [params.startYear]
 * @param {number} [params.endYear]
 * @returns {Promise<Array<{ year: number, totalRevenue: number, invoiceCount: number }>>}
 */
export const getAnnualRevenueReport = async ({ startYear, endYear } = {}) => {
  const match = { status: STATUS_PAID };
  if (startYear || endYear) match.paidAt = {};
  if (startYear) match.paidAt.$gte = new Date(startYear, 0, 1);
  if (endYear)   match.paidAt.$lt  = new Date(endYear + 1, 0, 1);

  const results = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: { year: { $year: '$paidAt' } },
        totalRevenue: { $sum: '$amountDue' },
        invoiceCount: { $sum: 1 }
      }
    },
    {
      $project: {
        year:         '$_id.year',
        totalRevenue: 1,
        invoiceCount: 1
      }
    },
    { $sort: { year: 1 } }
  ]);
  return results ?? [];
};

/**
 * Revenue by plan with optional date filter.
 * @param {Object} params
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<Array<{ planId: string, planName: string, revenue: number, invoices: number }>>}
 */
export const getRevenueByPlan = async ({ startDate, endDate } = {}) => {
  const match = { status: STATUS_PAID };
  if (startDate || endDate) match.paidAt = {};
  if (startDate) match.paidAt.$gte = parseISO(startDate);
  if (endDate)   match.paidAt.$lt  = parseISO(endDate);

  const results = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$planId',
        revenue:  { $sum: '$amountDue' },
        invoices: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'plan'
      }
    },
    { $unwind: '$plan' },
    {
      $project: {
        planId:   '$_id',
        planName: '$plan.name',
        revenue:  1,
        invoices: 1
      }
    },
    { $sort: { revenue: -1 } }
  ]);
  return results ?? [];
};

/**
 * Breakdown of invoice statuses.
 * @param {Object} params
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<Object>} // { paid: [{count}], open: [{count}], void: [{count}] }
 */
export const getInvoiceStatusBreakdown = async ({ startDate, endDate } = {}) => {
  const matchBase = {};
  if (startDate || endDate) matchBase.createdAt = {};
  if (startDate) matchBase.createdAt.$gte = parseISO(startDate);
  if (endDate)   matchBase.createdAt.$lt  = parseISO(endDate);

  const [result] = await Invoice.aggregate([
    {
      $facet: {
        paid: [
          { $match: { ...matchBase, status: STATUS_PAID } },
          { $count: 'count' }
        ],
        open: [
          { $match: { ...matchBase, status: STATUS_OPEN } },
          { $count: 'count' }
        ],
        void: [
          { $match: { ...matchBase, status: STATUS_VOID } },
          { $count: 'count' }
        ]
      }
    }
  ]);
  return result || { paid: [], open: [], void: [] };
}; 