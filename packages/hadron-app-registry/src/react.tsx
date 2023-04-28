import React from 'react';
import { Provider } from 'react-redux';
import { AppRegistry } from './app-registry';

type Store = unknown;

type Actions = unknown;

const LegacyRefluxProvider: React.FunctionComponent<{ store: Store }> = ({
  store,
  children,
}) => {
  const storeRef = React.useRef(store);
  const [state, setState] = React.useState(() => {
    return (storeRef.current as any).state;
  });

  React.useEffect(() => {
    return (storeRef.current as any).listen?.(setState);
  }, []);

  // @ts-expect-error there is a ton of issues with cloning children like that,
  // this is a legacy piece of code that we know works in our cases and so we
  // can ignore ts errors instead of handling all corner-cases
  return React.cloneElement(children, state);
};

export const globalAppRegistry = new AppRegistry();

const GlobalAppRegistryContext = React.createContext(globalAppRegistry);

export const GlobalAppRegistryProvider: React.FunctionComponent = ({
  children,
}) => {
  return (
    <GlobalAppRegistryContext.Provider value={globalAppRegistry}>
      {children}
    </GlobalAppRegistryContext.Provider>
  );
};

export function useGlobalAppRegistry() {
  return React.useContext(GlobalAppRegistryContext);
}

const LocalAppRegistryContext = React.createContext(globalAppRegistry);

export function useLocalAppRegistry() {
  return React.useContext(LocalAppRegistryContext);
}

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
  /**
   * Optional, if not provided, component will unmount, but the store will not
   * be cleaned up
   */
  onDeactivated?: (options: RegistryOptions) => void;
  /** Only for plugins that are used as roles */
  roleName?: string;
  order?: number;
  /** Optional overrides for default store and actions keys */
  storeName?: string;
  actionsName?: string;
};

/**
 * We track the number of times plugin is mounted so that we can activate /
 * deactivate it only once when the last (in most cases the only) instance of
 * the plugin is unmounted. The only place where this behavior is relevant
 */
const appRegistryActivePluginMap = new Map<string, number>();

export function registerHadronPlugin<T>({
  name,
  component: Component,
  onActivated,
  onDeactivated,
  roleName,
  order,
  storeName: _storeName,
  actionsName: _actionsName,
}: HadronPluginConfig<T>) {
  const storeName = _storeName ?? `${name}.Store`;
  const actionsName = _actionsName ?? `${name}.Actions`;
  const HadronPluginComponent: React.FunctionComponent<T> = (props) => {
    const globalAppRegistryRef = React.useRef(useGlobalAppRegistry());
    const parentAppRegistryRef = React.useRef(useLocalAppRegistry());
    const localAppRegistryRef = React.useRef(
      // If parent app registry is global app registry, we are rendering a top
      // level plugin (like home or collection), provide a local (scoped) app
      // registry to the children so that e.g., events can be scoped
      //
      // This means that we only allow one "level" of registry nesting, which is
      // basically the current Compass behavior: `crud` or `aggregations` will use
      // `query-bar` plugin internally, but will actually give them `collection`
      // plugin as a localAppRegistry
      parentAppRegistryRef.current === globalAppRegistryRef.current
        ? new AppRegistry()
        : parentAppRegistryRef.current
    );
    const storeRef = React.useRef<Store>();
    const actionsRef = React.useRef<Actions | undefined>();

    if (!storeRef.current) {
      let store, actions;
      if (appRegistryActivePluginMap.has(name)) {
        store = parentAppRegistryRef.current.getStore(storeName);
        actions = parentAppRegistryRef.current.getAction(actionsName);
        appRegistryActivePluginMap.set(
          name,
          appRegistryActivePluginMap.get(name)! + 1
        );
      } else {
        ({ store, actions } = onActivated({
          globalAppRegistry,
          localAppRegistry: parentAppRegistryRef.current,
          ...props,
        }));
        parentAppRegistryRef.current.registerStore(storeName, store as any);
        parentAppRegistryRef.current.registerAction(actionsName, actions);
        appRegistryActivePluginMap.set(name, 1);
      }
      storeRef.current = store;
      actionsRef.current = actions;
    }

    React.useEffect(() => {
      return () => {
        // TODO: this can be handled better
        if (appRegistryActivePluginMap.get(name) === 1) {
          if (onDeactivated) {
            onDeactivated({
              globalAppRegistry,
              localAppRegistry: parentAppRegistryRef.current,
            });
            appRegistryActivePluginMap.delete(name);
          } else {
            appRegistryActivePluginMap.set(
              name,
              appRegistryActivePluginMap.get(name)! - 1
            );
          }
        }
      };
    }, []);

    const isReduxStore = Object.prototype.hasOwnProperty.call(
      storeRef.current,
      'dispatch'
    );

    const StoreProvider = isReduxStore ? Provider : LegacyRefluxProvider;

    return (
      <LocalAppRegistryContext.Provider value={localAppRegistryRef.current}>
        {/* this makes for a nice public interface but is impossible to type
            properly. As reflux stores are legacy and will be eventually
            removed, it seems okay to do so */}
        {/* @ts-expect-error ^^^ */}
        <StoreProvider store={storeRef.current} actions={actionsRef.current}>
          <Component {...(props as any)}></Component>
        </StoreProvider>
      </LocalAppRegistryContext.Provider>
    );
  };

  HadronPluginComponent.displayName = `${name}Component`;

  globalAppRegistry.registerComponent(name, HadronPluginComponent);

  if (roleName) {
    globalAppRegistry.registerRole(roleName, {
      name,
      component: HadronPluginComponent,
      order,
    });
  }

  return HadronPluginComponent;
}

export const HadronPlugin: React.FunctionComponent<{
  name: string;
  // TODO: better interface (just whatever is other props instead of `props` prop)
  props?: unknown;
}> = ({ name, props }) => {
  const propsRef = React.useRef(props);
  const globalAppRegistry = useGlobalAppRegistry();
  const localAppRegistry = useLocalAppRegistry();
  const Component =
    localAppRegistry.getComponent(name) ?? globalAppRegistry.getComponent(name);

  if (!Component) {
    throw new Error(`Can't find plugin ${name}`);
  }

  return <Component {...(propsRef.current as any)}></Component>;
};

export const HadronRole: React.FunctionComponent<{
  name: string;
  multi?: boolean;
  // TODO: see above
  props?: unknown;
}> = ({ name, multi = false, props }) => {
  const propsRef = React.useRef(props);
  const globalAppRegistry = useGlobalAppRegistry();
  const localAppRegistry = useLocalAppRegistry();
  const roles =
    localAppRegistry.getRole(name) ?? globalAppRegistry.getRole(name);

  if (!roles) {
    throw new Error(`Can't find roles ${name}`);
  }

  if (multi === false) {
    const [{ component: Component }] = roles;

    return <Component {...(propsRef.current as any)}></Component>;
  }

  return (
    <>
      {roles
        .sort((a, b) => {
          return (b.order ?? 0) - (a.order ?? Infinity);
        })
        .map(({ name, component: Component }) => {
          return (
            <Component key={name} {...(propsRef.current as any)}></Component>
          );
        })}
    </>
  );
};
