import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';
import { AppRegistryProvider } from 'hadron-app-registry';
import { DataServiceProvider } from 'mongodb-data-service/provider';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import {
  DatabasesWorkspaceTab,
  CollectionsWorkspaceTab,
} from '@mongodb-js/compass-databases-collections';
import { SpinLoaderWithLabel, css } from '@mongodb-js/compass-components';
import { ConnectionString } from 'mongodb-connection-string-url';

type CompassWebProps = {
  connectionString: string;
} & Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
>;

const loadingContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const spinnerStyles = css({
  flex: 'none',
});

function LoadingScreen({ connectionString }: { connectionString: string }) {
  const host = useMemo(() => {
    try {
      const url = new ConnectionString(connectionString);
      return url.hosts[0];
    } catch {
      return 'cluster';
    }
  }, [connectionString]);

  return (
    <div className={loadingContainerStyles}>
      <SpinLoaderWithLabel
        className={spinnerStyles}
        progressText={`Connecting to ${host}…`}
      ></SpinLoaderWithLabel>
    </div>
  );
}

const DEFAULT_TAB = { type: 'Databases' } as const;

const CompassWeb = ({
  connectionString,
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
}: CompassWebProps) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<any | null>(null);
  const dataService = useRef<DataService>();

  useEffect(() => {
    const controller = new AbortController();
    let ds: DataService;
    void (async () => {
      try {
        ds = await connect({
          connectionOptions: { connectionString },
          signal: controller.signal,
        });
        dataService.current = ds;
        setConnected(true);
      } catch (err) {
        // TODO: logger
        // eslint-disable-next-line no-console
        console.error(err);
        setConnectionError(err);
      }
    })();
    return () => {
      void ds?.disconnect();
    };
  }, [connectionString]);

  // Re-throw connection error so that parent component can render an
  // appropriate error screen with an error boundary (only relevant while we are
  // handling a single connection)
  if (connectionError) {
    throw connectionError;
  }

  if (connected && dataService.current) {
    return (
      <AppRegistryProvider>
        <DataServiceProvider value={dataService.current}>
          <CompassInstanceStorePlugin>
            <WorkspacesProvider
              value={[DatabasesWorkspaceTab, CollectionsWorkspaceTab]}
            >
              <WorkspacesPlugin
                initialWorkspaceTabs={initialWorkspaceTabs}
                openOnEmptyWorkspace={DEFAULT_TAB}
                onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
                renderSidebar={() => {
                  return null;
                }}
                renderModals={() => {
                  return null;
                }}
              ></WorkspacesPlugin>
            </WorkspacesProvider>
          </CompassInstanceStorePlugin>
        </DataServiceProvider>
      </AppRegistryProvider>
    );
  }

  return <LoadingScreen connectionString={connectionString}></LoadingScreen>;
};

export { CompassWeb };
