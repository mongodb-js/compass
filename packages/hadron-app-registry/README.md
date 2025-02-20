# hadron-app-registry

## Concepts

> [!IMPORTANT]
> Use a plugin instead of a regular component for self-contained parts of
> the application which may need to keep state beyond the raw React
> component's lifetime.

Compass uses a special form of React components referred to as **Plugins**,
distinguished from regular components in that they:

- Maintain state that can persist beyond their React component's lifetime
- Use a custom dependency injection mechanism for consuming dependencies that
  are used when initializing the plugin state

These dependencies are generally referred to as **Services**. For example,
logging or telemetry in Compass are generally consumed by plugins as a
service.

Compass uses a concept of scopes called **App Registries**. Currently, there
are two levels of nesting:

- The global app registry, global in the sense of being a per-browser-window
  singleton
- A local app registry, where "local" currently means scoped to a single tab
  (not a technical restriction, just a convention).

The lifetime of a plugin's state is not tied to the lifetime of their React
component, but rather to the lifetime of the local app registry (or the global
one, if there is none).

> [!TIP]
> Most plugins in Compass use a **Redux store** to keep track of their state.
> Some legacy plugins may still use **Reflux** or a similar mechanism where the
> state is provided to the top-level component of the plugin as a plain object.

Other than tracking plugin lifetimes, app registries provide a communication
channel between plugins by being event emitters.
If possible, new code should avoid this communication channel, as it is untyped
and the specific method of passing messages should be an implementation detail.
Alternative methods of passing messages between plugins include using React
contexts to provide an API that can be used by nested plugins, or if that is
not possible, your plugin can expose methods that other plugins can then access.
(`WorkspacesServiceProvider` is currently an example of this pattern.)

## Usage

For details on the usage of individual components or functions, refer to
doc comments in the package itself.

```tsx
import {
  globalAppRegistry,
  AppRegistry,
  AppRegistryProvider,
  registerHadronPlugin,
} from 'hadron-app-registry';
import CompassLogging from '@mongodb-js/compass-logging';
import {
  LoggingProvider,
  loggingLocator,
} from '@mongodb-js/compass-logging/provider';

const PluginWithLogger = registerHadronPlugin(
  {
    name: 'LoggingPlugin',
    component: function () {
      return <>...</>;
    },
    activate(opts, { logging }) {
      logging.log('Plugin activated!');
    },
  },
  { logging: loggingLocator }
);

ReactDOM.render(
  <AppRegistryProvider>
    <LoggingProvider>
      <PluginWithLogger />
    </LoggingProvider>
  </AppRegistryProvider>
);
```

## Writing a service

Services are consumed by plugins through **service locators**, which are
functions that return the instance of the service that the plugin is
intended to use.

Typically, these functions are implemented using React contexts.

```typescript
import { createServiceLocator } from 'hadron-app-registry';

const ConnectionStorageContext = createContext<ConnectionStorage | null>(null);

function useConnectionStorageContext(): ConnectionStorage {
  const connectionStorage = useContext(ConnectionStorageContext);
  if (!connectionStorage) {
    throw new Error('...');
  }
  return connectionStorage;
}

export const ConnectionStorageProvider = ConnectionStorageContext.Provider;
export const connectionStorageLocator = createServiceLocator(
  useConnectionStorageContext,
  'connectionStorageLocator'
);
```

> [!TIP]
> If you need to use a service locator from inside a provider component, for
> example because your service depends on another service, you can use the
> `createServiceProvider()` method to achieve this. Otherwise, service locators
> can only be called by plugins during their initial activation.

## Writing plugins

Plugins consist of:

- A name that identifies the plugin
- A top-level React component that serves as the plugin's React entry point
- An `activate` function that is called before the plugin is first rendered
  and which creates a (Redux) store for maintaining plugin state.

The `activate` function is expected to also return a cleanup function that
is called when the lifetime of the plugin ends (i.e. the local app registry
associated with it is destroyed). In order to make this easier, helpers are
provided that automatically register cleanup functions:

```js
const Plugin = registerHadronPlugin({
  name: 'TestPlugin',
  component: TestPluginComponent,
  activate(props, services, { on, addCleanup, cleanup }) {
    const store = configureStore();

    // Automatically removes event listeners when plugin is deactivated
    on(someEventEmitter, 'some-event', () => ...);
    addCleanup(() => { ... });

    return { store, deactivate: cleanup };
  }
}, { /* services */});
```

> [!NOTE]
> The `props` and `services` parameters reflect the React properties passed
> to the plugin (`Plugin` in the example above) at the time of the first
> instantiation and the services returned by the service locators at that time;
> changes to the values returned from these will not have an effect on the
> already-instantiated plugin.

## Testing support

For easier testing, plugins can be rendered with fixed services that are not
looked up through the usual service locators. Additionally, the rendering of
child plugins can be disabled, which can be used to speed up tests or avoid
having to specify service dependencies for those child plugins.

```tsx
import {
  render,
  cleanup,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';

const PluginWithMockServices = WorkspacesPlugin.withMockServices(
  {
    dataService: sinon.stub(),
  },
  { disableChildPluginRendering: true }
);

return render(<PluginWithMockServices />);
```
