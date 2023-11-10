import React, { useRef, useState } from 'react';
import type { Store as RefluxStore } from 'reflux';
import { Provider as ReduxStoreProvider } from 'react-redux';
import type { Actions } from './actions';
import { type Store, type AppRegistry, isReduxStore } from './app-registry';
import { useGlobalAppRegistry, useLocalAppRegistry } from './react-context';

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
    actions?: typeof Actions;
    /**
     * Will be called to clean up plugin subscriptions when it is deactivated by
     * app registry scope
     */
    deactivate: () => void;
  };
};

export type HadronPluginComponent<T> = React.FunctionComponent<T> & {
  displayName: string;
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
>(config: HadronPluginConfig<T, S>, services?: S): HadronPluginComponent<T> {
  const Component = config.component;
  const registryName = `${config.name}.Plugin`;

  return Object.assign(
    (props: React.PropsWithChildren<T>) => {
      const globalAppRegistry = useGlobalAppRegistry();
      const localAppRegistry = useLocalAppRegistry();

      const serviceImpls = Object.fromEntries(
        Object.entries(services ?? {}).map(([key, service]) => {
          try {
            return [key, service()];
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

      const [{ store, actions }] = useState(
        () =>
          localAppRegistry.getPlugin(registryName) ??
          (() => {
            const plugin = config.activate(props, {
              globalAppRegistry,
              localAppRegistry,
              ...serviceImpls,
            });
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
    },
    {
      displayName: config.name,
    }
  );
}
