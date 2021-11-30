import { css } from '@emotion/css';
import React, { useCallback, useEffect, useReducer } from 'react';
import {
  ConnectionInfo,
  DataService,
  convertConnectionInfoToModel,
  getConnectionTitle,
} from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import Connections from '@mongodb-js/compass-connections';

import Workspace from './workspace';
import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import {
  AppRegistryActions,
  AppRegistryRoles,
  useAppRegistryContext,
  useAppRegistryRole,
} from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';

const homeViewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100vh',
});

const homePageStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  flex: 1,
  overflow: 'auto',
  height: '100%',
  zIndex: 0,
});

const defaultNS: Namespace = {
  database: '',
  collection: '',
};

type State = {
  connectionTitle: string;
  errorLoadingInstanceMessage: string | null;
  instanceLoadingStatus: InstanceLoadedStatus;
  isConnected: boolean;
  isDataLake: boolean;
  namespace: Namespace;
};

const initialState = {
  connectionTitle: '',
  errorLoadingInstanceMessage: null,
  instanceLoadingStatus: InstanceLoadedStatus.INITIAL,
  isConnected: false,
  isDataLake: false,
  namespace: defaultNS,
};

type Action =
  | {
      type: 'connected';
      connectionTitle: string;
    }
  | { type: 'disconnected' }
  | { type: 'instance-loaded'; isDataLake: boolean }
  | { type: 'instance-loaded-error'; errorMessage: string }
  | { type: 'update-namespace'; namespace: Namespace };

type StatusActionType = {
  configure: (opts: {
    animation: boolean;
    message: string;
    visible: boolean;
  }) => void;
  done: () => void;
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'connected':
      return {
        ...state,
        namespace: { ...defaultNS },
        isConnected: true,
        connectionTitle: action.connectionTitle,
        instanceLoadingStatus: InstanceLoadedStatus.LOADING,
      };
    case 'instance-loaded':
      // We only want to progress to the LOADED state on the initial load
      if (state.instanceLoadingStatus === InstanceLoadedStatus.LOADING) {
        return {
          ...state,
          isDataLake: action.isDataLake,
          instanceLoadingStatus: InstanceLoadedStatus.LOADED,
        };
      }
      return state;
    case 'instance-loaded-error':
      if (state.instanceLoadingStatus === InstanceLoadedStatus.LOADING) {
        return {
          ...state,
          errorLoadingInstanceMessage: action.errorMessage,
          instanceLoadingStatus: InstanceLoadedStatus.ERROR,
        };
      }
      return state;
    case 'update-namespace':
      return {
        ...state,
        namespace: action.namespace,
      };
    case 'disconnected':
      return {
        // Reset to initial state.
        ...initialState,
      };
    default:
      return state;
  }
}

function hideCollectionSubMenu() {
  void import('hadron-ipc').then(({ ipcRenderer }) => {
    if (ipcRenderer) {
      ipcRenderer.call('window:hide-collection-submenu');
    }
  });
}

function Home({ appName }: { appName: string }): React.ReactElement | null {
  const appRegistry = useAppRegistryContext();
  const connectRole = useAppRegistryRole(AppRegistryRoles.APPLICATION_CONNECT);

  const [
    {
      connectionTitle,
      isConnected,
      isDataLake,
      namespace,
      errorLoadingInstanceMessage,
      instanceLoadingStatus,
    },
    dispatch,
  ] = useReducer(reducer, { ...initialState });

  function onDataServiceConnected(
    err: Error | undefined | null,
    ds: DataService,
    connectionInfo: ConnectionInfo
  ) {
    dispatch({
      type: 'connected',
      connectionTitle: getConnectionTitle(connectionInfo) || '',
    });
  }

  // TODO: Remove this comment once we only have one connections package:
  // This is currently only used by the new connections package.
  // We've moved to not calling the `data-service-connected` event inside
  // of connections and instead call it here.
  async function onConnected(
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) {
    const legacyConnectionModel = await convertConnectionInfoToModel(
      connectionInfo
    );

    appRegistry.emit(
      'data-service-connected',
      null, // No error connecting.
      dataService,
      connectionInfo,
      legacyConnectionModel // TODO: Remove this once we remove the dependency in compass-sidebar.
    );
  }

  function onInstanceCreated({
    instance,
  }: {
    instance: {
      dataLake: { isDataLake: boolean };
      statusError: string;
      databasesStatusError: string;
      refreshingStatusError: string;
      on(evt: string, fn: (...args: any[]) => void): void;
    };
  }) {
    function onStatusChange(status: string, errorMessage: string): void {
      if (status === 'ready') {
        dispatch({
          type: 'instance-loaded',
          isDataLake: instance.dataLake.isDataLake,
        });
      }
      if (status === 'error') {
        dispatch({
          type: 'instance-loaded-error',
          errorMessage,
        });
      }
    }

    if (process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true') {
      instance.on(
        'change:refreshingStatus',
        (_model: unknown, status: string) => {
          onStatusChange(status, instance.refreshingStatusError);
        }
      );
    } else {
      instance.on('change:status', (_model: unknown, status: string) => {
        if (status === 'error') {
          onStatusChange(status, instance.statusError);
        }
      });
      instance.on(
        'change:databasesStatus',
        (_model: unknown, status: string) => {
          onStatusChange(status, instance.databasesStatusError);
        }
      );
    }
  }

  function onSelectDatabase(ns: string) {
    hideCollectionSubMenu();
    dispatch({
      type: 'update-namespace',
      namespace: toNS(ns),
    });
  }

  function onSelectNamespace(meta: { namespace: string }) {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(meta.namespace),
    });
  }

  function onSelectInstance() {
    hideCollectionSubMenu();
    dispatch({
      type: 'update-namespace',
      namespace: toNS(''),
    });
  }

  function onOpenNamespaceInNewTab(meta: { namespace: string }) {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(meta.namespace),
    });
  }

  function onAllTabsClosed() {
    dispatch({
      type: 'update-namespace',
      namespace: toNS(''),
    });
  }

  const onDataServiceDisconnected = useCallback(() => {
    const StatusAction = appRegistry.getAction(
      AppRegistryActions.STATUS_ACTIONS
    ) as StatusActionType | undefined;
    dispatch({
      type: 'disconnected',
    });
    updateTitle(appName);
    StatusAction?.done();
  }, [appRegistry, appName]);

  useEffect(() => {
    if (isConnected) {
      updateTitle(appName, connectionTitle, namespace);
    }
  }, [isConnected, appName, connectionTitle, namespace]);

  useEffect(() => {
    // Setup listeners.
    appRegistry.on('instance-created', onInstanceCreated);
    appRegistry.on('data-service-connected', onDataServiceConnected);
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);
    appRegistry.on('select-database', onSelectDatabase);
    appRegistry.on('select-namespace', onSelectNamespace);
    appRegistry.on('select-instance', onSelectInstance);
    appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);
    appRegistry.on('all-collection-tabs-closed', onAllTabsClosed);

    return () => {
      // Clean up the listeners.
      appRegistry.removeListener('instance-created', onInstanceCreated);
      appRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      appRegistry.removeListener(
        'data-service-disconnected',
        onDataServiceDisconnected
      );
      appRegistry.removeListener('select-database', onSelectDatabase);
      appRegistry.removeListener('select-namespace', onSelectNamespace);
      appRegistry.removeListener('select-instance', onSelectInstance);
      appRegistry.removeListener(
        'open-namespace-in-new-tab',
        onOpenNamespaceInNewTab
      );
      appRegistry.removeListener('all-collection-tabs-closed', onAllTabsClosed);
    };
  }, [appRegistry, onDataServiceDisconnected]);

  if (isConnected) {
    return (
      <Workspace
        namespace={namespace}
        instanceLoadingStatus={instanceLoadingStatus}
        errorLoadingInstanceMessage={errorLoadingInstanceMessage}
        isDataLake={isDataLake}
      />
    );
  }

  const showNewConnectForm = process.env.USE_NEW_CONNECT_FORM === 'true';

  if (showNewConnectForm) {
    return (
      <div className={homeViewStyles} data-test-id="home-view">
        <div className={homePageStyles}>
          <Connections onConnected={onConnected} />
        </div>
      </div>
    );
  }

  if (!connectRole) {
    return null;
  }

  const Connect = connectRole[0].component;
  return (
    <div className={homeViewStyles} data-test-id="home-view">
      <div className={homePageStyles}>
        <Connect />
      </div>
    </div>
  );
}

Home.displayName = 'HomeComponent';

export default Home;
