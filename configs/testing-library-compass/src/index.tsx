import { EventEmitter } from 'events';
import {
  createNoopLogger,
  LoggerProvider,
} from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import type {
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks';
import {
  renderHook,
  cleanup as rtlCleanupHook,
} from '@testing-library/react-hooks';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import {
  render,
  cleanup as rtlCleanup,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  act,
  within,
  fireEvent as testingLibraryFireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  ConnectionOptions,
  DataService,
  InstanceDetails,
} from 'mongodb-data-service';
import Sinon from 'sinon';
import React from 'react';
import type {
  AllPreferences,
  PreferencesAccess,
} from 'compass-preferences-model';
import {
  PreferencesProvider,
  ReadOnlyPreferenceAccess,
} from 'compass-preferences-model/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import { CompassComponentsProvider } from '@mongodb-js/compass-components';
import {
  TestEnvCurrentConnectionContext,
  ConnectionInfoProvider,
} from '@mongodb-js/compass-connections/src/connection-info-provider';
import type { State } from '@mongodb-js/compass-connections/src/stores/connections-store-redux';
import { createDefaultConnectionInfo } from '@mongodb-js/compass-connections/src/stores/connections-store-redux';
import { getDataServiceForConnection } from '@mongodb-js/compass-connections/src/stores/connections-store-redux';
import {
  useConnectionActions,
  useStore,
} from '@mongodb-js/compass-connections/src/stores/store-context';
import CompassConnections, {
  ConnectFnProvider,
} from '@mongodb-js/compass-connections/src/index';
import type {
  CompassPluginComponent,
  CompassPlugin,
} from '@mongodb-js/compass-app-registry';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from '@mongodb-js/compass-app-registry';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import ConnectionString from 'mongodb-connection-string-url';

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type TestConnectionsOptions = {
  /**
   * Initial preferences
   */
  preferences?: Partial<AllPreferences>;
  /**
   * Initial list of connections to be "loaded" to the application. Empty list
   * by default. You can explicitly pass `no-preload` to disable initial
   * preloading of the connections, otherwise connections are always preloaded
   * before rendering when using helper methods
   */
  connections?: ConnectionInfo[] | 'no-preload';
  /**
   * Connection function that returns DataService when connecting to a
   * connection with the connections store. Second argument is a constructor
   * with a bare minimum implementation of DataService required for the
   * connections store to function
   */
  connectFn?: (
    connectionOptions: ConnectionInfo['connectionOptions']
  ) => Partial<DataService> | Promise<Partial<DataService>>;
  /**
   * Connection storage mock
   */
  connectionStorage?: ConnectionStorage;
} & Partial<
  Omit<
    React.ComponentProps<typeof CompassConnections>,
    'children' | 'preloadConnectionInfos'
  >
>;

export class MockDataService
  extends EventEmitter
  implements
    Pick<
      DataService,
      | 'getConnectionString'
      | 'getConnectionOptions'
      | 'getMongoClientConnectionOptions'
      | 'addReauthenticationHandler'
      | 'getCurrentTopologyType'
      | 'getLastSeenTopology'
      | 'getUpdatedSecrets'
      | 'disconnect'
      | 'instance'
    >
{
  constructor(private connectionOptions: ConnectionInfo['connectionOptions']) {
    super();
    this.setMaxListeners(0);
  }
  getConnectionString() {
    return new ConnectionString(this.connectionOptions.connectionString);
  }
  getConnectionOptions() {
    return this.connectionOptions;
  }
  getMongoClientConnectionOptions() {
    return {
      url: this.connectionOptions.connectionString,
      options: { productName: 'Test', productDocsLink: 'http://example.com' },
    };
  }
  addReauthenticationHandler(): void {
    // noop
  }
  getCurrentTopologyType(): ReturnType<DataService['getCurrentTopologyType']> {
    return 'Unknown';
  }
  getLastSeenTopology(): ReturnType<DataService['getLastSeenTopology']> {
    return {
      type: 'Unknown',
      servers: new Map(),
      setName: null,
      maxSetVersion: null,
      maxElectionId: null,
      stale: false,
      compatible: false,
      logicalSessionTimeoutMinutes: null,
      heartbeatFrequencyMS: 0,
      localThresholdMS: 0,
      commonWireVersion: 0,
      error: null,
      hasKnownServers: false,
      hasDataBearingServers: false,
      toJSON() {
        return JSON.parse(JSON.stringify(this));
      },
    };
  }
  getUpdatedSecrets(): Promise<Partial<ConnectionOptions>> {
    return Promise.resolve({});
  }
  disconnect(): Promise<void> {
    return Promise.resolve();
  }
  instance(): Promise<InstanceDetails> {
    return Promise.resolve({
      auth: {
        user: null,
        roles: [],
        privileges: [],
      },
      build: {
        isEnterprise: false,
        // Picking a large version to avoid the end-of-life confirmation modal
        version: '100.0.0',
      },
      host: {},
      genuineMongoDB: {
        isGenuine: true,
        dbType: 'mongodb',
      },
      dataLake: {
        isDataLake: false,
        version: null,
      },
      featureCompatibilityVersion: null,
      isAtlas: false,
      isLocalAtlas: false,
      csfleMode: 'unavailable',
    });
  }
}

class InMemoryPreferencesAccess
  extends ReadOnlyPreferenceAccess
  implements PreferencesAccess
{
  private listeners: Record<string, ((val: any) => void)[]> = {};
  constructor(initialPreferences?: Partial<AllPreferences>) {
    super(initialPreferences);
  }
  async savePreferences(attributes: Partial<AllPreferences>) {
    const initialPreferences = {
      ...this.getPreferences(),
    };
    await this['_preferences'].savePreferences(attributes);
    for (const [key, value] of Object.entries(attributes)) {
      if (
        (initialPreferences as any)[key] !== value &&
        this.listeners[key] &&
        this.listeners[key].length > 0
      ) {
        for (const listener of this.listeners[key]) {
          listener(value);
        }
      }
    }
    return this.getPreferences();
  }
  onPreferenceValueChanged(
    key: keyof AllPreferences,
    cb: (value: any) => void
  ): () => void {
    this.listeners[key] ??= [];
    this.listeners[key].push(cb);
    return () => {
      this.listeners[key] = this.listeners[key].filter((fn) => {
        return fn !== cb;
      });
    };
  }
}

type ComponentWithChildren = React.ComponentType<{
  children: React.ReactElement;
}>;

const EmptyWrapper = ({ children }: { children: React.ReactElement }) => {
  return <>{children}</>;
};

function getConnectionsFromConnectionsOption(
  connections: TestConnectionsOptions['connections']
): Exclude<TestConnectionsOptions['connections'], 'no-preload'> {
  return connections === 'no-preload' ? undefined : connections ?? [];
}

const TEST_ENV_CURRENT_CONNECTION = {
  info: {
    id: 'TEST',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27020',
    },
  },
  status: 'connected' as const,
  error: null,
};

function createWrapper(
  options: TestConnectionsOptions,
  // When using renderHook, anything that will try to call createPortal will
  // fail due to the testing-library using ReactTestRenderer for hooks. To work
  // around that, only when creating wrappers for renderHook, we'll skip any
  // wrapper that's UI related
  skipUIWrappers: boolean,
  TestingLibraryWrapper: ComponentWithChildren = EmptyWrapper,
  container?: HTMLElement
) {
  const connections = getConnectionsFromConnectionsOption(options.connections);
  const wrapperState = {
    globalAppRegistry: new AppRegistry(),
    localAppRegistry: new AppRegistry(),
    preferences: new InMemoryPreferencesAccess(
      options.preferences
    ) as PreferencesAccess,
    track: Sinon.stub(),
    logger: createNoopLogger(),
    connectionStorage:
      options.connectionStorage ??
      (new InMemoryConnectionStorage(connections) as ConnectionStorage),
    connectionsStore: {
      getState: undefined as unknown as () => State,
      actions: {} as ReturnType<typeof useConnectionActions>,
    },
    connect: async ({
      connectionOptions,
    }: {
      connectionOptions: ConnectionInfo['connectionOptions'];
    }) => {
      if (options.connectFn) {
        const dataService = await options.connectFn?.(connectionOptions);

        // Presumably we are dealing with the real data service here based on
        // this property being present, do not mess with it and just return it
        // straight away.
        //
        // TODO: This check can probably be more robust, maybe we add some
        // special prop for this on DataServiceImpl?
        if (Object.prototype.hasOwnProperty.call(dataService, '_id')) {
          return dataService as DataService;
        }

        return Object.assign(
          // Make sure the mock always has the minimum required functions, but
          // also allow for them to be overriden
          new MockDataService(connectionOptions),
          dataService
        ) as unknown as DataService;
      } else {
        return new MockDataService(connectionOptions) as unknown as DataService;
      }
    },
    getDataServiceForConnection,
  };
  const StoreGetter: React.FunctionComponent = ({ children }) => {
    const store = useStore();
    const actions = useConnectionActions();
    wrapperState.connectionsStore.getState = store.getState.bind(store);
    wrapperState.connectionsStore.actions = actions;
    return <>{children}</>;
  };
  const logger = {
    createLogger() {
      return wrapperState.logger;
    },
  };
  const telemetryOptions = {
    sendTrack: wrapperState.track,
  };
  const _CompassComponentsProvider = skipUIWrappers
    ? EmptyWrapper
    : CompassComponentsProvider;
  const wrapper: ComponentWithChildren = ({ children, ...props }) => {
    return (
      <GlobalAppRegistryProvider value={wrapperState.globalAppRegistry}>
        <AppRegistryProvider
          localAppRegistry={wrapperState.localAppRegistry}
          scopeName="TEST"
        >
          <_CompassComponentsProvider popoverPortalContainer={container}>
            <PreferencesProvider value={wrapperState.preferences}>
              <LoggerProvider value={logger}>
                <TelemetryProvider options={telemetryOptions}>
                  <ConnectionStorageProvider
                    value={wrapperState.connectionStorage}
                  >
                    <ConnectFnProvider connect={wrapperState.connect}>
                      <CompassConnections
                        appName={options.appName ?? 'TEST'}
                        onFailToLoadConnections={
                          options.onFailToLoadConnections ??
                          (() => {
                            // noop
                          })
                        }
                        onExtraConnectionDataRequest={
                          options.onExtraConnectionDataRequest ??
                          (() => {
                            return Promise.resolve([{}, null] as [any, null]);
                          })
                        }
                        onAutoconnectInfoRequest={
                          options.onAutoconnectInfoRequest
                        }
                        preloadStorageConnectionInfos={connections}
                      >
                        <StoreGetter>
                          <TestEnvCurrentConnectionContext.Provider
                            value={TEST_ENV_CURRENT_CONNECTION}
                          >
                            <TestingLibraryWrapper {...props}>
                              {children}
                            </TestingLibraryWrapper>
                          </TestEnvCurrentConnectionContext.Provider>
                        </StoreGetter>
                      </CompassConnections>
                    </ConnectFnProvider>
                  </ConnectionStorageProvider>
                </TelemetryProvider>
              </LoggerProvider>
            </PreferencesProvider>
          </_CompassComponentsProvider>
        </AppRegistryProvider>
      </GlobalAppRegistryProvider>
    );
  };
  return { wrapperState, wrapper };
}

export type RenderConnectionsOptions = RenderOptions & TestConnectionsOptions;

export type RenderWithConnectionsResult = ReturnType<
  typeof createWrapper
>['wrapperState'] &
  RenderResult;

function renderWithConnections(
  ui: React.ReactElement,
  {
    wrapper,
    container,
    baseElement,
    queries,
    hydrate,
    ...connectionsOptions
  }: RenderConnectionsOptions = {}
): RenderWithConnectionsResult {
  const { wrapper: Wrapper, wrapperState } = createWrapper(
    connectionsOptions,
    false,
    wrapper,
    container
  );
  const result = render(ui, {
    wrapper: Wrapper,
    container,
    baseElement,
    queries,
    hydrate,
  });
  expect(
    (
      getConnectionsFromConnectionsOption(connectionsOptions.connections) ?? []
    ).every((info) => {
      return !!wrapperState.connectionsStore.getState().connections.byId[
        info.id
      ];
    })
  ).to.eq(
    true,
    'Expected initial connections to load before rendering rest of the tested UI, but it did not happen'
  );
  return { ...wrapperState, ...result };
}

export type RenderHookConnectionsOptions<HookProps> = Omit<
  RenderHookOptions<HookProps>,
  'wrapper'
> & { wrapper?: ComponentWithChildren } & TestConnectionsOptions;

export type RenderWithConnectionsHookResult<
  HookProps = unknown,
  HookResult = unknown
> = ReturnType<typeof createWrapper>['wrapperState'] &
  RenderHookResult<HookProps, HookResult>;

function renderHookWithConnections<HookProps, HookResult>(
  cb: (props: HookProps) => HookResult,
  {
    initialProps,
    wrapper,
    ...connectionsOptions
  }: RenderHookConnectionsOptions<HookProps> = {}
): RenderWithConnectionsHookResult<HookProps, HookResult> {
  const { wrapper: Wrapper, wrapperState } = createWrapper(
    connectionsOptions,
    true,
    wrapper
  );
  const result = renderHook(cb, { wrapper: Wrapper as any, initialProps });
  return { ...wrapperState, ...result };
}

async function waitForConnect(
  connectionsStore: RenderWithConnectionsResult['connectionsStore'],
  connectionInfo: ConnectionInfo
) {
  await connectionsStore.actions.connect(connectionInfo);
  // For ConnectionInfoProvider to render your ui, we need to be connected
  // successfully
  const connectionState =
    connectionsStore.getState().connections.byId[connectionInfo.id];
  if (connectionState.status !== 'connected') {
    if (connectionState.error) {
      connectionState.error.message =
        'Failed to connect when rendering with active connection:\n\n' +
        connectionState.error.message;
      throw connectionState.error;
    } else {
      throw new Error(
        `Expected to connect when renderering with active connection, instead the connection status is ${connectionState.status}`
      );
    }
  }
}

function createConnectionInfoWrapper(
  connectionId: string,
  ReactTestingLibraryWrapper: React.ComponentType
) {
  return function ConnectionInfoWrapper({ children, ...props }: any) {
    return (
      <ConnectionInfoProvider connectionInfoId={connectionId}>
        <ReactTestingLibraryWrapper {...props}>
          {children}
        </ReactTestingLibraryWrapper>
      </ConnectionInfoProvider>
    );
  };
}

async function renderWithActiveConnection(
  ui: React.ReactElement,
  connectionInfo: ConnectionInfo = TEST_ENV_CURRENT_CONNECTION.info,
  {
    connections,
    wrapper: Wrapper = EmptyWrapper,
    ...options
  }: RenderConnectionsOptions = {}
) {
  const ConnectionInfoWrapper = createConnectionInfoWrapper(
    connectionInfo.id,
    Wrapper as React.ComponentType
  );
  const renderResult = renderWithConnections(ui, {
    ...options,
    wrapper: ConnectionInfoWrapper,
    connections: [
      connectionInfo,
      ...(getConnectionsFromConnectionsOption(connections) ?? []),
    ],
  });
  await waitForConnect(renderResult.connectionsStore, connectionInfo);
  return renderResult;
}

async function renderHookWithActiveConnection<HookProps, HookResult>(
  cb: (props: HookProps) => HookResult,
  connectionInfo: ConnectionInfo = TEST_ENV_CURRENT_CONNECTION.info,
  {
    connections,
    wrapper: Wrapper = EmptyWrapper,
    ...options
  }: RenderHookConnectionsOptions<HookProps> = {}
) {
  const ConnectionInfoWrapper = createConnectionInfoWrapper(
    connectionInfo.id,
    Wrapper as React.ComponentType
  );
  const renderHookResult = renderHookWithConnections(cb, {
    ...options,
    wrapper: ConnectionInfoWrapper,
    connections: [
      connectionInfo,
      ...(getConnectionsFromConnectionsOption(connections) ?? []),
    ],
  });
  await waitForConnect(renderHookResult.connectionsStore, connectionInfo);
  return renderHookResult;
}

function createPluginWrapper<
  Props,
  ServiceLocators extends Record<string, () => unknown>,
  PluginContext extends CompassPlugin
>(
  Plugin: CompassPluginComponent<Props, ServiceLocators, PluginContext>,
  initialPluginProps?: Props,
  ReactTestingLibraryWrapper: ComponentWithChildren = EmptyWrapper
) {
  const ref: { current: PluginContext } = { current: {} as any };
  function ComponentWithProvider({ children, ...props }: any) {
    const plugin = (ref.current = Plugin.useActivate(
      initialPluginProps ?? ({} as any)
    ));
    return (
      <Provider store={plugin.store} context={plugin.context}>
        <ReactTestingLibraryWrapper {...props}>
          {children}
        </ReactTestingLibraryWrapper>
      </Provider>
    );
  }
  return { ref, Wrapper: ComponentWithProvider };
}

export type RenderPluginWithConnectionsResult<
  T extends CompassPluginComponent<any, any, any>
> = RenderWithConnectionsResult & {
  plugin: ReturnType<T['useActivate']>;
};

function createPluginTestHelpers<
  Props,
  ServiceLocators extends Record<string, () => unknown>,
  PluginContext extends CompassPlugin
>(
  Plugin: CompassPluginComponent<Props, ServiceLocators, PluginContext>,
  defaultInitialPluginProps?: Props
) {
  return {
    renderWithConnections(
      this: void,
      ...[
        ui,
        { wrapper: ReactTestingLibraryWrapper = EmptyWrapper, ...options } = {},
      ]: Parameters<typeof renderWithConnections>
    ): RenderWithConnectionsResult & { plugin: PluginContext } {
      const { ref, Wrapper } = createPluginWrapper(
        Plugin,
        defaultInitialPluginProps,
        ReactTestingLibraryWrapper
      );
      const result = renderWithConnections(ui, {
        ...options,
        wrapper: Wrapper,
      });
      return {
        get plugin() {
          return ref.current;
        },
        ...result,
      };
    },
    async renderWithActiveConnection(
      this: void,
      ...[
        ui,
        connectionInfo,
        { wrapper: ReactTestingLibraryWrapper = EmptyWrapper, ...options } = {},
      ]: Parameters<typeof renderWithActiveConnection>
    ): Promise<RenderWithConnectionsResult & { plugin: PluginContext }> {
      const { ref, Wrapper } = createPluginWrapper(
        Plugin,
        defaultInitialPluginProps,
        ReactTestingLibraryWrapper
      );
      const result = await renderWithActiveConnection(ui, connectionInfo, {
        ...options,
        wrapper: Wrapper,
      });
      return {
        get plugin() {
          return ref.current;
        },
        ...result,
      };
    },
    renderHookWithConnections<HookProps, HookResult>(
      this: void,
      cb: (props: HookProps) => HookResult,
      {
        wrapper: ReactTestingLibraryWrapper,
        ...options
      }: RenderHookConnectionsOptions<HookProps> = {}
    ) {
      const { ref, Wrapper } = createPluginWrapper(
        Plugin,
        defaultInitialPluginProps,
        ReactTestingLibraryWrapper
      );
      const result = renderHookWithConnections(cb, {
        ...options,
        wrapper: Wrapper,
      });
      return {
        get plugin() {
          return ref.current;
        },
        ...result,
      };
    },
    async renderHookWithActiveConnection<HookProps, HookResult>(
      this: void,
      cb: (props: HookProps) => HookResult,
      connectionInfo?: ConnectionInfo,
      {
        wrapper: ReactTestingLibraryWrapper,
        ...options
      }: RenderHookConnectionsOptions<HookProps> = {}
    ) {
      const { ref, Wrapper } = createPluginWrapper(
        Plugin,
        defaultInitialPluginProps,
        ReactTestingLibraryWrapper
      );
      const result = await renderHookWithActiveConnection(cb, connectionInfo, {
        ...options,
        wrapper: Wrapper,
      });
      return {
        get plugin() {
          return ref.current;
        },
        ...result,
      };
    },
    /**
     * @deprecated instead of testing the store directly, test it through the UI as
     * the redux documentation recommends
     * @see {@link https://redux.js.org/usage/writing-tests#guiding-principles}
     */
    activatePluginWithConnections(
      this: void,
      initialProps?: Props,
      options: TestConnectionsOptions = {}
    ) {
      const { result, ...rest } = renderHookWithConnections(
        Plugin.useActivate.bind(Plugin),
        {
          ...options,
          initialProps: {
            ...defaultInitialPluginProps,
            ...initialProps,
          } as any,
        }
      );
      return {
        get plugin() {
          return result.current;
        },
        ...rest,
      };
    },
    /**
     * @deprecated instead of testing the store directly, test it through the UI as
     * the redux documentation recommends
     * @see {@link https://redux.js.org/usage/writing-tests#guiding-principles}
     */
    async activatePluginWithActiveConnection(
      this: void,
      connectionInfo: ConnectionInfo,
      initialProps?: Props,
      options: TestConnectionsOptions = {}
    ) {
      const { result, ...rest } = await renderHookWithActiveConnection(
        Plugin.useActivate.bind(Plugin),
        connectionInfo,
        {
          ...options,
          initialProps: {
            ...defaultInitialPluginProps,
            ...initialProps,
          } as any,
        }
      );
      return {
        get plugin() {
          return result.current;
        },
        ...rest,
      };
    },
  };
}

/**
 * @deprecated use userEvent instead
 */
const fireEvent = testingLibraryFireEvent;

/**
 * @deprecated @testing-library/react installs these hooks automatically
 */
const cleanup = rtlCleanup;

/**
 * @deprecated @testing-library/react-hooks installs these hooks automatically
 */
const cleanupHook = rtlCleanupHook;

/**
 * In some cases we still want to just render something without all the
 * wrappers, for these cases we provide access to the original methods, but this
 * is not the default behavior
 */
const testingLibrary = {
  render,
  renderHook,
};

export {
  // There is never a good reason not to have these wrapper providers when
  // rendering something in compass for testing. Using these render methods
  // introduces a bit more run time, but most of the code in the application is
  // not expecting those to be missing
  renderWithConnections as render,
  renderHookWithConnections as renderHook,
  cleanup,
  cleanupHook,
  screen,
  wait,
  waitFor,
  waitForElementToBeRemoved,
  renderWithConnections,
  renderWithActiveConnection,
  renderHookWithConnections,
  renderHookWithActiveConnection,
  createPluginTestHelpers,
  act,
  createDefaultConnectionInfo,
  userEvent,
  within,
  fireEvent,
  testingLibrary,
};
