# Guru Loader FP Patterns

This document has been moved to the `docs/patterns` directory and renamed to `guru_loader_fp.md`. Please refer to `docs/patterns/guru_loader_fp.md` for specific patterns related to the Guru-Loader-FP project. 



That’s a thoughtful question!  
Let’s consider **why a designer (or original author) might not have made `model-loader.js` return a context-mergeable object**—and why your proposed approach is actually more modern and maintainable.

---

## **Why the Original Pattern?**

### 1. **Historical/Legacy Reasons**
- Many loader systems were designed before pipelines and functional composition became popular in JavaScript.
- Returning `{ context }` or mutating `context` directly was a common pattern, especially in callback- or class-based systems.

### 2. **Encapsulation**
- Some designers wanted to “hide” the context mutation inside the loader, so the caller didn’t have to worry about merging or updating context.

### 3. **Single Responsibility**
- The loader’s only job was to load and attach resources, not to care about how context is merged or composed.

### 4. **Flexibility for Side Effects**
- Some loaders might need to do more than just return data (e.g., run hooks, log, trigger events), so they mutate context and return `{ context }` as a signal that “work is done.”

---

## **Why the Mergeable Context Pattern is Better Now**

- **Functional programming and pipelines** are now common in modern JS/TS, making context-mergeable returns the norm.
- **Predictability and composability:**  
  Returning a new object (rather than mutating) makes it easier to reason about, test, and compose loaders.
- **No hidden side effects:**  
  You always know what the loader does—no mutation surprises.
- **Easier to use in pipelines:**  
  You can chain loaders without wrappers or adapters.

---

## **What Would a Modern Designer Do?**

- **Most modern designers** (especially in functional or pipeline-based systems) would prefer the context-mergeable pattern.
- It’s more in line with current best practices for composability, testability, and clarity.

---

## **Summary Table**

| Pattern                | Why Used Historically?         | Why Modern Pattern is Better      |
|------------------------|-------------------------------|-----------------------------------|
| Mutate & return `{context}` | Simpler, legacy, side effects | Predictable, composable, testable |
| Return `{...ctx, key}`      | Less common in old code      | Standard in modern FP/pipelines   |

---

**In short:**  
> The original designer may have chosen the mutate-and-return pattern for legacy, simplicity, or encapsulation reasons.  
> But the context-mergeable return is now the best practice for modern, composable loader systems.

If you want, I can help you refactor your loader or write a migration plan for your codebase!






Exactly!  
**You don’t lose much—if anything—by having each loader take a context and return a mergeable context object.** In fact, you gain several advantages:

---

## **What You Gain**

- **Composability:**  
  You can use loaders in a pipeline, call them manually, or mix and match as needed.
- **Predictability:**  
  Every loader has the same contract: input is a context, output is a context-mergeable object.
- **Testability:**  
  Each loader is easy to test in isolation—just pass in a context and check the result.
- **Extensibility:**  
  You can add, remove, or reorder loaders without changing their internal logic.
- **No Wrappers Needed:**  
  You don’t need extra “addStep” wrappers or adapters.

---

## **What You Don’t Lose**

- **Flexibility:**  
  You can still use loaders individually, outside of a pipeline.
- **Partial Loading:**  
  You can run only the loaders you want, in any order.
- **Direct Access:**  
  You can still access the loaded resources directly from the returned context.

---

## **Summary Table**

| Loader Pattern         | Pipeline Ready? | Manual Use? | Testable? | Extensible? | Boilerplate? |
|-----------------------|:---------------:|:-----------:|:---------:|:-----------:|:------------:|
| Returns `{ ...ctx, key }` |      Yes        |     Yes      |   Yes     |    Yes      |     Low      |

---

## **In short:**  
> **You lose nothing and gain a lot by standardizing loaders to take a context and return a mergeable context object.**

This is a modern, best-practice pattern for loader systems in JavaScript/TypeScript projects.

If you want, I can help you refactor all your loaders to this pattern, or show you how to write tests for them!



Great follow-up!  
If **each loader now returns a context-mergeable object** (e.g., `{ ...ctx, models: ... }`), then the function you posted:

```js
export const createLoaders = (options = {}) => ({
  env: createEnvLoader(options),
  db: createDbLoader(options),
  // ...
  models: createModelLoader(options),
  // ...
});
```

**returns an object where each property is a loader function** (already initialized with options).

---

## **How does this work now?**

### **Each loader function:**
- Accepts a context object as its only argument.
- Returns a new context-mergeable object with its resource attached.

### **Example Usage:**

```js
const loaders = createLoaders(options);

let ctx = { logger: console, config: {} };

ctx = await loaders.env(ctx);      // returns { ...ctx, env: ... }
ctx = await loaders.db(ctx);       // returns { ...ctx, db: ... }
ctx = await loaders.models(ctx);   // returns { ...ctx, models: ... }
ctx = await loaders.actions(ctx);  // returns { ...ctx, actions: ... }
// ...and so on
```

- You can call each loader in any order, passing the context from one to the next.
- Each call returns a new context object with the new resource merged in.

---

## **What does this enable?**

- **Manual composition:**  
  You can run only the loaders you want, in any order, and build up your context step by step.
- **Partial loading:**  
  You can load just models, or just actions, or any subset you need.
- **Testability:**  
  You can test each loader in isolation, or test combinations.

---

## **Comparison to Pipeline**

- In a pipeline, you’d do:
  ```js
  const pipeline = pipeAsync(
    loaders.env,
    loaders.db,
    loaders.models,
    loaders.actions,
    // ...
  );
  const context = await pipeline({ logger: console, config: {} });
  ```
- With the object, you can do the same thing manually, or use the object to build your pipeline dynamically.

---

## **Summary Table**

| Pattern                | How to Use                              | What You Get                        |
|------------------------|-----------------------------------------|-------------------------------------|
| Object of loader fns   | `ctx = await loaders.models(ctx)`       | New context with `models`           |
| Pipeline               | `pipeAsync(...loaders...)(ctx)`         | Final context with all resources    |

---

**In short:**  
- `createLoaders` now gives you a registry of context-mergeable loader functions.
- You can compose them however you want—manually, in a pipeline, or selectively.

Let me know if you want a code example for a specific use case or want to see how to build a pipeline from this object!


Great question!  
If you **don’t use the loader in a pipeline**—that is, you call it directly—**it still works just as well**. You just need to provide a context object, and you’ll get back a new context object with the models attached.

---

## **Example: Using the Loader Directly**

### **1. Prepare your context**
```js
const ctx = {
  logger: console,
  config: {},
  // ...any other properties your loader expects
};
```

### **2. Call the loader**
```js
import { modelLoader } from './loaders/model-loader.js';

const newCtx = await modelLoader(ctx);
```

### **3. Use the result**
```js
console.log(newCtx.models);
// Output: { User: <UserModel>, Post: <PostModel> }
```

- `newCtx` will have all the properties of your original `ctx`, plus a `models` property containing the loaded models.

---

## **Why is this good?**

- **Consistency:**  
  The loader always returns a context-mergeable object, whether used in a pipeline or standalone.
- **Flexibility:**  
  You can use the loader in tests, scripts, or anywhere you need to load models, not just in your app’s boot pipeline.
- **Predictability:**  
  You always know what the output will look like.

---

## **Summary Table**

| Usage Style         | How to Use                              | What You Get                        |
|---------------------|-----------------------------------------|-------------------------------------|
| In pipeline         | `pipeAsync(..., modelLoader, ...)`      | Context passed to next step         |
| Standalone/direct   | `await modelLoader(ctx)`                | New context object with `models`    |

---

**In short:**  
You can use the loader directly, outside of a pipeline, by passing it a context object.  
It will return a new context object with the loaded models, just as it would in a pipeline.

Let me know if you want a code snippet for a specific use case!