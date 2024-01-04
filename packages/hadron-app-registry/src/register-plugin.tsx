import React, { useContext, useRef, useState } from 'react';
import type { Store as RefluxStore } from 'reflux';
import { Provider as ReduxStoreProvider } from 'react-redux';
import type { Plugin, RefluxActions } from './app-registry';
import { AppRegistry, isReduxStore } from './app-registry';
import {
  GlobalAppRegistryContext,
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
} from './react-context';

class ActivateHelpersImpl {
  private cleanupFns = new Set<() => void>();

  private deactivateController = new AbortController();

  constructor() {
    this.addCleanup(() => {
      this.deactivateController.abort();
    });
  }

  /**
   * A signal for the abort controller that will be aborted when the cleanup
   * method is called. Helpful to be able to abort or check whether or not
   * plugin is still active in async tasks triggered during plugin activate
   * phase
   */
  get signal() {
    return this.deactivateController.signal;
  }

  /**
   * Helper method to subscribe to events on a generic event emitter. Events
   * will be added to the cleanup set and will be cleaned up when `cleanup` is
   * called
   */
  on = (
    emitter: {
      on(evt: string, fn: (...args: any) => any): any;
      removeListener(evt: string, fn: (...args: any) => any): any;
    },
    evt: string,
    fn: (...args: any) => any
  ) => {
    emitter.on(evt, (...args) => void fn(...args));
    this.addCleanup(() => {
      emitter.removeListener(evt, fn);
    });
  };

  /**
   * Add an arbitrary callback to the cleanup set
   */
  addCleanup = (fn: () => void) => {
    this.cleanupFns.add(fn);
  };

  /**
   * Call all the cleanup callbacks. This includes any events listeners set up
   * with an `on` helper and everything that was added with `addCleanup`
   */
  cleanup = () => {
    for (const fn of this.cleanupFns.values()) {
      fn();
    }
  };
}

export type ActivateHelpers = Pick<
  ActivateHelpersImpl,
  'on' | 'addCleanup' | 'cleanup' | 'signal'
>;

export function createActivateHelpers(): ActivateHelpers {
  return new ActivateHelpersImpl();
}

function LegacyRefluxProvider({
  store,
  actions,
  children,
}: {
  store: Partial<RefluxStore>;
  actions?: Partial<RefluxActions>;
  children: React.ReactElement;
}) {
  const storeRef = useRef(store);
  const [state, setState] = useState(() => {
    return storeRef.current.state;
  });

  React.useEffect(() => {
    const unsubscribe = storeRef.current.listen?.(
      (updatedState: Readonly<any>) => setState({ ...updatedState }),
      null
    );
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
  ) => Plugin;
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

function useHadronPluginActivate<T, S extends Record<string, () => unknown>>(
  config: HadronPluginConfig<T, S>,
  services: S | undefined,
  props: T
) {
  const registryName = `${config.name}.Plugin`;
  const isMockedEnvironment = useMockOption('mockedEnvironment');
  const mockServices = useMockOption('mockServices');

  const globalAppRegistry = useGlobalAppRegistry();
  const localAppRegistry = useLocalAppRegistry();

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

  const [{ store, actions, context }] = useState(
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
          createActivateHelpers()
        );
        localAppRegistry.registerPlugin(registryName, plugin);
        return plugin;
      })()
  );

  return { store, actions, context };
}

export type HadronPluginComponent<
  T,
  S extends Record<string, () => unknown>
> = React.FunctionComponent<T> & {
  displayName: string;

  /**
   * Hook that will activate plugin in the current rendering scope without
   * actually rendering it. Useful to set up plugins that are rendered
   * conditionally and have to subscribe to event listeners earlier than the
   * first render in their lifecycle
   *
   * @example
   * const Plugin = registerHadronPlugin(...);
   *
   * function Component() {
   *   Plugin.useActivate();
   *   const [pluginVisible] = useState(false);
   *
   *   // This Plugin component will already have its store set up and listening
   *   // to the events even before rendering
   *   return (pluginVisible && <Plugin />)
   * }
   */
  useActivate(props: T): void;

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
  const Plugin = (props: React.PropsWithChildren<T>) => {
    const isMockedEnvironment = useMockOption('mockedEnvironment');
    const mockedPluginName = useMockOption('pluginName');
    const disableRendering = useMockOption('disableChildPluginRendering');

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

    // We don't actually use this hook conditionally, even though eslint rule
    // thinks so: values returned by `useMock*` hooks are constant in React
    // runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { store, actions, context } = useHadronPluginActivate(
      config,
      services,
      props
    );

    if (isReduxStore(store)) {
      return (
        <ReduxStoreProvider context={context} store={store}>
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
    useActivate: (props: T) => {
      useHadronPluginActivate(config, services, props);
    },
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
