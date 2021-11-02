import { css } from '@emotion/css';
import React, { useEffect, useReducer } from 'react';
import {
  DataService,
  getConnectionTitle,
  ConnectionInfo,
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
  | { type: 'instance-loaded'; isDatalake: boolean }
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
      return {
        ...state,
        isDataLake: action.isDatalake,
        instanceLoadingStatus: InstanceLoadedStatus.LOADED,
      };
    case 'instance-loaded-error':
      return {
        ...state,
        errorLoadingInstanceMessage: action.errorMessage,
        instanceLoadingStatus: InstanceLoadedStatus.ERROR,
      };
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

  function onInstanceRefreshed(instanceInformation: {
    errorMessage?: string;
    instance?: {
      dataLake?: {
        isDataLake?: boolean;
      };
    };
  }) {
    if (instanceInformation.errorMessage) {
      dispatch({
        type: 'instance-loaded-error',
        errorMessage: instanceInformation.errorMessage,
      });

      return;
    }

    dispatch({
      type: 'instance-loaded',
      isDatalake: !!instanceInformation.instance?.dataLake?.isDataLake,
    });
  }

  function onSelectDatabase(ns: string) {
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

  function onDataServiceDisconnected() {
    const StatusAction = appRegistry.getAction(
      AppRegistryActions.STATUS_ACTIONS
    ) as StatusActionType | undefined;
    dispatch({
      type: 'disconnected',
    });
    updateTitle(appName);
    StatusAction?.done();
  }

  useEffect(() => {
    if (isConnected) {
      updateTitle(appName, connectionTitle, namespace);
    }
  }, [isConnected, appName, connectionTitle, namespace]);

  useEffect(() => {
    // Setup listeners.
    appRegistry.on('instance-refreshed', onInstanceRefreshed);
    appRegistry.on('data-service-connected', onDataServiceConnected);
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);
    appRegistry.on('select-database', onSelectDatabase);
    appRegistry.on('select-namespace', onSelectNamespace);
    appRegistry.on('select-instance', onSelectInstance);
    appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);
    appRegistry.on('all-collection-tabs-closed', onAllTabsClosed);

    return () => {
      // Clean up the listeners.
      appRegistry.removeListener('instance-refreshed', onInstanceRefreshed);
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
  });

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
          <Connections />
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
