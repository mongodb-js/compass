import React, { useContext, useRef, useState } from 'react';
import type { Store as RefluxStore } from 'reflux';
import { Provider as ReduxStoreProvider } from 'react-redux';
import type { Actions } from './actions';
import { type Store, AppRegistry, isReduxStore } from './app-registry';
import {
  GlobalAppRegistryContext,
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
} from './react-context';

class ActivateHelpersImpl {
  private cleanupFns = new Set<() => void>();

  on = (
    emitter: {
      on(evt: string, fn: (...args: any) => any): any;
      removeListener(evt: string, fn: (...args: any) => any): any;
    },
    evt: string,
    fn: (...args: any) => any
  ) => {
    emitter.on(evt, fn);
    this.addCleanup(() => {
      emitter.removeListener(evt, fn);
    });
  };

  addCleanup = (fn: () => void) => {
    this.cleanupFns.add(fn);
  };

  cleanup = () => {
    for (const fn of this.cleanupFns.values()) {
      fn();
    }
  };
}

export type ActivateHelpers = Pick<
  ActivateHelpersImpl,
  'on' | 'addCleanup' | 'cleanup'
>;

function LegacyRefluxProvider({
  store,
  actions,
  children,
}: {
  store: Partial<RefluxStore>;
  actions?: Partial<typeof Actions>;
  children: React.ReactElement;
}) {
  const storeRef = useRef(store);
  const [state, setState] = React.useState(() => {
    return storeRef.current.state;
  });

  React.useEffect(() => {
    const unsubscribe = storeRef.current.listen?.(setState, null);
    return () => unsubscribe?.();
  }, []);

  return React.cloneElement(
    // There is a ton of issues with cloning children like that,
    // this is a legacy piece of code that we know works in our cases and so we
    // can ignore ts errors instead of handling all corner-cases
    children,
    // There is no single pattern to how reflux is used by plugins, sometime
    // store is passed directly, sometimes only state, sometimes actions are
    // passed as a single prop, sometimes spreaded, sometimes all the approaches
    // are mixed and used like that in the plugins. Reflux is legacy that we
    // prefer to not spend time cleaning up so we're just trying to cover all
    // the cases here as much as possible
    { store, actions, ...actions, ...state }
  );
}

type Registries = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
};

type Services<S extends Record<string, () => unknown>> = {
  [SvcName in keyof S]: ReturnType<S[SvcName]>;
};

export type HadronPluginConfig<T, S extends Record<string, () => unknown>> = {
  name: string;
  component: React.ComponentType<T>;
  /**
   * Plugin activation method, will receive any props passed to the component,
   * and global and local app registry instances to subscribe to any relevant
   * events. Should return plugin store and an optional deactivate method to
   * clean up subscriptions or any other store-related state
   */
  activate: (
    initialProps: T,
    services: Registries & Services<S>,
    helpers: ActivateHelpers
  ) => {
    /**
     * Redux or reflux store that will be automatically passed to a
     * corresponding provider
     */
    store: Store;
    /**
     * Optional, only relevant for plugins still using reflux
     */
    actions?: typeof Actions;
    /**
     * Will be called to clean up plugin subscriptions when it is deactivated by
     * app registry scope
     */
    deactivate: () => void;
  };
};

type MockOptions = {
  pluginName: string;
  mockedEnvironment: boolean;
  mockServices: Record<string, unknown>;
  disableChildPluginRendering: boolean;
};

const defaultMockOptions = {
  pluginName: '$$root',
  mockedEnvironment: false,
  mockServices: {},
  disableChildPluginRendering: false,
};

const MockOptionsContext = React.createContext<MockOptions>(defaultMockOptions);

const useMockOption = <T extends keyof MockOptions>(key: T): MockOptions[T] => {
  return useContext(MockOptionsContext)[key];
};

export type HadronPluginComponent<
  T,
  S extends Record<string, () => unknown>
> = React.FunctionComponent<T> & {
  displayName: string;
  /**
   * Convenience method for testing: allows to override services and app
   * registries available in the plugin context
   *
   * @example
   * const PluginWithLogger = registerHadronPlugin({ ... }, { logger: loggerLocator });
   *
   * const MockPlugin = PluginWithLogger.withMockServices({ logger: Sinon.stub() });
   *
   * @param mocks Overrides for the services locator values and registries
   *              passed to the plugin in runtime. When `globalAppRegistry`
   *              override is passed, it will be also used for the
   *              localAppRegistry override unless `localAppRegistry` is also
   *              explicitly passed as a mock service.
   */
  withMockServices(
    mocks: Partial<Registries & Services<S>>,
    options?: Partial<Pick<MockOptions, 'disableChildPluginRendering'>>
  ): React.FunctionComponent<T>;
};

/**
 * Creates a hadron plugin that will be automatically activated on first render
 * and cleaned up when localAppRegistry unmounts
 *
 * @param config Hadron plugin configuration
 * @param services Map of service locator functions that plugin depends on
 *
 * @returns Hadron plugin component
 *
 * @example
 * const CreateCollectionPlugin = registerHadronPlugin({
 *   name: 'CreateCollection',
 *   component: CreateCollectionModal,
 *   activate(opts, { globalAppRegistry }) {
 *     const store = configureStore(...);
 *     const openCreateCollectionModal = (ns) => {
 *       store.dispatch(openModal(ns));
 *     }
 *     globalAppRegistry.on('create-collection', openCreateCollectionModal);
 *     return {
 *       store,
 *       deactivate() {
 *         globalAppRegistry.removeEventListener(
 *           'create-collection',
 *           openCreateCollectionModal
 *         );
 *       }
 *     }
 *   }
 * });
 *
 * @example
 * // app.js
 * import CompassLogging from '@mongodb-js/compass-logging';
 * import { LoggingProvider } from '@mongodb-js/compass-logging/provider';
 *
 * ReactDOM.render(
 *   <LoggingProvider service={CompassLogging}>
 *     <PluginWithLogger />
 *   </LoggingProvider>
 * )
 *
 * // plugin.js
 * import { logging } from '@mongodb-js/compass-logging/provider'
 *
 * const PluginWithLogger = registerHadronPlugin({
 *   name: 'LoggingPlugin',
 *   component: () => null,
 *   activate(opts, { logging }) {
 *     loggging.log('Plugin activated!');
 *   }
 * }, { logging })
 */
export function registerHadronPlugin<
  T,
  S extends Record<string, () => unknown>
>(config: HadronPluginConfig<T, S>, services?: S): HadronPluginComponent<T, S> {
  const Component = config.component;
  const registryName = `${config.name}.Plugin`;
  const Plugin = (props: React.PropsWithChildren<T>) => {
    const isMockedEnvironment = useMockOption('mockedEnvironment');
    const mockedPluginName = useMockOption('pluginName');
    const disableRendering = useMockOption('disableChildPluginRendering');
    const mockServices = useMockOption('mockServices');

    const globalAppRegistry = useGlobalAppRegistry();
    const localAppRegistry = useLocalAppRegistry();

    // This can only be true in test environment when parent plugin is setup
    // with mock services. We allow parent to render, but any other plugin
    // that would try to render afterwards will just return `null` avoiding
    // the need for providing services for child plugins
    if (
      isMockedEnvironment &&
      mockedPluginName !== config.name &&
      disableRendering
    ) {
      return null;
    }

    const serviceImpls = Object.fromEntries(
      Object.keys({
        ...(isMockedEnvironment ? mockServices : {}),
        ...services,
      }).map((key) => {
        try {
          return [
            key,
            isMockedEnvironment && mockServices?.[key]
              ? mockServices[key]
              : services?.[key](),
          ];
        } catch (err) {
          if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof err.message === 'string'
          )
            err.message += ` [locating service '${key}' for '${registryName}']`;
          throw err;
        }
      })
    ) as Services<S>;

    // We don't actually use this hook conditionally, even though eslint rule
    // thinks so: values returned by `useMock*` hooks are constant in React
    // runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [{ store, actions }] = useState(
      () =>
        localAppRegistry.getPlugin(registryName) ??
        (() => {
          const plugin = config.activate(
            props,
            {
              globalAppRegistry,
              localAppRegistry,
              ...serviceImpls,
            },
            new ActivateHelpersImpl()
          );
          localAppRegistry.registerPlugin(registryName, plugin);
          return plugin;
        })()
    );

    if (isReduxStore(store)) {
      return (
        <ReduxStoreProvider store={store}>
          <Component {...props}></Component>
        </ReduxStoreProvider>
      );
    }

    return (
      <LegacyRefluxProvider store={store} actions={actions}>
        <Component {...props}></Component>
      </LegacyRefluxProvider>
    );
  };
  return Object.assign(Plugin, {
    displayName: config.name,
    withMockServices(
      mocks: Partial<Registries & Services<S>>,
      options?: Partial<Pick<MockOptions, 'disableChildPluginRendering'>>
    ): React.FunctionComponent<T> {
      const {
        // In case globalAppRegistry mock is not provided, we use the one
        // created in scope so that plugins don't leak their events and
        // registered metadata on the globalAppRegistry
        globalAppRegistry = new AppRegistry(),
        // If localAppRegistry is not explicitly provided, use the passed mock
        // for global app registry instead
        localAppRegistry = globalAppRegistry,
        ...mockServices
      } = mocks;
      // These services will be passed to the plugin `activate` method second
      // argument
      const mockOptions = {
        ...defaultMockOptions,
        mockedEnvironment: true,
        pluginName: config.name,
        mockServices,
        ...options,
      };
      return function MockPluginWithContext(props: T) {
        return (
          <MockOptionsContext.Provider value={mockOptions}>
            <GlobalAppRegistryContext.Provider value={globalAppRegistry}>
              <AppRegistryProvider localAppRegistry={localAppRegistry}>
                <Plugin {...(props as any)}></Plugin>
              </AppRegistryProvider>
            </GlobalAppRegistryContext.Provider>
          </MockOptionsContext.Provider>
        );
      };
    },
  });
}
