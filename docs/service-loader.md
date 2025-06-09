# Service Loader Guide

## Overview

The Service Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting service modules into your application context. Service modules typically provide integrations with external APIs (e.g., Redis, Stripe, Spotify, Axios clients) and should be context-aware singletons.

---

## What Does a `.service.js` File Look Like?

**Every `.service.js` file must export a default factory function** that receives context (e.g., `{ services, config }`) and returns an object with at least:
- `name`: a unique string key for the service
- `service`: the singleton instance or object with methods

### Minimal Template

```js
// my-service.service.js
export default ({ services, config }) => ({
  name: 'myService',
  service: {
    async doSomething() {
      // ...
    }
  }
});
```

### Realistic Example: Redis Service

```js
import { createClient } from 'redis';
import { createBaseService, withMethods } from '../base.js';

const redisMethods = {
  async get(key) { return await this.client.get(key); },
  async set(key, value, options = {}) { return await this.client.set(key, value, options); },
  async del(key) { return await this.client.del(key); },
  async exists(key) { return await this.client.exists(key); },
  async getLatency() {
    const start = Date.now();
    await this.client.ping();
    return Date.now() - start;
  }
};

const createRedisService = ({ config }) => {
  let client = null;
  const baseService = createBaseService('redis', {
    initializeFn: async () => {
      client = createClient({
        url: `redis://${config.REDIS_HOST || 'localhost'}:${config.REDIS_PORT || 6379}`,
        database: config.REDIS_DB || 0
      });
      client.on('error', (err) => console.error('Redis Client Error:', err));
      client.on('connect', () => console.log('Redis Client Connected'));
      await client.connect();
      baseService.client = client;
    },
    shutdownFn: async () => { if (client) { await client.quit(); client = null; } },
    healthCheckFn: async () => {
      try {
        const ping = await client.ping();
        return {
          status: ping === 'PONG' ? 'ok' : 'error',
          latency: await baseService.getLatency()
        };
      } catch (error) {
        return { status: 'error', error: error.message };
      }
    }
  });
  return {
    name: 'redis',
    service: withMethods(redisMethods)(baseService)
  };
};

export default createRedisService;
```

---

## Loader Expectations & Context Structure

- The loader will call the default export with context and expect an object like:
  ```js
  { name: 'serviceName', service: { ...methods... } }
  ```
- The loader will register the singleton at `context.services[serviceName]`:
  ```js
  context.services = {
    redis: { ...methods... },
    stripe: { ...methods... },
    // ...
  }
  ```
- Duplicate names will be warned and the last one wins.

### Usage Example

```js
// In your app, after loading:
const { services } = context;
await services.redis.set('foo', 'bar');
const value = await services.redis.get('foo');
await services.stripe.charge(...);
```

### Summary Table

| Context Key           | Value Type         | Example Usage                |
|----------------------|-------------------|------------------------------|
| `context.services`   | Object            | `context.services.redis.get(...)` |
| `context.services`   | Object            | `context.services.stripe.charge(...)` |

---

## Best Practices
- Always use a factory function as the default export.
- Use the injected `config` and `services` for all environment and dependency needs.
- Document your service methods for maintainability.
- Avoid direct imports of other services; always use the injected context.
- If you need to export helpers, do so as named exports (not default).

---

## Summary
- `.service.js` files must export a context-aware factory as default.
- The loader will inject context and register the service singleton at `context.services[serviceName]`.
- This pattern ensures modular, testable, and scalable service integration, and enables ergonomic usage like `context.services.redis.get(...)`. 