# Guru-Loader-FP: Functional, Modular Loader System

Welcome to Guru-Loader-FP—a robust, context-driven loader framework for Node.js/GraphQL apps.
This system enables modular, composable, and testable loading of models, actions, services, typeComposers, features, and more.

---

## 🚀 Quick Start

**At server startup:**

```js
import { buildAppContext } from '../src';

const { createContext, ...baseContext } = await buildAppContext({
  logger: console,
  config: { /* your config */ }
});
```

**For each request:**

```js
const context = createContext({ req });
// context now includes user, requestId, and all loaded registries
```

---

## 🧩 Loader Pipelines

Guru-Loader-FP supports multiple loader pipelines for different environments:

### Full Pipeline (Production/Dev)

```js
import { runLoaderPipeline, fullPipeline } from '../src';

let context = { logger: console, config: { /* ... */ } };
context = await runLoaderPipeline(context, fullPipeline);
```

### Minimal Pipeline (Unit Tests)

```js
import { runLoaderPipeline, minimalPipeline } from '../src';

let context = { logger: console };
context = await runLoaderPipeline(context, minimalPipeline);
```

### Phased Pipeline (Advanced)

```js
import { runLoaderPhases, phasedPipeline } from '../src';

let context = { logger: console, config: { /* ... */ } };
context = await runLoaderPhases(context, phasedPipeline);
```

### Selective Loaders

```js
import { runSelectedLoaders, loaders } from '../src';

let context = { logger: console };
context = await runSelectedLoaders(context, loaders, ['env', 'model', 'action']);
```

---

## 🏗️ How It Works

- **Loader Registry:** Each loader adds its results to a shared context object (e.g., `context.models`, `context.actions`, `context.typeComposers`).
- **Pipeline Order Matters:** Loaders are run in dependency order (e.g., models before typeComposers, actions before features).
- **Per-Request Context:** Only lightweight user/session/request data is added per request.

---

## 📚 Extending & Customizing

- Add your own loaders to the pipeline or registry.
- Use `extraTypeDefs` and `extraResolvers` with the type-loader to extend the GraphQL introspection API.
- Use plugins or phased pipelines for advanced bootstrapping.

---

## 📝 Best Practices

- Keep loaders pure and context-driven.
- Use factory functions for context injection in modules.
- Test each loader type separately.
- Document your custom pipelines and loader patterns.

---

## 📖 See Also

- [type-loader.md](./type-loader.md): Exposing your loader context as a GraphQL API.
- [action-loader.md](./action-loader.md): Modern action loader patterns.
- [feature-loader.md](./feature-loader.md): Feature-based modular loading.
- [docs/index.md](./index.md): Documentation index and coverage standards.

---

**Guru-Loader-FP** makes your app's architecture modular, testable, and ready for scale.
For more patterns and advanced usage, see the docs directory!

---

## 📦 Using guru-loaders-fp as a Private GitHub Package

You can use this package across multiple private or personal repositories by installing it directly from this private GitHub repo.

### Installation in Other Projects

Add to your `package.json` dependencies:

```json
"dependencies": {
  "guru-loaders-fp": "git+ssh://git@github.com:your-username/guru-loaders-fp.git#main"
}
```

Or install directly:

```sh
npm install git+ssh://git@github.com:your-username/guru-loaders-fp.git#main
```

- Replace `your-username` with your GitHub username.
- Use `#main` for the main branch, or `#v1.2.3` for a specific tag.

### Updating the Package

After pushing changes to this repo, update the dependency in consuming projects:

```sh
npm update guru-loaders-fp
```

Or reinstall:

```sh
rm -rf node_modules package-lock.json && npm install
```

### Versioning (Recommended)

Tag stable releases for easier dependency management:

```sh
git tag v1.0.0
git push origin v1.0.0
```

Reference the tag in your dependency:

```json
"guru-loaders-fp": "git+ssh://git@github.com:your-username/guru-loaders-fp.git#v1.0.0"
```

### Security & Authentication

- Only users with access to this private repo can install the package.
- For CI/CD, use SSH deploy keys or GitHub tokens with `repo` scope.
- For HTTPS installs in CI:
  ```sh
  npm install https://<TOKEN>@github.com/your-username/guru-loaders-fp.git
  ``` 