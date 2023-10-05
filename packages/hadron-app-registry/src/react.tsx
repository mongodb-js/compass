import React, { useContext, useEffect, useState, useRef } from 'react';
import type { Store as ReduxStore } from 'redux';
import { Provider as ReduxStoreProvider } from 'react-redux';
import { AppRegistry, globalAppRegistry } from './app-registry';

// TODO: Only while we are mixing redux and reflux stores in the application,
// when reflux is removed, we can type this better
type Store = unknown;

type Actions = Record<string, unknown>;

const LegacyRefluxProvider: React.FunctionComponent<{
  store: Store;
  actions?: Actions;
}> = ({ store, actions, children }) => {
  const storeRef = React.useRef(store);
  const [state, setState] = React.useState(() => {
    return (storeRef.current as any).state;
  });

  React.useEffect(() => {
    return (storeRef.current as any).listen?.(setState);
  }, []);

  return React.cloneElement(
    // @ts-expect-error there is a ton of issues with cloning children like that,
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
};

const GlobalAppRegistryContext = React.createContext(globalAppRegistry);

function useGlobalAppRegistry() {
  return useContext(GlobalAppRegistryContext);
}

const LocalAppRegistryContext = React.createContext<AppRegistry | null>(null);

function useLocalAppRegistry() {
  const localAppRegistry = useContext(LocalAppRegistryContext);
  if (!localAppRegistry) {
    throw new Error(
      'AppRegistryProvider should be in the React component tree to use localAppRegistry'
    );
  }
  return localAppRegistry;
}

/**
 * Provider component that sets content with global app registry and creates a
 * local app registry to accomodate local plugin scoping
 */
export const AppRegistryProvider: React.FunctionComponent<
  | { localAppRegistry?: never; deactiveOnUnmount?: never }
  | {
      /**
       * localAppRegistry to be set in React context. By default will be created
       * when this component renders. Can be used to preserve appRegistry state even
       * if AppRegistryProvider is unmounted
       *
       * @example
       * function CollectionTab({ id }) {
       *   return (
       *     <AppRegistryProvider
       *       localAppRegistry={getRegistryForTabId(id)}
       *       deactivateOnUnmount={false}
       *     >
       *       ...
       *     </AppRegistryProvider>
       *   )
       * }
       */
      localAppRegistry: AppRegistry;

      /**
       * Deactivates all active plugins and remove all event listeners from the app
       * registry when provider unmounts. Default is `true`
       */
      deactivateOnUnmount?: boolean;
    }
> = ({ children, ...props }) => {
  const initialPropsRef = useRef(props);
  const globalAppRegistry = useGlobalAppRegistry();
  const isTopLevelProvider = useContext(LocalAppRegistryContext) === null;
  const [localAppRegistry] = useState(() => {
    return (
      props.localAppRegistry ??
      (isTopLevelProvider ? globalAppRegistry : new AppRegistry())
    );
  });

  useEffect(() => {
    // For cases where localAppRegistry was provided by the parent, we allow
    // parent to also take control over the cleanup lifecycle by disabling
    // deactivate call with the `deactivateOnUnmount` prop. Otherwise if
    // localAppRegistry was created by the provider, it will always clean up on
    // unmount
    const shouldDeactivate = initialPropsRef.current.localAppRegistry
      ? initialPropsRef.current.deactivateOnUnmount ?? true
      : true;
    return () => {
      if (shouldDeactivate) {
        localAppRegistry.deactivate();
      }
    };
  }, [localAppRegistry]);

  return (
    <GlobalAppRegistryContext.Provider value={globalAppRegistry}>
      <LocalAppRegistryContext.Provider value={localAppRegistry}>
        {children}
      </LocalAppRegistryContext.Provider>
    </GlobalAppRegistryContext.Provider>
  );
};

type Registries = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
};

type Services<S extends Record<string, () => unknown>> = {
  [SvcName in keyof S]: ReturnType<S[SvcName]>;
};

type HadronPluginConfig<T, S extends Record<string, () => unknown>> = {
  name: string;
  component: React.ComponentType<T>;
  /**
   * Plugin activation method, will receive any props passed to the component,
   * and global and local app registry instances to subscribe to any relevant
   * events. Should return plugin store and an optional deactivate method to
   * clean up subscriptions or any other store-related state
   */
  activate: (
    options: T,
    services: Registries & Services<S>
  ) => {
    /**
     * Redux or reflux store that will be automatically passed to a
     * corresponding provider
     */
    store: Store;
    /**
     * Optional, only relevant for plugins still using reflux
     */
    actions?: Actions;
    /**
     * Should be used to clean up plugin subscriptions when it is deactivated by
     * app registry scope
     */
    deactivate: () => void;
  };
};

function isReduxStore(store: any): store is ReduxStore {
  return Object.prototype.hasOwnProperty.call(store, 'dispatch');
}

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
 *   activate({ globalAppRegistry }) {
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
 *   activate(_, { logging }) {
 *     loggging.log('Plugin activated!');
 *   }
 * }, { logging })
 */
export function registerHadronPlugin<
  T,
  S extends Record<string, () => unknown>
>(config: HadronPluginConfig<T, S>, services?: S) {
  const Component = config.component;
  const HadronPlugin: React.FunctionComponent<T> = (props) => {
    const globalAppRegistry = useGlobalAppRegistry();
    const localAppRegistry = useLocalAppRegistry();
    const _services = Object.fromEntries(
      Object.entries(services ?? {}).map(([name, locator]) => {
        return [name, locator()];
      })
    ) as Services<S>;

    const [{ store, actions }] = useState(() => {
      return (
        localAppRegistry.getPlugin(config.name) ??
        (() => {
          const plugin = config.activate(props, {
            globalAppRegistry,
            localAppRegistry,
            ..._services,
          });
          localAppRegistry.registerPlugin(config.name, plugin);
          return plugin;
        })()
      );
    });

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
  HadronPlugin.displayName = config.name;
  return HadronPlugin;
}
