import {
  buildGroupStage,
  buildProjectStage,
  buildMatchStage,
  buildLookupStage,
  buildSortStage,
  buildFacetStage,
  buildStatusCountFacet,
  addPaginationStages,
  validateAnalyticsInput,
  createFieldTimeWindow
} from '../../../../actions/utils/analytics/shared-utils.js';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// --- Analytics User Subscription Queries ---

const getSubscriptionStatusSummary = async ({ context, statusField = 'status' }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: [] }, {});
  const pipeline = [
    buildGroupStage(
      { [statusField]: `$${statusField}` },
      { count: { $sum: 1 } }
    ),
    buildProjectStage({
      status: `$_id.${statusField}`,
      count: 1,
      _id: 0
    })
  ];
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const countActiveSubscriptionsPerPlan = async ({ context, status = 'active' }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: [] }, {});
  const pipeline = [
    buildMatchStage({ status }),
    buildGroupStage(
      { planId: '$planId' },
      { activeCount: { $sum: 1 } }
    ),
    buildLookupStage({
      from: 'plans',
      localField: '_id',
      foreignField: '_id',
      as: 'plan'
    }),
    { $unwind: '$plan' },
    buildProjectStage({
      planName: '$plan.name',
      activeCount: 1
    }),
    buildSortStage({ activeCount: -1 })
  ];
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const findChurnedUsers = async ({ context, sinceDate, limit = 50, skip = 0 }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: [], dateFields: ['sinceDate'] }, { sinceDate });
  const timeWindow = sinceDate ? createFieldTimeWindow({ field: 'currentPeriodEnd', to: sinceDate }) : {};
  const pipeline = [
    buildMatchStage({ status: 'canceled', ...timeWindow }),
    buildSortStage({ currentPeriodEnd: -1 })
  ];
  addPaginationStages(pipeline, { skip, limit });
  pipeline.push(
    buildLookupStage({
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }),
    { $unwind: '$user' },
    buildProjectStage({
      userId: '$user._id',
      email: '$user.email',
      canceledAt: '$currentPeriodEnd'
    })
  );
  const results = await models.Subscription.aggregate(pipeline);
  return results ?? [];
};

const getSubscriptionSnapshot = async ({ context, statuses = ['active', 'canceled'] }) => {
  const { models } = context;
  validateAnalyticsInput({ requiredFields: [] }, {});
  const facet = buildFacetStage({
    activeByPlan: [
      buildMatchStage({ status: statuses[0] }),
      buildGroupStage(
        { planId: '$planId' },
        { total: { $sum: 1 } }
      ),
      buildLookupStage({
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'plan'
      }),
      { $unwind: '$plan' },
      buildProjectStage({
        planId: '$_id',
        planName: '$plan.name',
        total: 1
      })
    ],
    ...buildStatusCountFacet(statuses, {})
  });
  const [result] = await models.Subscription.aggregate([
    facet
  ]);
  for (const status of statuses) {
    if (!result[status]) result[status] = [];
  }
  return result || { activeByPlan: [], ...Object.fromEntries(statuses.map(s => [s, []])) };
};

export default withNamespace('analyticsUserSubscription', {
  getSubscriptionStatusSummary,
  countActiveSubscriptionsPerPlan,
  findChurnedUsers,
  getSubscriptionSnapshot
});
