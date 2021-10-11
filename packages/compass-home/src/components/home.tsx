/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useEffect, useReducer } from 'react';
import {
  DataService,
  getConnectionTitle,
  ConnectionInfo,
} from 'mongodb-data-service';
import toNS from 'mongodb-ns';

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
  height: '100%',
  zIndex: 0,
});

const defaultNS: Namespace = {
  database: '',
  collection: '',
};

type State = {
  connectionTitle: string;
  dataService: DataService | null;
  isDataLake: boolean;
  namespace: Namespace;
  errorLoadingInstanceMessage: string | null;
  instanceLoadingStatus: InstanceLoadedStatus;
};

const initialState = {
  connectionTitle: '',
  dataService: null,
  isDataLake: false,
  namespace: defaultNS,
  errorLoadingInstanceMessage: null,
  instanceLoadingStatus: InstanceLoadedStatus.INITIAL,
};

type Action =
  | {
      type: 'connected';
      dataService: DataService;
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
        dataService: action.dataService,
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
      dataService,
      isDataLake,
      namespace,
      errorLoadingInstanceMessage,
      instanceLoadingStatus,
    },
    dispatch,
  ] = useReducer(reducer, { ...initialState });

  useEffect(() => {
    // Setup listeners.
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
    appRegistry.on('instance-refreshed', onInstanceRefreshed);

    function onDataServiceConnected(
      err: Error | undefined | null,
      ds: DataService,
      connectionInfo: ConnectionInfo
    ) {
      const StatusAction = appRegistry.getAction(
        AppRegistryActions.STATUS_ACTIONS
      ) as StatusActionType | undefined;
      if (StatusAction) {
        StatusAction.configure({
          animation: true,
          message: 'Loading navigation',
          visible: true,
        });
      }

      dispatch({
        type: 'connected',
        dataService: ds,
        connectionTitle: getConnectionTitle(connectionInfo) || '',
      });
    }
    appRegistry.on('data-service-connected', onDataServiceConnected);

    function onDataServiceDisconnected() {
      if (instanceLoadingStatus !== InstanceLoadedStatus.LOADING) {
        const StatusAction = appRegistry.getAction(
          AppRegistryActions.STATUS_ACTIONS
        ) as StatusActionType | undefined;
        dispatch({
          type: 'disconnected',
        });
        updateTitle(appName);
        if (StatusAction) StatusAction.done();

        return;
      }

      const timer = setInterval(() => {
        if (instanceLoadingStatus !== InstanceLoadedStatus.LOADING) {
          const StatusAction = appRegistry.getAction(
            AppRegistryActions.STATUS_ACTIONS
          ) as StatusActionType | undefined;
          dispatch({
            type: 'disconnected',
          });
          updateTitle(appName);
          if (StatusAction) StatusAction.done();
          clearInterval(timer);
        }
      }, 100);
    }
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);

    function onSelectDatabase(ns: string) {
      dispatch({
        type: 'update-namespace',
        namespace: toNS(ns),
      });
    }
    appRegistry.on('select-database', onSelectDatabase);

    function onSelectNamespace(meta: { namespace: string }) {
      dispatch({
        type: 'update-namespace',
        namespace: toNS(meta.namespace),
      });
    }
    appRegistry.on('select-namespace', onSelectNamespace);

    function onSelectInstance() {
      dispatch({
        type: 'update-namespace',
        namespace: toNS(''),
      });
    }
    appRegistry.on('select-instance', onSelectInstance);

    function onOpenNamespaceInNewTab(meta: { namespace: string }) {
      dispatch({
        type: 'update-namespace',
        namespace: toNS(meta.namespace),
      });
    }
    appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);

    function onAllTabsClosed() {
      dispatch({
        type: 'update-namespace',
        namespace: toNS(''),
      });
    }
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

  if (dataService) {
    return (
      <Workspace
        appName={appName}
        connectionTitle={connectionTitle}
        namespace={namespace}
        instanceLoadingStatus={instanceLoadingStatus}
        errorLoadingInstanceMessage={errorLoadingInstanceMessage}
        isDataLake={isDataLake}
      />
    );
  }

  if (!connectRole) {
    return null;
  }

  const Connect = connectRole[0].component;
  return (
    <div css={homeViewStyles} data-test-id="home-view">
      <div css={homePageStyles}>
        <Connect />
      </div>
    </div>
  );
}

Home.displayName = 'HomeComponent';

export default Home;
