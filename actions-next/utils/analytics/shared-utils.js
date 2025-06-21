// ============================================================================
// 📦 Canonical Shared Analytics Utilities
// ----------------------------------------------------------------------------
// This file contains utility functions for analytics modules across all domains.
//
// 🟢 These are the *official* shared versions, intended for cross-domain use.
// 🟡 For now, these are DUPLICATED from their original location:
//     music/analytics/song-intelligence/lib/pipelines.js
//
// 🚨 SAFETY: No code elsewhere imports from here yet. Do NOT delete originals
//    or update imports until you have:
//      1. Verified all usages are compatible with these shared versions.
//      2. Coordinated with maintainers of affected modules.
//      3. Thoroughly tested all analytics features after migration.
//
// 🛠️ Maintainers: To migrate usage, update imports in analytics modules to use
//    this file, then remove the originals ONLY after all tests pass.
// ----------------------------------------------------------------------------
// All functions are defensive: null/undefined input is handled gracefully.
// ============================================================================

import R from 'ramda';
import { isArray } from 'ramda-adjunct';

/**
 * Returns the aggregation result if it is an array, otherwise returns an empty array.
 * Defensive: null/undefined/non-array input returns [].
 * @param {*} result - The aggregation result.
 * @returns {Array}
 */
export const safeAggregate = (result) => isArray(result) ? result : [];

/**
 * Returns a MongoDB date range for the last N hours.
 * @param {number} hours
 * @returns {Object}
 */
export const createTimeWindow = R.curry((hours) => ({
  $gte: new Date(Date.now() - hours * 60 * 60 * 1000)
}));

/**
 * Creates a MongoDB time window filter for any timestamp field.
 * Defensive: returns {} if no field is provided.
 * @param {Object} options
 * @returns {Object}
 */
export function createFieldTimeWindow({ field, days, hours, from, to } = {}) {
  if (!field) return {};
  let $gte, $lte;
  if (typeof days === 'number') {
    $gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  } else if (typeof hours === 'number') {
    $gte = new Date(Date.now() - hours * 60 * 60 * 1000);
  } else if (from) {
    $gte = new Date(from);
  }
  if (to) {
    $lte = new Date(to);
  }
  const filter = {};
  if ($gte || $lte) {
    filter[field] = {};
    if ($gte) filter[field].$gte = $gte;
    if ($lte) filter[field].$lte = $lte;
  }
  return filter;
}

/**
 * Builds a MongoDB $match stage from a fields object.
 * Defensive: null/undefined input returns { $match: {} }.
 * @param {Object} fields
 * @returns {Object}
 */
export function buildMatchStage(fields = {}) {
  return { $match: { ...fields } };
}

/**
 * Builds a MongoDB $group stage.
 * Defensive: null/undefined input returns { $group: { _id: {} } }.
 * @param {Object} groupBy
 * @param {Object} aggregations
 * @returns {Object}
 */
export function buildGroupStage(groupBy = {}, aggregations = {}) {
  return { $group: { _id: groupBy, ...aggregations } };
}

/**
 * Builds a MongoDB $facet stage.
 * Defensive: null/undefined input returns { $facet: {} }.
 * @param {Object} facets
 * @returns {Object}
 */
export function buildFacetStage(facets = {}) {
  return { $facet: { ...facets } };
}

/**
 * Builds a MongoDB $lookup stage.
 * Defensive: null/undefined input returns { $lookup: {} }.
 * @param {Object} options
 * @returns {Object}
 */
export function buildLookupStage({ from, localField, foreignField, as } = {}) {
  return { $lookup: { from, localField, foreignField, as } };
}

/**
 * Builds a MongoDB $sort stage.
 * Defensive: null/undefined input returns { $sort: {} }.
 * @param {Object} sortFields
 * @returns {Object}
 */
export function buildSortStage(sortFields = {}) {
  return { $sort: { ...sortFields } };
}

/**
 * Builds a MongoDB $project stage.
 * Defensive: null/undefined input returns { $project: {} }.
 * @param {Object} projection
 * @returns {Object}
 */
export function buildProjectStage(projection = {}) {
  return { $project: { ...projection } };
}

/**
 * Returns a $dateToString expression for daily bucketing.
 * Defensive: null/undefined input returns default format for 'createdAt'.
 * @param {string} field
 * @returns {Object}
 */
export function bucketByDay(field = 'createdAt') {
  return { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } };
}

/**
 * Returns a $sum expression for the absolute value of a field.
 * Defensive: null/undefined input returns $sum: { $abs: '$amount' }.
 * @param {string} field
 * @returns {Object}
 */
export function sumAbs(field = 'amount') {
  return { $sum: { $abs: `$${field}` } };
}

/**
 * Appends $skip and $limit stages to a pipeline for pagination.
 * Defensive: always returns an array.
 * @param {Array} pipeline
 * @param {Object} options
 * @returns {Array}
 */
export function addPaginationStages(pipeline, { skip = 0, limit = 10 } = {}) {
  const arr = isArray(pipeline) ? pipeline : [];
  if (skip) arr.push({ $skip: skip });
  if (limit) arr.push({ $limit: limit });
  return arr;
}

/**
 * Builds a MongoDB $bucket stage for range bucketing.
 * @param {Object} options - { groupBy, boundaries, default, output }
 * @returns {Object} MongoDB $bucket stage.
 * @example
 *   buildBucketStage({
 *     groupBy: '$balance',
 *     boundaries: [0, 100, 1000],
 *     default: '1000+',
 *     output: { count: { $sum: 1 } }
 *   })
 */
export function buildBucketStage({ groupBy, boundaries, default: def, output }) {
  return {
    $bucket: {
      groupBy,
      boundaries,
      default: def,
      output
    }
  };
}

/**
 * Builds a $facet stage for counting documents by status.
 * @param {Array<string>} statuses - List of statuses.
 * @param {Object} baseMatch - Base match criteria (applied to all statuses).
 * @param {Object} [extraPerStatus] - Optional map of extra match criteria per status.
 * @returns {Object} MongoDB $facet stage.
 * @example
 *   buildStatusCountFacet(['paid', 'open'], { userId }, { paid: { planId } })
 */
export function buildStatusCountFacet(statuses, baseMatch, extraPerStatus = {}) {
  const facets = {};
  for (const status of statuses) {
    facets[status] = [
      buildMatchStage({ ...baseMatch, status, ...(extraPerStatus[status] || {}) }),
      { $count: 'count' }
    ];
  }
  return buildFacetStage(facets);
}

/**
 * Enhanced: Creates a MongoDB time window filter for any timestamp field, supporting units and inclusivity.
 * @param {Object} options - { field, days, hours, months, years, from, to, inclusive }
 * @returns {Object} MongoDB filter.
 * @example
 *   createFieldTimeWindowEnhanced({ field: 'createdAt', days: 7 })
 *   createFieldTimeWindowEnhanced({ field: 'createdAt', from, to, inclusive: false })
 */
export function createFieldTimeWindowEnhanced({ field, days, hours, months, years, from, to, inclusive = true }) {
  if (!field) throw new Error('field is required');
  let $gte, $gt, $lte, $lt;
  if (typeof days === 'number') {
    $gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  } else if (typeof hours === 'number') {
    $gte = new Date(Date.now() - hours * 60 * 60 * 1000);
  } else if (typeof months === 'number') {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    $gte = d;
  } else if (typeof years === 'number') {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    $gte = d;
  } else if (from) {
    $gte = new Date(from);
  }
  if (to) {
    $lte = new Date(to);
  }
  // If not inclusive, use $gt/$lt
  const filter = {};
  if ($gte || $lte) {
    filter[field] = {};
    if (inclusive) {
      if ($gte) filter[field].$gte = $gte;
      if ($lte) filter[field].$lte = $lte;
    } else {
      if ($gte) filter[field].$gt = $gte;
      if ($lte) filter[field].$lt = $lte;
    }
  }
  return filter;
}

/**
 * Builds a common aggregation pipeline from parameterized options.
 * @param {Object} options - { match, groupBy, aggregations, project, sort, extraStages }
 * @returns {Array} Aggregation pipeline.
 * @example
 *   buildAggregationPipeline({
 *     match: { userId },
 *     groupBy: { day: bucketByDay('createdAt') },
 *     aggregations: { total: sumAbs('amount') },
 *     project: { day: '$_id.day', total: 1 },
 *     sort: { day: 1 }
 *   })
 */
export function buildAggregationPipeline({ match, groupBy, aggregations, project, sort, extraStages = [] }) {
  const pipeline = [];
  if (match) pipeline.push(buildMatchStage(match));
  if (groupBy && aggregations) pipeline.push(buildGroupStage(groupBy, aggregations));
  if (project) pipeline.push(buildProjectStage(project));
  if (sort) pipeline.push(buildSortStage(sort));
  if (extraStages.length) pipeline.push(...extraStages);
  return pipeline;
}

/**
 * Merges multiple filter objects into a single $match stage, with validation.
 * @param {...Object} filters - Any number of filter objects.
 * @returns {Object} MongoDB $match stage.
 * @example
 *   buildFlexibleMatchStage({ status: 'paid' }, { userId })
 */
export function buildFlexibleMatchStage(...filters) {
  return buildMatchStage(Object.assign({}, ...filters));
}

/**
 * Validates analytics function inputs.
 * @param {Object} options - { requiredFields, dateFields }
 * @param {Object} input - The input object to validate.
 * @throws {Error} if validation fails.
 * @example
 *   validateAnalyticsInput({ requiredFields: ['userId'], dateFields: ['startDate'] }, input) 
 */
export function validateAnalyticsInput({ requiredFields = [], dateFields = [] }, input) {
  for (const field of requiredFields) {
    if (input[field] == null) throw new Error(`${field} is required`);
  }
  for (const field of dateFields) {
    if (input[field] && isNaN(new Date(input[field]).getTime())) {
      throw new Error(`${field} must be a valid date`);
    }
  }
}

/**
 * Builds a $sum with $cond for conditional aggregation.
 * @param {Array} condition - The $cond array.
 * @returns {Object}
 * @example
 *   buildConditionalSum([{ $eq: ['$direction', 'right'] }, 1, 0])
 *   // => { $sum: { $cond: [ ... ] } }
 */
export function buildConditionalSum(condition) {
  return { $sum: { $cond: condition } };
}

/**
 * Builds a $push stage for array aggregation.
 * @param {Object} value - The value to push.
 * @returns {Object}
 * @example
 *   buildPushArray({ hour: '$_id.hour', engagement: '$engagement' })
 *   // => { $push: { hour: '$_id.hour', engagement: '$engagement' } }
 */
export function buildPushArray(value) {
  return { $push: value };
}

/**
 * Builds a $addToSet stage for array aggregation.
 * @param {Object} value - The value to add to set.
 * @returns {Object}
 * @example
 *   buildAddToSetArray('$userId')
 *   // => { $addToSet: '$userId' }
 */
export function buildAddToSetArray(value) {
  return { $addToSet: value };
}

/**
 * Safely converts a value to a MongoDB ObjectId, or returns null if invalid.
 * @param {*} value
 * @param {Function} ObjectId - MongoDB ObjectId constructor
 * @returns {ObjectId|null}
 * @example
 *   safeObjectId('507f1f77bcf86cd799439011', ObjectId) // => ObjectId('507f1f77bcf86cd799439011')
 *   safeObjectId('bad', ObjectId) // => null
 */
export function safeObjectId(value, ObjectId) {
  try {
    return value ? new ObjectId(value) : null;
  } catch {
    return null;
  }
}

/**
 * Ensures the input is always an array.
 * @param {*} value
 * @returns {Array}
 * @example
 *   ensureArray(1) // => [1]
 *   ensureArray([1,2]) // => [1,2]
 *   ensureArray(null) // => []
 */
export function ensureArray(value) {
  return isArray(value) ? value : value == null ? [] : [value];
}

/**
 * Returns a shallow copy of obj with all null/undefined values removed.
 * @param {Object} obj
 * @returns {Object}
 * @example
 *   omitNulls({ a: 1, b: null, c: undefined }) // => { a: 1 }
 */
export function omitNulls(obj = {}) {
  return R.pickBy(v => v != null, obj);
}

/**
 * Builds a $match stage for a field with $in, safely handling empty/null arrays.
 * @param {string} field
 * @param {Array} values
 * @returns {Object}
 * @example
 *   buildInMatchStage('userId', ['a','b']) // => { $match: { userId: { $in: ['a','b'] } } }
 *   buildInMatchStage('userId', []) // => { $match: { userId: { $in: [null] } } }
 */
export function buildInMatchStage(field, values) {
  return { $match: { [field]: { $in: isArray(values) && values.length ? values : [null] } } };
}

/**
 * Sums an array of numbers, treating non-numbers as zero.
 * @param {Array} arr
 * @returns {number}
 * @example
 *   safeSum([1,2,3]) // => 6
 *   safeSum([1,null,2]) // => 3
 */
export function safeSum(arr) {
  return isArray(arr) ? arr.reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0) : 0;
}

/**
 * Returns the first element of an array, or undefined.
 * @param {*} arr
 * @returns {*}
 * @example
 *   getFirst([1,2,3]) // => 1
 *   getFirst([]) // => undefined
 */
export function getFirst(arr) {
  return isArray(arr) && arr.length ? arr[0] : undefined;
} 