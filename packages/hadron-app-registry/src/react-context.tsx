import React, {
  createContext,
  useEffect,
  useRef,
  useContext,
  useState,
} from 'react';
import { globalAppRegistry, AppRegistry } from './app-registry';

/**
 * @internal exported for the mock plugin helper implementation
 */
export const GlobalAppRegistryContext = createContext(globalAppRegistry);

const LocalAppRegistryContext = createContext<AppRegistry | null>(null);

type AppRegistryProviderProps =
  | {
      localAppRegistry?: never;
      deactivateOnUnmount?: never;
      children: React.ReactNode;
      scopeName?: string;
    }
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
       *       appRegistry={getRegistryForTabId(id)}
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
      children: React.ReactNode;
      scopeName?: string;
    };

export function GlobalAppRegistryProvider({
  value,
  children,
}: {
  value?: AppRegistry;
  children?: React.ReactNode;
}) {
  const appRegistry = useRef(value ?? globalAppRegistry).current;
  return (
    <GlobalAppRegistryContext.Provider value={appRegistry}>
      {children}
    </GlobalAppRegistryContext.Provider>
  );
}

export function useIsTopLevelProvider() {
  return useContext(LocalAppRegistryContext) === null;
}

export function AppRegistryProvider({
  children,
  ...props
}: AppRegistryProviderProps) {
  const initialPropsRef = useRef(props);
  const {
    localAppRegistry: initialLocalAppRegistry,
    deactivateOnUnmount = true,
  } = initialPropsRef.current;

  const globalAppRegistry = useGlobalAppRegistry();
  const isTopLevelProvider = useIsTopLevelProvider();
  const [localAppRegistry] = useState(() => {
    return (
      initialLocalAppRegistry ??
      (isTopLevelProvider ? globalAppRegistry : new AppRegistry())
    );
  });

  useEffect(() => {
    // For cases where localAppRegistry was provided by the parent, we allow
    // parent to also take control over the cleanup lifecycle by disabling
    // deactivate call with the `deactivateOnUnmount` prop. Otherwise if
    // localAppRegistry was created by the provider, it will always clean up on
    // unmount
    const shouldDeactivate = initialLocalAppRegistry
      ? deactivateOnUnmount
      : true;
    return () => {
      if (shouldDeactivate) {
        localAppRegistry.deactivate();
      }
    };
  }, [localAppRegistry, initialLocalAppRegistry, deactivateOnUnmount]);

  return (
    <GlobalAppRegistryContext.Provider value={globalAppRegistry}>
      <LocalAppRegistryContext.Provider value={localAppRegistry}>
        {children}
      </LocalAppRegistryContext.Provider>
    </GlobalAppRegistryContext.Provider>
  );
}

export function useGlobalAppRegistry(): AppRegistry {
  return useContext(GlobalAppRegistryContext);
}

export function useLocalAppRegistry(): AppRegistry {
  const appRegistry = useContext(LocalAppRegistryContext);
  if (!appRegistry) {
    throw new Error(`No local AppRegistry registered within this context`);
  }
  return appRegistry;
}
