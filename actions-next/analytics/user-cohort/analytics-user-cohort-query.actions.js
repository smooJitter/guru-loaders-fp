import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage,
  buildLookupStage,
  buildFacetStage,
  buildPushArray,
  validateAnalyticsInput
} from '../../../../actions/utils/analytics/shared-utils.js';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// --- Analytics User Cohort Queries ---

const getCohortRetentionRates = async ({ context, dateField = 'createdAt', startDate, endDate }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });
  const pipeline = [
    buildMatchStage({ ...timeWindow }),
    buildGroupStage(
      { signupMonth: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } }, status: '$status' },
      { count: { $sum: 1 } }
    ),
    buildGroupStage(
      { signupMonth: '$_id.signupMonth' },
      {
        retained: { $sum: { $cond: [{ $eq: ['$_id.status', 'active'] }, '$count', 0] } },
        churned: { $sum: { $cond: [{ $eq: ['$_id.status', 'canceled'] }, '$count', 0] } }
      }
    ),
    buildProjectStage({
      signupMonth: '$_id.signupMonth',
      retained: 1,
      churned: 1,
      retentionRate: {
        $cond: [
          { $eq: [{ $add: ['$retained', '$churned'] }, 0] },
          0,
          { $divide: ['$retained', { $add: ['$retained', '$churned'] }] }
        ]
      },
      _id: 0
    }),
    buildSortStage({ signupMonth: 1 })
  ];
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const getCohortRetentionCohorts = async ({ context, dateField = 'createdAt', startDate, endDate }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });
  const pipeline = [
    buildMatchStage({ ...timeWindow }),
    buildGroupStage(
      { signupMonth: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } } },
      { retained: { $sum: 1 } }
    ),
    buildProjectStage({ signupMonth: '$_id.signupMonth', retained: 1, _id: 0 }),
    buildSortStage({ signupMonth: 1 })
  ];
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const getCohortMonthlyChurnAndGrowth = async ({ context, dateField = 'createdAt', startDate, endDate }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });
  const pipeline = [
    buildMatchStage({ ...timeWindow }),
    buildGroupStage(
      { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` }, status: '$status' },
      { count: { $sum: 1 } }
    ),
    buildGroupStage(
      { year: '$_id.year', month: '$_id.month' },
      {
        churned: {
          $sum: { $cond: [{ $eq: ['$_id.status', 'canceled'] }, '$count', 0] }
        },
        newSubs: {
          $sum: { $cond: [{ $eq: ['$_id.status', 'active'] }, '$count', 0] }
        }
      }
    ),
    buildProjectStage({ year: '$_id.year', month: '$_id.month', churned: 1, newSubs: 1, _id: 0 }),
    buildSortStage({ year: 1, month: 1 })
  ];
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const getCohortDashboard = async ({ context, dateField = 'createdAt', startDate, endDate }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });
  const facet = buildFacetStage({
    retention: [
      buildMatchStage({ ...timeWindow }),
      buildLookupStage({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }),
      { $unwind: '$user' },
      buildGroupStage(
        {
          signupMonth: { $dateToString: { format: '%Y-%m', date: '$user.createdAt' } },
          status: '$status'
        },
        { count: { $sum: 1 } }
      ),
      buildGroupStage(
        { signupMonth: '$_id.signupMonth' },
        { statuses: buildPushArray({ status: '$_id.status', count: '$count' }) }
      ),
      buildSortStage({ 'signupMonth': 1 })
    ],
    growth: [
      buildMatchStage({ ...timeWindow }),
      buildGroupStage(
        { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
        { newSubs: { $sum: 1 } }
      ),
      buildProjectStage({ year: '$_id.year', month: '$_id.month', newSubs: 1, _id: 0 }),
      buildSortStage({ year: 1, month: 1 })
    ]
  });
  const [results] = await models.Subscription.aggregate([
    facet
  ]);
  return results || { retention: [], growth: [] };
};

export default withNamespace('analyticsUserCohort', {
  getCohortRetentionRates,
  getCohortRetentionCohorts,
  getCohortMonthlyChurnAndGrowth,
  getCohortDashboard
});
