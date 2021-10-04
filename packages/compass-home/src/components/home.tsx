/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';
import DataService from 'mongodb-data-service';
import toNS from 'mongodb-ns';
import AppRegistry from 'hadron-app-registry';

import Workspace from './workspace';
import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import getRoleOrNull from '../modules/get-role-or-null';

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

function Home({
  appRegistry,
}: {
  appRegistry: AppRegistry;
}): React.ReactElement | null {
  const connectRole = useRef(getRoleOrNull(appRegistry, 'Application.Connect'));

  const [dataService, setDataService] = useState<DataService | null>(null);
  const [isDataLake, setIsDataLake] = useState(false);
  const [namespace, setNamespace] = useState<Namespace>(defaultNS);

  const [errorLoadingInstanceMessage, setErrorMessage] = useState<
    null | string
  >(null);
  const [instanceLoadingStatus, setInstanceLoadingStatus] = useState(
    InstanceLoadedStatus.LOADING
  );

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
        setErrorMessage(instanceInformation.errorMessage);
        setInstanceLoadingStatus(InstanceLoadedStatus.ERROR);

        return;
      }

      setInstanceLoadingStatus(InstanceLoadedStatus.LOADED);

      if (instanceInformation.instance?.dataLake?.isDataLake) {
        setIsDataLake(true);
      } else {
        setIsDataLake(false);
      }
    }
    appRegistry.on('instance-refreshed', onInstanceRefreshed);

    function onDataServiceConnected(
      err: Error | undefined | null,
      ds: DataService
    ) {
      const StatusAction = appRegistry.getAction('Status.Actions');
      if (StatusAction) {
        (
          StatusAction as {
            configure: (opts: {
              animation: boolean;
              message: string;
              visible: boolean;
            }) => void;
          }
        ).configure({
          animation: true,
          message: 'Loading navigation',
          visible: true,
        });
      }

      setNamespace(toNS(''));
      setDataService(ds);
      setInstanceLoadingStatus(InstanceLoadedStatus.LOADING);
    }
    appRegistry.on('data-service-connected', onDataServiceConnected);

    function onDataServiceDisconnected() {
      if (instanceLoadingStatus !== InstanceLoadedStatus.LOADING) {
        const StatusAction = appRegistry.getAction('Status.Actions');
        setDataService(null);
        setErrorMessage(null);
        setIsDataLake(false);
        setNamespace(toNS(''));
        setInstanceLoadingStatus(InstanceLoadedStatus.LOADING);
        if (StatusAction) (StatusAction as { done: () => void }).done();

        return;
      }

      const timer = setInterval(() => {
        if (instanceLoadingStatus !== InstanceLoadedStatus.LOADING) {
          const StatusAction = appRegistry.getAction('Status.Actions');
          setDataService(null);
          setErrorMessage(null);
          setIsDataLake(false);
          setNamespace(toNS(''));
          setInstanceLoadingStatus(InstanceLoadedStatus.LOADING);
          if (StatusAction) (StatusAction as { done: () => void }).done();
          clearInterval(timer);
        }
      }, 100);
    }
    appRegistry.on('data-service-disconnected', onDataServiceDisconnected);

    function onSelectDatabase(ns: string) {
      setNamespace(toNS(ns));
    }
    appRegistry.on('select-database', onSelectDatabase);

    function onSelectNamespace(meta: { namespace: string }) {
      setNamespace(toNS(meta.namespace));
    }
    appRegistry.on('select-namespace', onSelectNamespace);

    function onSelectInstance() {
      setNamespace(toNS(''));
    }
    appRegistry.on('select-instance', onSelectInstance);

    function onOpenNamespaceInNewTab(meta: { namespace: string }) {
      setNamespace(toNS(meta.namespace));
    }
    appRegistry.on('open-namespace-in-new-tab', onOpenNamespaceInNewTab);

    function onAllTabsClosed() {
      setNamespace(toNS(''));
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
        appRegistry={appRegistry}
        namespace={namespace}
        instanceLoadingStatus={instanceLoadingStatus}
        errorLoadingInstanceMessage={errorLoadingInstanceMessage}
        isDataLake={isDataLake}
      />
    );
  }

  if (!connectRole.current) {
    return null;
  }

  const Connect = connectRole.current[0].component;
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
