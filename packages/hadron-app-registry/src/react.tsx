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
export const AppRegistryProvider: React.FunctionComponent<{
  appRegistry?: AppRegistry;
  cleanUpOnUnmount?: boolean;
}> = ({ children, appRegistry, cleanUpOnUnmount = true }) => {
  const cleanUpOnUnmountRef = useRef(cleanUpOnUnmount);
  const globalAppRegistry = useGlobalAppRegistry();
  const isTopLevelProvider = useContext(LocalAppRegistryContext) === null;
  const [localAppRegistry] = useState(() => {
    return (
      appRegistry ??
      (isTopLevelProvider ? globalAppRegistry : new AppRegistry())
    );
  });

  useEffect(() => {
    const shouldCleanUp = cleanUpOnUnmountRef.current;
    return () => {
      if (shouldCleanUp) {
        localAppRegistry.cleanup();
      }
    };
  }, [globalAppRegistry, localAppRegistry]);

  return (
    <GlobalAppRegistryContext.Provider value={globalAppRegistry}>
      <LocalAppRegistryContext.Provider value={localAppRegistry}>
        {children}
      </LocalAppRegistryContext.Provider>
    </GlobalAppRegistryContext.Provider>
  );
};

type RegistryOptions = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
};

type HadronPluginConfig<T> = {
  name: string;
  component: React.ComponentType<T>;
  onActivated: (options: RegistryOptions & T) => {
    store: Store;
    actions?: Actions;
  };
  onDeactivated: (options: RegistryOptions) => void;

  /** Only for plugins that are used as roles */
  roleName?: string;
  order?: number;
};

function isReduxStore(store: any): store is ReduxStore {
  return Object.prototype.hasOwnProperty.call(store, 'dispatch');
}

export function registerHadronPlugin<T>(config: HadronPluginConfig<T>) {
  const Component = config.component;
  const registryName = `${config.name}.Plugin`;
  const HadronPlugin: React.FunctionComponent<T> = (props) => {
    const globalAppRegistry = useGlobalAppRegistry();
    const localAppRegistry = useLocalAppRegistry();

    const [{ store, actions }] = useState(() => {
      return (
        localAppRegistry.getPlugin(registryName) ??
        (() => {
          const plugin = config.onActivated({
            globalAppRegistry,
            localAppRegistry,
            ...props,
          });
          localAppRegistry.registerPlugin(registryName, {
            ...plugin,
            onDeactivated: config.onDeactivated,
          });
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
