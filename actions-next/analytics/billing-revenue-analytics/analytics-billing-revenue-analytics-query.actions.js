import { parseISO } from 'date-fns';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// --- Analytics Billing Revenue Analytics Queries ---

const getRevenueMonthlyReport = async ({ context, dateField = 'paidAt', extraMatch = {}, startDate, endDate }) => {
  const { models, utils } = context;
  let from = startDate ? parseISO(startDate) : undefined;
  let to = endDate ? parseISO(endDate) : undefined;
  if (from && to && from > to) throw new Error('startDate must be before endDate');
  const timeWindow = (from || to)
    ? utils.createFieldTimeWindow({ field: dateField, from, to })
    : {};
  const pipeline = [
    utils.buildMatchStage({ ...timeWindow, ...extraMatch }),
    utils.buildGroupStage(
      { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
      { totalRevenue: { $sum: '$amountDue' }, invoiceCount: { $sum: 1 } }
    ),
    utils.buildProjectStage({
      year: '$_id.year',
      month: '$_id.month',
      totalRevenue: 1,
      invoiceCount: 1
    }),
    utils.buildSortStage({ year: 1, month: 1 })
  ];
  const results = await models.Invoice.aggregate(pipeline);
  return results ?? [];
};

const getRevenueAnnualReport = async ({ context, dateField = 'paidAt', extraMatch = {}, startYear, endYear }) => {
  const { models, utils } = context;
  let from = startYear ? new Date(startYear, 0, 1) : undefined;
  let to = endYear ? new Date(endYear + 1, 0, 1) : undefined;
  if (from && to && from > to) throw new Error('startYear must be before endYear');
  const timeWindow = (from || to)
    ? utils.createFieldTimeWindow({ field: dateField, from, to })
    : {};
  const pipeline = [
    utils.buildMatchStage({ ...timeWindow, ...extraMatch }),
    utils.buildGroupStage(
      { year: { $year: `$${dateField}` } },
      { totalRevenue: { $sum: '$amountDue' }, invoiceCount: { $sum: 1 } }
    ),
    utils.buildProjectStage({
      year: '$_id.year',
      totalRevenue: 1,
      invoiceCount: 1
    }),
    utils.buildSortStage({ year: 1 })
  ];
  const results = await models.Invoice.aggregate(pipeline);
  return results ?? [];
};

const getRevenueByPlan = async ({ context, dateField = 'paidAt', extraMatch = {}, startDate, endDate, STATUS_PAID = 'paid' }) => {
  const { models, utils } = context;
  let from = startDate ? parseISO(startDate) : undefined;
  let to = endDate ? parseISO(endDate) : undefined;
  if (from && to && from > to) throw new Error('startDate must be before endDate');
  const timeWindow = (from || to)
    ? utils.createFieldTimeWindow({ field: dateField, from, to })
    : {};
  const pipeline = [
    utils.buildMatchStage({ status: STATUS_PAID, ...timeWindow, ...extraMatch }),
    utils.buildGroupStage(
      { planId: '$planId' },
      { revenue: { $sum: '$amountDue' }, invoices: { $sum: 1 } }
    ),
    utils.buildLookupStage({
      from: 'plans',
      localField: '_id',
      foreignField: '_id',
      as: 'plan'
    }),
    { $unwind: '$plan' },
    utils.buildProjectStage({
      planId: '$_id',
      planName: '$plan.name',
      revenue: 1,
      invoices: 1
    }),
    utils.buildSortStage({ revenue: -1 })
  ];
  const results = await models.Invoice.aggregate(pipeline);
  return results ?? [];
};

const getInvoiceStatusBreakdown = async ({ context, statuses = ['paid', 'open', 'void'], dateField = 'createdAt', extraMatch = {}, startDate, endDate }) => {
  const { models, utils } = context;
  let from = startDate ? parseISO(startDate) : undefined;
  let to = endDate ? parseISO(endDate) : undefined;
  if (from && to && from > to) throw new Error('startDate must be before endDate');
  const timeWindow = (from || to)
    ? utils.createFieldTimeWindow({ field: dateField, from, to })
    : {};
  const facetObj = {};
  for (const status of statuses) {
    facetObj[status] = [
      utils.buildMatchStage({ ...timeWindow, status, ...extraMatch }),
      { $count: 'count' }
    ];
  }
  const facet = utils.buildFacetStage(facetObj);
  const [result] = await models.Invoice.aggregate([
    facet
  ]);
  for (const status of statuses) {
    if (!result[status]) result[status] = [];
  }
  return result;
};

const getCustomerRevenueLifetime = async ({ context, customerId }) => {
  const { models } = context;
  const pipeline = [
    { $match: { customerId } },
    { $group: {
      _id: null,
      totalRevenue: { $sum: '$amountDue' },
      firstPurchase: { $min: '$createdAt' },
      lastPurchase: { $max: '$createdAt' },
      invoiceCount: { $sum: 1 }
    }},
    { $project: {
      _id: 0,
      totalRevenue: 1,
      firstPurchase: 1,
      lastPurchase: 1,
      invoiceCount: 1,
      averageOrderValue: { $cond: [{$eq: ['$invoiceCount', 0]}, 0, {$divide: ['$totalRevenue', '$invoiceCount']}] }
    }}
  ];
  const [result] = await models.Invoice.aggregate(pipeline);
  return result || {
    totalRevenue: 0,
    firstPurchase: null,
    lastPurchase: null,
    invoiceCount: 0,
    averageOrderValue: 0
  };
};

const getChurnAnalysis = async ({ context, startDate, endDate }) => {
  const { models } = context;
  const pipeline = [
    { $match: {
      status: 'cancelled',
      cancelledAt: { $gte: startDate, $lte: endDate }
    }},
    { $group: {
      _id: {
        year: { $year: '$cancelledAt' },
        month: { $month: '$cancelledAt' }
      },
      churnedCount: { $sum: 1 },
      totalRevenue: { $sum: '$amount' }
    }},
    { $project: {
      _id: 0,
      year: '$_id.year',
      month: '$_id.month',
      churnedCount: 1,
      totalRevenue: 1
    }},
    { $sort: { year: 1, month: 1 } }
  ];
  return models.Subscription.aggregate(pipeline);
};

const getPlanMigrationAnalysis = async ({ context, startDate, endDate }) => {
  const { models } = context;
  const pipeline = [
    { $match: {
      updatedAt: { $gte: startDate, $lte: endDate }
    }},
    { $group: {
      _id: {
        fromPlan: '$previousPlanId',
        toPlan: '$planId'
      },
      count: { $sum: 1 },
      totalRevenue: { $sum: '$amount' }
    }},
    { $lookup: {
      from: 'plans',
      localField: '_id.fromPlan',
      foreignField: '_id',
      as: 'fromPlan'
    }},
    { $lookup: {
      from: 'plans',
      localField: '_id.toPlan',
      foreignField: '_id',
      as: 'toPlan'
    }},
    { $project: {
      _id: 0,
      fromPlan: { $arrayElemAt: ['$fromPlan.name', 0] },
      toPlan: { $arrayElemAt: ['$toPlan.name', 0] },
      count: 1,
      totalRevenue: 1
    }}
  ];
  return models.Subscription.aggregate(pipeline);
};

const getPaymentMethodAnalysis = async ({ context }) => {
  const { models } = context;
  const pipeline = [
    { $group: {
      _id: '$type',
      count: { $sum: 1 },
      activeCount: {
        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
      }
    }},
    { $project: {
      _id: 0,
      type: '$_id',
      count: 1,
      activeCount: 1,
      inactiveCount: { $subtract: ['$count', '$activeCount'] }
    }}
  ];
  return models.PaymentMethod.aggregate(pipeline);
};

const getRevenueForecast = async ({ context, months = 12 }) => {
  const { models } = context;
  const historical = await models.Invoice.aggregate([
    { $match: { status: 'paid' } },
    { $group: {
      _id: {
        year: { $year: '$paidAt' },
        month: { $month: '$paidAt' }
      },
      revenue: { $sum: '$amountDue' }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  const activeSubs = await models.Subscription.aggregate([
    { $match: { status: 'active' } },
    { $project: {
      amount: 1,
      nextBillingDate: 1
    }}
  ]);
  const forecast = [];
  for (let i = 0; i < months; i++) {
    forecast.push({
      month: i + 1,
      projectedRevenue: activeSubs.reduce((sum, sub) => sum + (sub.amount || 0), 0)
    });
  }
  return { historical, forecast };
};

const getCustomerSegments = async ({ context }) => {
  const { models } = context;
  const pipeline = [
    { $group: {
      _id: '$customerId',
      totalSpent: { $sum: '$amountDue' },
      orderCount: { $sum: 1 },
      lastOrder: { $max: '$createdAt' }
    }},
    { $project: {
      _id: 0,
      customerId: '$_id',
      totalSpent: 1,
      orderCount: 1,
      lastOrder: 1,
      segment: {
        $switch: {
          branches: [
            { case: { $gte: ['$totalSpent', 1000] }, then: 'VIP' },
            { case: { $gte: ['$totalSpent', 500] }, then: 'Regular' },
            { case: { $gte: ['$totalSpent', 100] }, then: 'Standard' }
          ],
          default: 'New'
        }
      }
    }},
    { $group: {
      _id: '$segment',
      count: { $sum: 1 },
      totalRevenue: { $sum: '$totalSpent' },
      averageOrderValue: { $avg: '$totalSpent' }
    }}
  ];
  return models.Invoice.aggregate(pipeline);
};

const getSubscriptionHealth = async ({ context }) => {
  const { models } = context;
  const pipeline = [
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalRevenue: { $sum: '$amount' },
      averageAge: { $avg: { $subtract: [new Date(), '$createdAt'] } }
    }},
    { $project: {
      _id: 0,
      status: '$_id',
      count: 1,
      totalRevenue: 1,
      averageAgeDays: { $divide: ['$averageAge', 1000 * 60 * 60 * 24] }
    }}
  ];
  return models.Subscription.aggregate(pipeline);
};

export default withNamespace('analyticsBillingRevenueAnalytics', {
  getRevenueMonthlyReport,
  getRevenueAnnualReport,
  getRevenueByPlan,
  getInvoiceStatusBreakdown,
  getCustomerRevenueLifetime,
  getChurnAnalysis,
  getPlanMigrationAnalysis,
  getPaymentMethodAnalysis,
  getRevenueForecast,
  getCustomerSegments,
  getSubscriptionHealth
});
