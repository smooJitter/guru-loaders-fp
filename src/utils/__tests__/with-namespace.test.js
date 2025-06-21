import { describe, it, expect } from '@jest/globals';
import { withNamespace } from '../with-namespace.js';

describe('withNamespace', () => {
  it('wraps functions with namespace and name', () => {
    const actions = {
      create: () => 'created',
      update: () => 'updated'
    };
    const result = withNamespace('post', actions);
    expect(result).toEqual([
      { namespace: 'post', name: 'create', method: actions.create },
      { namespace: 'post', name: 'update', method: actions.update }
    ]);
  });

  it('wraps objects with meta/options', () => {
    const actions = {
      create: { method: () => 'created', meta: { foo: 1 } },
      update: { method: () => 'updated', options: { bar: 2 } }
    };
    const result = withNamespace('post', actions);
    expect(result[0]).toMatchObject({
      namespace: 'post',
      name: 'create',
      method: actions.create.method,
      meta: { foo: 1 }
    });
    expect(result[1]).toMatchObject({
      namespace: 'post',
      name: 'update',
      method: actions.update.method,
      options: { bar: 2 }
    });
  });

  it('handles empty actions object', () => {
    expect(withNamespace('foo', {})).toEqual([]);
  });

  it('skips entries with missing method', () => {
    const actions = {
      create: { meta: { foo: 1 } }, // missing method
      update: { method: () => 'updated' }
    };
    const result = withNamespace('post', actions);
    expect(result[0]).toMatchObject({
      namespace: 'post',
      name: 'create',
      method: undefined,
      meta: { foo: 1 }
    });
    expect(result[1]).toMatchObject({
      namespace: 'post',
      name: 'update',
      method: actions.update.method
    });
  });

  it('handles non-object actions', () => {
    expect(withNamespace('foo', null)).toEqual([]);
    expect(withNamespace('foo', undefined)).toEqual([]);
    expect(withNamespace('foo', 42)).toEqual([]);
    expect(withNamespace('foo', 'bar')).toEqual([]);
  });
}); 