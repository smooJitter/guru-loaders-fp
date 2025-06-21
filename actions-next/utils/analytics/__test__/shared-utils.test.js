import {
  safeObjectId, ensureArray, omitNulls, buildInMatchStage, safeSum, getFirst,
  safeAggregate, createTimeWindow, createFieldTimeWindow, buildMatchStage, buildGroupStage, buildFacetStage, buildLookupStage, buildSortStage, buildProjectStage, bucketByDay, sumAbs, addPaginationStages, buildBucketStage, buildStatusCountFacet, createFieldTimeWindowEnhanced, buildAggregationPipeline, buildFlexibleMatchStage, validateAnalyticsInput, buildConditionalSum, buildPushArray, buildAddToSetArray
} from '../shared-utils.js';

describe('shared-utils', () => {
  describe('safeObjectId', () => {
    function ObjectId(v) { this._id = v; }
    it('returns ObjectId instance for any non-null value', () => {
      const result = safeObjectId('foo', ObjectId);
      expect(result).toBeInstanceOf(ObjectId);
      expect(result._id).toBe('foo');
      const result2 = safeObjectId(123, ObjectId);
      expect(result2).toBeInstanceOf(ObjectId);
      expect(result2._id).toBe(123);
    });
    it('returns null for null/undefined', () => {
      expect(safeObjectId(null, ObjectId)).toBeNull();
      expect(safeObjectId(undefined, ObjectId)).toBeNull();
    });
    it('returns null if ObjectId throws', () => {
      function BadObjectId() { throw new Error('bad'); }
      expect(safeObjectId('bad', BadObjectId)).toBeNull();
    });
  });

  describe('ensureArray', () => {
    it('wraps non-array', () => {
      expect(ensureArray(1)).toEqual([1]);
    });
    it('returns array as is', () => {
      expect(ensureArray([1,2])).toEqual([1,2]);
    });
    it('returns [] for null/undefined', () => {
      expect(ensureArray(null)).toEqual([]);
      expect(ensureArray(undefined)).toEqual([]);
    });
  });

  describe('omitNulls', () => {
    it('removes null/undefined keys', () => {
      expect(omitNulls({ a: 1, b: null, c: undefined, d: 0 })).toEqual({ a: 1, d: 0 });
    });
    it('returns {} for null/undefined', () => {
      expect(omitNulls(null)).toEqual({});
      expect(omitNulls(undefined)).toEqual({});
    });
  });

  describe('buildInMatchStage', () => {
    it('builds $in match for non-empty array', () => {
      expect(buildInMatchStage('foo', [1,2])).toEqual({ $match: { foo: { $in: [1,2] } } });
    });
    it('builds $in match for empty array', () => {
      expect(buildInMatchStage('foo', [])).toEqual({ $match: { foo: { $in: [null] } } });
    });
    it('builds $in match for null/undefined', () => {
      expect(buildInMatchStage('foo', null)).toEqual({ $match: { foo: { $in: [null] } } });
      expect(buildInMatchStage('foo', undefined)).toEqual({ $match: { foo: { $in: [null] } } });
    });
  });

  describe('safeSum', () => {
    it('sums numbers', () => {
      expect(safeSum([1,2,3])).toBe(6);
    });
    it('treats non-numbers as zero', () => {
      expect(safeSum([1,null,2,'a',undefined])).toBe(3);
    });
    it('returns 0 for null/undefined', () => {
      expect(safeSum(null)).toBe(0);
      expect(safeSum(undefined)).toBe(0);
    });
  });

  describe('getFirst', () => {
    it('returns first element', () => {
      expect(getFirst([1,2,3])).toBe(1);
    });
    it('returns undefined for empty/non-array', () => {
      expect(getFirst([])).toBeUndefined();
      expect(getFirst(null)).toBeUndefined();
      expect(getFirst(undefined)).toBeUndefined();
      expect(getFirst('not array')).toBeUndefined();
    });
  });

  describe('safeAggregate', () => {
    it('returns array if input is array', () => {
      expect(safeAggregate([1,2])).toEqual([1,2]);
    });
    it('returns [] for null/undefined/non-array', () => {
      expect(safeAggregate(null)).toEqual([]);
      expect(safeAggregate(undefined)).toEqual([]);
      expect(safeAggregate('foo')).toEqual([]);
    });
  });

  describe('createTimeWindow', () => {
    it('returns $gte for hours', () => {
      const now = Date.now();
      const result = createTimeWindow(2);
      expect(result.$gte).toBeInstanceOf(Date);
      expect(result.$gte.getTime()).toBeLessThanOrEqual(now);
    });
  });

  describe('createFieldTimeWindow', () => {
    it('returns {} if no field', () => {
      expect(createFieldTimeWindow({})).toEqual({});
      expect(createFieldTimeWindow()).toEqual({});
    });
    it('returns $gte for days', () => {
      const result = createFieldTimeWindow({ field: 'foo', days: 1 });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $gte for hours', () => {
      const result = createFieldTimeWindow({ field: 'foo', hours: 1 });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $gte for from', () => {
      const result = createFieldTimeWindow({ field: 'foo', from: '2020-01-01' });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $lte for to', () => {
      const result = createFieldTimeWindow({ field: 'foo', to: '2020-01-01' });
      expect(result.foo.$lte).toBeInstanceOf(Date);
    });
  });

  describe('buildMatchStage', () => {
    it('returns $match with fields', () => {
      expect(buildMatchStage({ a: 1 })).toEqual({ $match: { a: 1 } });
    });
    it('returns $match: {} for null/undefined', () => {
      expect(buildMatchStage()).toEqual({ $match: {} });
    });
  });

  describe('buildGroupStage', () => {
    it('returns $group with _id and aggs', () => {
      expect(buildGroupStage({ a: '$a' }, { total: { $sum: 1 } })).toEqual({ $group: { _id: { a: '$a' }, total: { $sum: 1 } } });
    });
    it('returns $group: { _id: {} } for null/undefined', () => {
      expect(buildGroupStage()).toEqual({ $group: { _id: {} } });
    });
  });

  describe('buildFacetStage', () => {
    it('returns $facet with facets', () => {
      expect(buildFacetStage({ foo: [1] })).toEqual({ $facet: { foo: [1] } });
    });
    it('returns $facet: {} for null/undefined', () => {
      expect(buildFacetStage()).toEqual({ $facet: {} });
    });
  });

  describe('buildLookupStage', () => {
    it('returns $lookup with fields', () => {
      expect(buildLookupStage({ from: 'a', localField: 'b', foreignField: 'c', as: 'd' })).toEqual({ $lookup: { from: 'a', localField: 'b', foreignField: 'c', as: 'd' } });
    });
    it('returns $lookup: {} for null/undefined', () => {
      expect(buildLookupStage()).toEqual({ $lookup: {} });
    });
  });

  describe('buildSortStage', () => {
    it('returns $sort with fields', () => {
      expect(buildSortStage({ a: 1 })).toEqual({ $sort: { a: 1 } });
    });
    it('returns $sort: {} for null/undefined', () => {
      expect(buildSortStage()).toEqual({ $sort: {} });
    });
  });

  describe('buildProjectStage', () => {
    it('returns $project with fields', () => {
      expect(buildProjectStage({ a: 1 })).toEqual({ $project: { a: 1 } });
    });
    it('returns $project: {} for null/undefined', () => {
      expect(buildProjectStage()).toEqual({ $project: {} });
    });
  });

  describe('bucketByDay', () => {
    it('returns $dateToString for field', () => {
      expect(bucketByDay('foo')).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$foo' } });
    });
    it('returns default for null/undefined', () => {
      expect(bucketByDay()).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } });
    });
  });

  describe('sumAbs', () => {
    it('returns $sum $abs for field', () => {
      expect(sumAbs('foo')).toEqual({ $sum: { $abs: '$foo' } });
    });
    it('returns default for null/undefined', () => {
      expect(sumAbs()).toEqual({ $sum: { $abs: '$amount' } });
    });
  });

  describe('addPaginationStages', () => {
    it('appends $skip and $limit', () => {
      expect(addPaginationStages([], { skip: 2, limit: 5 })).toEqual([{ $skip: 2 }, { $limit: 5 }]);
    });
    it('returns array for null/undefined', () => {
      expect(addPaginationStages(null, { skip: 1, limit: 1 })).toEqual([{ $skip: 1 }, { $limit: 1 }]);
    });
    it('defaults limit to 10', () => {
      expect(addPaginationStages([], { skip: 0 })).toEqual([{ $limit: 10 }]);
    });
  });

  describe('buildBucketStage', () => {
    it('returns $bucket with all fields', () => {
      const result = buildBucketStage({ groupBy: '$foo', boundaries: [0,1], default: 'x', output: { count: { $sum: 1 } } });
      expect(result).toEqual({ $bucket: { groupBy: '$foo', boundaries: [0,1], default: 'x', output: { count: { $sum: 1 } } } });
    });
  });

  describe('buildStatusCountFacet', () => {
    it('returns $facet with status counts', () => {
      const facet = buildStatusCountFacet(['a', 'b'], { foo: 1 }, { a: { bar: 2 } });
      expect(facet).toHaveProperty('$facet');
      expect(Object.keys(facet.$facet)).toEqual(['a', 'b']);
      expect(facet.$facet.a[0].$match).toMatchObject({ foo: 1, status: 'a', bar: 2 });
      expect(facet.$facet.b[0].$match).toMatchObject({ foo: 1, status: 'b' });
    });
  });

  describe('createFieldTimeWindowEnhanced', () => {
    it('throws if no field', () => {
      expect(() => createFieldTimeWindowEnhanced({})).toThrow();
    });
    it('returns $gte for days', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', days: 1 });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $gte for months', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', months: 1 });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $gte for years', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', years: 1 });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $gte for from', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', from: '2020-01-01' });
      expect(result.foo.$gte).toBeInstanceOf(Date);
    });
    it('returns $lte for to', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', to: '2020-01-01' });
      expect(result.foo.$lte).toBeInstanceOf(Date);
    });
    it('returns $gt/$lt if inclusive is false', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', from: '2020-01-01', to: '2020-01-02', inclusive: false });
      expect(result.foo.$gt).toBeInstanceOf(Date);
      expect(result.foo.$lt).toBeInstanceOf(Date);
    });
    it('returns $lte for to only', () => {
      const result = createFieldTimeWindowEnhanced({ field: 'foo', to: '2020-01-01' });
      expect(result.foo).toHaveProperty('$lte');
      expect(result.foo.$lte).toBeInstanceOf(Date);
      expect(result.foo).not.toHaveProperty('$gte');
      expect(result.foo).not.toHaveProperty('$gt');
      expect(result.foo).not.toHaveProperty('$lt');
    });
  });

  describe('buildAggregationPipeline', () => {
    it('returns pipeline with all stages', () => {
      const pipeline = buildAggregationPipeline({
        match: { a: 1 },
        groupBy: { b: '$b' },
        aggregations: { total: { $sum: 1 } },
        project: { c: 1 },
        sort: { d: 1 },
        extraStages: [{ $limit: 1 }]
      });
      expect(pipeline).toEqual([
        { $match: { a: 1 } },
        { $group: { _id: { b: '$b' }, total: { $sum: 1 } } },
        { $project: { c: 1 } },
        { $sort: { d: 1 } },
        { $limit: 1 }
      ]);
    });
    it('returns [] for no input', () => {
      expect(buildAggregationPipeline({})).toEqual([]);
    });
  });

  describe('buildFlexibleMatchStage', () => {
    it('merges multiple filters', () => {
      expect(buildFlexibleMatchStage({ a: 1 }, { b: 2 })).toEqual({ $match: { a: 1, b: 2 } });
    });
    it('returns $match: {} for no input', () => {
      expect(buildFlexibleMatchStage()).toEqual({ $match: {} });
    });
  });

  describe('validateAnalyticsInput', () => {
    it('throws if required field missing', () => {
      expect(() => validateAnalyticsInput({ requiredFields: ['foo'] }, {})).toThrow();
    });
    it('throws if dateFields invalid', () => {
      expect(() => validateAnalyticsInput({ dateFields: ['bar'] }, { bar: 'not-a-date' })).toThrow();
    });
    it('does not throw for valid input', () => {
      expect(() => validateAnalyticsInput({ requiredFields: ['foo'], dateFields: ['bar'] }, { foo: 1, bar: '2020-01-01' })).not.toThrow();
    });
  });

  describe('buildConditionalSum', () => {
    it('returns $sum $cond', () => {
      expect(buildConditionalSum(['cond', 1, 0])).toEqual({ $sum: { $cond: ['cond', 1, 0] } });
    });
  });

  describe('buildPushArray', () => {
    it('returns $push', () => {
      expect(buildPushArray({ foo: 1 })).toEqual({ $push: { foo: 1 } });
    });
  });

  describe('buildAddToSetArray', () => {
    it('returns $addToSet', () => {
      expect(buildAddToSetArray('foo')).toEqual({ $addToSet: 'foo' });
    });
  });
}); 