/**
 * TODO: move this to mocha-config-compass package
 */
import { EventEmitter } from 'events';
import {
  createNoopLogger,
  LoggerProvider,
} from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import {
  render,
  cleanup,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  act,
  within,
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
  ConnectionInfoProvider,
  TEST_CONNECTION_INFO,
} from './connection-info-provider';
import type { State } from './stores/connections-store-redux';
import { createDefaultConnectionInfo } from './stores/connections-store-redux';
import { getDataServiceForConnection } from './stores/connections-store-redux';
import { useConnectionActions, useStore } from './stores/store-context';
import CompassConnections, { ConnectFnProvider } from './index';
import type { HadronPluginComponent, HadronPlugin } from 'hadron-app-registry';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from 'hadron-app-registry';
import { expect } from 'chai';
import { Provider } from 'react-redux';

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type ConnectionsOptions = {
  /**
   * Initial preferences
   */
  preferences?: Partial<AllPreferences>;
  /**
   * Initial list of connections to be "loaded" to the application
   */
  connections?: ConnectionInfo[];
  /**
   * Connection function that returns DataService when connecting to a
   * connection with the connections store. Second argument is a constructor
   * with a bare minimum implementation of DataService required for the
   * connections store to function
   */
  connectFn?: (
    connectionOptions: ConnectionInfo['connectionOptions']
  ) => Partial<DataService> | Promise<Partial<DataService>>;
} & Partial<Omit<React.ComponentProps<typeof CompassConnections>, 'children'>>;

class MockDataService
  extends EventEmitter
  implements
    Pick<
      DataService,
      | 'addReauthenticationHandler'
      | 'getCurrentTopologyType'
      | 'getUpdatedSecrets'
      | 'disconnect'
      | 'instance'
    >
{
  constructor(private connectionOptions: ConnectionInfo['connectionOptions']) {
    super();
    this.setMaxListeners(0);
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
        version: '0.0.0',
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

function createWrapper(options: ConnectionsOptions, container?: HTMLElement) {
  const wrapperState = {
    globalAppRegistry: new AppRegistry(),
    localAppRegistry: new AppRegistry(),
    preferences: new InMemoryPreferencesAccess(options.preferences),
    track: Sinon.stub(),
    logger: createNoopLogger(),
    connectionStorage: new InMemoryConnectionStorage(options.connections),
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
        const mockDataService = await options.connectFn?.(connectionOptions);

        return Object.assign(
          // Make sure the mock always has the minimum required functions, but
          // also allow for them to be overriden
          new MockDataService(connectionOptions),
          mockDataService
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
  const wrapper: React.FunctionComponent = ({ children }) => {
    return (
      <GlobalAppRegistryProvider value={wrapperState.globalAppRegistry}>
        <AppRegistryProvider
          localAppRegistry={wrapperState.localAppRegistry}
          scopeName="TEST"
        >
          <CompassComponentsProvider popoverPortalContainer={container}>
            <PreferencesProvider value={wrapperState.preferences}>
              <LoggerProvider value={logger}>
                <TelemetryProvider options={telemetryOptions}>
                  <ConnectionStorageProvider
                    value={wrapperState.connectionStorage}
                  >
                    <ConnectFnProvider connect={wrapperState.connect}>
                      <CompassConnections
                        appName={options.appName ?? 'TEST'}
                        onExtraConnectionDataRequest={
                          options.onExtraConnectionDataRequest ??
                          (() => {
                            return Promise.resolve([{}, null] as [any, null]);
                          })
                        }
                        onAutoconnectInfoRequest={
                          options.onAutoconnectInfoRequest
                        }
                      >
                        <StoreGetter>{children}</StoreGetter>
                      </CompassConnections>
                    </ConnectFnProvider>
                  </ConnectionStorageProvider>
                </TelemetryProvider>
              </LoggerProvider>
            </PreferencesProvider>
          </CompassComponentsProvider>
        </AppRegistryProvider>
      </GlobalAppRegistryProvider>
    );
  };
  return { wrapperState, wrapper };
}

type RenderConnectionsOptions<
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
> = {
  container?: C;
  baseElement?: BE;
  wrapper?: React.JSXElementConstructor<{ children?: React.ReactElement }>;
} & ConnectionsOptions;

async function renderWithConnections<
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  ui: React.ReactElement,
  {
    wrapper: RenderWrapper,
    container: _container,
    baseElement: _baseElement,
    ...connectionsOptions
  }: RenderConnectionsOptions<C, BE> = {}
) {
  const container =
    _container ??
    (() => {
      const div = document.createElement('div');
      div.dataset.renderContainer = 'true';
      document.body.appendChild(div);
      return div;
    })();
  const baseElement = _baseElement ?? document.body;
  const { wrapper: Wrapper, wrapperState } = createWrapper(
    connectionsOptions,
    container as HTMLElement
  );
  const wrappedWrapper = RenderWrapper
    ? function WrappedWrapper({ children }: { children?: React.ReactElement }) {
        return (
          <RenderWrapper>
            <Wrapper>{children}</Wrapper>
          </RenderWrapper>
        );
      }
    : Wrapper;
  const result = render(ui, {
    wrapper: wrappedWrapper,
    container,
    baseElement,
  });
  // Wait for connections to load from storage before returning
  await waitFor(() => {
    expect(
      (connectionsOptions.connections ?? []).every((info) => {
        return !!wrapperState.connectionsStore.getState().connections.byId[
          info.id
        ];
      })
    ).to.eq(
      true,
      'Expected initial connections to load before rendering rest of the tested UI, but it did not happen'
    );
  });
  return { ...wrapperState, result };
}

async function renderHookWithConnections<
  HookResult,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(cb: () => HookResult, options: RenderConnectionsOptions<C, BE> = {}) {
  const result = { current: null } as { current: HookResult };
  function HookResultGetter() {
    result.current = cb();
    return null;
  }
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    result: _renderResult,
    ...rest
  } = await renderWithConnections(
    <HookResultGetter></HookResultGetter>,
    options
  );
  return { ...rest, result };
}

async function renderPluginComponentWithConnections<
  T,
  S extends Record<string, () => unknown>,
  A extends HadronPlugin,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  ui: React.ReactElement,
  Plugin: HadronPluginComponent<T, S, A>,
  initialProps: T,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  let plugin;
  function ComponentWithProvider() {
    plugin = Plugin.useActivate(initialProps);
    return (
      <Provider store={plugin.store} context={plugin.context}>
        {ui}
      </Provider>
    );
  }
  const result = await renderWithConnections(
    <ComponentWithProvider></ComponentWithProvider>,
    options
  );
  return {
    plugin: plugin as unknown as A,
    ...result,
  };
}

/**
 * @deprecated instead of testing the store directly, test it through the UI as
 * the redux documentation recommends
 * @see {@link https://redux.js.org/usage/writing-tests#guiding-principles}
 */
async function activatePluginWithConnections<
  T,
  S extends Record<string, () => unknown>,
  A extends HadronPlugin,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  Plugin: HadronPluginComponent<T, S, A>,
  initialProps: T,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  const { result, ...rest } = await renderHookWithConnections(() => {
    return Plugin.useActivate(initialProps);
  }, options);
  return { plugin: result.current, ...rest };
}

async function renderWithActiveConnection<
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  ui: React.ReactElement,
  connectionInfo: ConnectionInfo = TEST_CONNECTION_INFO,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  function UiWithConnectionInfo() {
    return (
      <ConnectionInfoProvider connectionInfoId={connectionInfo.id}>
        {ui}
      </ConnectionInfoProvider>
    );
  }
  const renderResult = await renderWithConnections(
    <UiWithConnectionInfo></UiWithConnectionInfo>,
    {
      ...options,
      connections: [connectionInfo, ...(options.connections ?? [])],
    }
  );
  await renderResult.connectionsStore.actions.connect(connectionInfo);
  // For ConnectionInfoProvider to render your input, we need to be connected
  // successfully
  expect(
    renderResult.connectionsStore.getState().connections.byId[connectionInfo.id]
  ).to.have.property(
    'status',
    'connected',
    'Expected connection to connect before rendering rest of the tested UI, but connection failed to connect'
  );
  return renderResult;
}

async function renderHookWithActiveConnection<
  HookResult,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  cb: () => HookResult,
  connectionInfo: ConnectionInfo = TEST_CONNECTION_INFO,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  const result = { current: null } as { current: HookResult };
  function HookResultGetter() {
    result.current = cb();
    return null;
  }
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    result: _renderResult,
    ...rest
  } = await renderWithActiveConnection(
    <HookResultGetter></HookResultGetter>,
    connectionInfo,
    options
  );
  return { ...rest, result };
}

/**
 * @deprecated instead of testing the store directly, test it through the UI as
 * the redux documentation recommends
 * @see {@link https://redux.js.org/usage/writing-tests#guiding-principles}
 */
async function activatePluginWithActiveConnection<
  T,
  S extends Record<string, () => unknown>,
  A extends HadronPlugin,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  Plugin: HadronPluginComponent<T, S, A>,
  initialProps: T,
  connectionInfo: ConnectionInfo = TEST_CONNECTION_INFO,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  const { result, ...rest } = await renderHookWithActiveConnection(
    () => {
      return Plugin.useActivate(initialProps);
    },
    connectionInfo,
    options
  );
  return { plugin: result.current, ...rest };
}

async function renderPluginComponentWithActiveConnection<
  T,
  S extends Record<string, () => unknown>,
  A extends HadronPlugin,
  C extends Element | DocumentFragment = HTMLElement,
  BE extends Element | DocumentFragment = C
>(
  ui: React.ReactElement,
  Plugin: HadronPluginComponent<T, S, A>,
  initialProps: T,
  connectionInfo: ConnectionInfo = TEST_CONNECTION_INFO,
  options: RenderConnectionsOptions<C, BE> = {}
) {
  let plugin;
  function ComponentWithProvider() {
    plugin = Plugin.useActivate(initialProps);
    return (
      <Provider store={plugin.store} context={plugin.context}>
        {ui}
      </Provider>
    );
  }
  const result = await renderWithActiveConnection(
    <ComponentWithProvider></ComponentWithProvider>,
    connectionInfo,
    options
  );
  return {
    plugin: plugin as unknown as A,
    ...result,
  };
}

export {
  // There is never a good reason not to have these wrapper providers when
  // rendering something in compass for testing. Using them requires render call
  // to be async, but not having them will lead to code breaking in runtime when
  // rendered due to missing contexts of all sorts in most cases. This is why we
  // don't export default render methods from testing-library and always export
  // these ones instead
  renderWithConnections as render,
  renderHookWithConnections as renderHook,
  cleanup,
  screen,
  wait,
  waitFor,
  waitForElementToBeRemoved,
  renderWithConnections,
  renderWithActiveConnection,
  renderHookWithConnections,
  renderHookWithActiveConnection,
  renderPluginComponentWithConnections,
  renderPluginComponentWithActiveConnection,
  activatePluginWithConnections,
  activatePluginWithActiveConnection,
  act,
  createDefaultConnectionInfo,
  userEvent,
  within,
};
