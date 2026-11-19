## Compass Specifics

Compass runs in [Electron desktop](./packages/compass/src/app/components/entrypoint.tsx) and [the browser](./packages/compass-web/src/entrypoint.tsx). Shared feature code must work in the browser. Keep Node, Electron, IPC, and other runtime-specific behavior in entry points or runtime-specific services. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup; use `npm run start` for desktop or `npm run start-web` for the browser sandbox.

Compass follows the [Redux Style Guide](https://redux.js.org/style-guide/) with two exceptions:

### Compass doesn't use a single Redux store to manage the whole application state

A feature module (called a plugin in the code) owns its UI, state, and business logic. Start at its public entry point and follow `registerCompassPlugin` to `activate`, the store, and the service locators. See [Aggregations](./packages/compass-aggregations/src/index.ts) for an example.

Each Redux-backed plugin instance has its own store. Two tabs can have independent instances, and plugin state can outlive a component mount. Tie subscriptions and resources to the app registry lifecycle with the activation helpers (`on`, `addCleanup`, `cleanup`), not a module-level singleton. See the [app registry guide](./packages/compass-app-registry/README.md).

### Use `connect` instead of Redux hooks inside feature modules

Use `connect` rather than `useSelector` or `useDispatch` inside a feature module. A connected wrapper passes data and actions as props so the view doesn't need to know about Redux. A module can expose a purpose-built hook to its consumers without exposing its store.

```ts
export default connect((state: RootState) => ({
  items: state.items,
}))(ItemList);
```

### Service scope and public package boundaries

- Check what the plugin's position in the provider tree makes available: all connections > all workspaces > workspace > connection > database > collection. A workspace-level plugin can't resolve a collection-level service.
- Declare locators at plugin registration and use the injected services through thunk extra arguments. Don't reach for a global service or a component hook to work around a missing provider.
- Use public providers, hooks, actions, or services to cross module boundaries. Check the package's `exports` and `compass:exports`; use an existing `/provider` entry point when you only need the service (see [#8011](https://github.com/mongodb-js/compass/pull/8011)). Avoid deep imports into another plugin and prefer typed APIs over new untyped app-registry events.
- Give shared data one owner. If another plugin needs access, expose an interface rather than moving or duplicating the state. For example, [the folder-state review](https://github.com/mongodb-js/compass/pull/8671#discussion_r4522831893) asks why sidebar-only state would belong to the connections plugin. For new features, identify the state owner, events, services, and lifetime before implementing. Don't copy legacy patterns or broaden a small fix into a store rewrite.
- For new structured logs, use `mongoLogId` and run `npm run check-logids` for the next available ID.

### Shared components should have a single look and feel

Start with [compass-components](./packages/compass-components/README.md), its LeafyGreen components, and theme tokens rather than hardcoded colors. Don't add props or configuration to a shared component for a one-off visual change. If the design system can't express what the feature needs, raise the gap instead of hiding it in a styling override.

## Best practices

### Comments

- Explain non-obvious constraints or rejected alternatives. For a workaround, link to the source that explains why it's needed.
- Track follow-up work with a ticket and what remains: `TODO(COMPASS-1234): ...`.

### Respect component and dependency public APIs

Use documented props and extension points, including `className` or `style` when provided. Don't target undocumented CSS classes or internal DOM structure (for example, `& pre` inside LeafyGreen's `Code` component); those details can change when a dependency updates.

### Testing

#### Running tests

From the repo root, run a known failing Mocha case by passing a workspace-relative spec path and a title filter:

```sh
npm test -w packages/compass-indexes -- src/modules/namespace.spec.ts --grep='returns the default state' --bail --forbid-only --fail-zero
```

- Keep `--grep='pattern'` as one argument with `=`: the shared Mocha config treats bare arguments as spec paths. `--fail-zero` catches a filter that matches no tests.
- Once the case passes, drop the filter to run the spec, then run the workspace suite. For changes to public APIs, shared components, services, or runtimes, test affected consumers too. For broad changes, `npm run test-changed` runs changed workspaces and their dependents relative to `origin/HEAD`; root `npm test` runs the monorepo.
- Check the workspace's scripts before passing Mocha flags. Use `test-electron` where Electron is required. The [e2e runner](./packages/compass-e2e-tests/README.md) expects built workspace dependencies and uses its own flags.
- For runtime or experiment changes, check whether PR CI exercises the affected environment with any relevant flag enabled. If not, run the corresponding local or Evergreen task.

#### Testing components, not the store

Follow the [Redux](https://redux.js.org/usage/writing-tests#guiding-principles) and [Testing Library](https://testing-library.com/docs/guiding-principles) guiding principles. Prefer rendering React and Redux together and asserting what the user sees or can do, not the store's shape, selector calls, or hook usage. Use [testing-library-compass](./configs/testing-library-compass/README.md) (`createPluginTestHelpers` or `renderWithActiveConnection` as needed), semantic queries, and `userEvent`. Don't use `data-testid` in application logic.

- Stub external services at their boundary, not the store or selectors. Use focused unit tests for pure algorithms or edge cases that are difficult to reach through the UI. Make sure a regression test fails for the intended reason before the fix.
- For a sizable feature, add or extend a happy-path [end-to-end test](./packages/compass-e2e-tests/README.md). Set feature flags explicitly. Exercise the packaged app through `CompassBrowser` and its page objects, and wait for a user-visible result rather than a fixed delay. Don't add production hooks solely for e2e tests.

### React

- Handle user actions in event handlers. Use effects to synchronize with external systems, with cleanup as needed. See [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).
- Don't mirror props into state. A `default*` prop sets the initial value; use a controlled prop if changes to that prop should take effect after mount.
- Preserve reference identity where a consumer relies on it, such as props passed to a memoized child or values selected by `connect`. For example, `activeItems: state.items.filter(...)` returns a new array on every evaluation and defeats shallow comparison for that prop. Use a memoized selector or pass the stable `items` reference and derive the filtered list in the component.

### Redux

- Keep state minimal and organize it around domain data, not components. Normalize relational data by ID to keep updates granular. Derive values in selectors or render instead of storing copies.
- Reducers own the state shape and calculate synchronous transitions. Model actions as events (`indexCreationFailed`, not `setError`); let slices respond to the same event rather than dispatching a chain of setters. Put orchestration, async work, and service calls in thunks rather than in components.

#### Not all state belongs in Redux

Use the feature store when several consumers need the same state, when the feature needs to cache fetched data, or when state must outlive a component mount. Keep transient state local when only one component cares about it. If local `useReducer` starts coordinating feature state or services, reconsider where that logic belongs. See the [Redux state organization FAQ](https://redux.js.org/faq/organizing-state#do-i-have-to-put-all-my-state-into-redux-should-i-ever-use-reacts-usestate-or-usereducer).

## MongoDB Specifics

### Performance antipatterns

- Check the cost of `db.stats()` on frequently executed paths, especially [`dbStats` with `freeStorage: 1`](https://www.mongodb.com/docs/manual/reference/command/dbStats/), which can cause processing delays.

## Commits and pull requests

Follow [COMMIT_MESSAGES.md](./COMMIT_MESSAGES.md) when drafting commit messages or pull requests.
