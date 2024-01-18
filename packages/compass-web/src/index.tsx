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
import {
  CompassComponentsProvider,
  SpinLoaderWithLabel,
  css,
} from '@mongodb-js/compass-components';
import { ConnectionString } from 'mongodb-connection-string-url';
import {
  WorkspaceTab as CollectionWorkspace,
  CollectionTabsProvider,
} from '@mongodb-js/compass-collection';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import CompassQueryBarPlugin from '@mongodb-js/compass-query-bar';
import { CompassDocumentsPlugin } from '@mongodb-js/compass-crud';
import {
  CompassAggregationsPlugin,
  CreateViewPlugin,
} from '@mongodb-js/compass-aggregations';
import { CompassSchemaPlugin } from '@mongodb-js/compass-schema';
import {
  CompassIndexesPlugin,
  DropIndexPlugin as DropIndexCollectionTabModal,
  CreateIndexPlugin as CreateIndexCollectionTabModal,
} from '@mongodb-js/compass-indexes';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import {
  CreateNamespacePlugin,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import {
  PreferencesProvider,
  SimplePreferenceService,
} from 'compass-preferences-model/provider';
import type { AllPreferences } from 'compass-preferences-model';
import FieldStorePlugin from '@mongodb-js/compass-field-store';

type CompassWebProps = {
  darkMode?: boolean;
  connectionString: string;
  initialPreferences?: Partial<AllPreferences>;
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
    <div data-testid="compass-web-loading" className={loadingContainerStyles}>
      <SpinLoaderWithLabel
        className={spinnerStyles}
        progressText={`Connecting to ${host}…`}
      ></SpinLoaderWithLabel>
    </div>
  );
}

const DEFAULT_TAB = { type: 'Databases' } as const;

const connectedContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
});

const CompassWeb = ({
  darkMode,
  connectionString,
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  initialPreferences,
  // @ts-expect-error not an interface we want to expose in any way, only for
  // testing purposes, should never be used otherwise
  __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
}: CompassWebProps) => {
  const preferencesAccess = new SimplePreferenceService({
    maxTimeMS: 10_000,
    enableExplainPlan: true,
    enableAggregationBuilderRunPipeline: true,
    enableAggregationBuilderExtraOptions: true,
    enableImportExport: false,
    enableSavedAggregationsQueries: false,
    ...initialPreferences,
  });
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<any | null>(null);
  const dataService = useRef<DataService>();

  useEffect(() => {
    const controller = new AbortController();
    let ds: DataService;
    void (async () => {
      try {
        const connectFn =
          (__TEST_MONGODB_DATA_SERVICE_CONNECT_FN as typeof connect) ?? connect;
        ds = await connectFn({
          connectionOptions: { connectionString },
          signal: controller.signal,
        });
        dataService.current = ds;
        setConnected(true);
      } catch (err) {
        setConnectionError(err);
      }
    })();
    return () => {
      void ds?.disconnect();
    };
  }, [connectionString, __TEST_MONGODB_DATA_SERVICE_CONNECT_FN]);

  // Re-throw connection error so that parent component can render an
  // appropriate error screen with an error boundary (only relevant while we are
  // handling a single connection)
  if (connectionError) {
    throw connectionError;
  }

  if (!connected || !dataService.current) {
    return (
      <CompassComponentsProvider darkMode={darkMode}>
        <LoadingScreen connectionString={connectionString}></LoadingScreen>
      </CompassComponentsProvider>
    );
  }

  return (
    <CompassComponentsProvider darkMode={darkMode}>
      <PreferencesProvider value={preferencesAccess}>
        <AppRegistryProvider>
          <DataServiceProvider value={dataService.current}>
            <CompassInstanceStorePlugin>
              <FieldStorePlugin>
                <WorkspacesProvider
                  value={[
                    DatabasesWorkspaceTab,
                    CollectionsWorkspaceTab,
                    CollectionWorkspace,
                  ]}
                >
                  <CollectionTabsProvider
                    queryBar={CompassQueryBarPlugin}
                    tabs={[
                      CompassDocumentsPlugin,
                      CompassAggregationsPlugin,
                      CompassSchemaPlugin,
                      CompassIndexesPlugin,
                      CompassSchemaValidationPlugin,
                    ]}
                    modals={[
                      ExplainPlanCollectionTabModal,
                      DropIndexCollectionTabModal,
                      CreateIndexCollectionTabModal,
                      ExportToLanguageCollectionTabModal,
                    ]}
                  >
                    <div
                      data-testid="compass-web-connected"
                      className={connectedContainerStyles}
                    >
                      <WorkspacesPlugin
                        initialWorkspaceTabs={initialWorkspaceTabs}
                        openOnEmptyWorkspace={DEFAULT_TAB}
                        onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
                        renderSidebar={() => {
                          return (
                            <CompassSidebarPlugin
                              showConnectionInfo={false}
                            ></CompassSidebarPlugin>
                          );
                        }}
                        renderModals={() => {
                          return (
                            <>
                              <CreateViewPlugin></CreateViewPlugin>
                              <CreateNamespacePlugin></CreateNamespacePlugin>
                              <DropNamespacePlugin></DropNamespacePlugin>
                              <RenameCollectionPlugin></RenameCollectionPlugin>
                            </>
                          );
                        }}
                      ></WorkspacesPlugin>
                    </div>
                  </CollectionTabsProvider>
                </WorkspacesProvider>
              </FieldStorePlugin>
            </CompassInstanceStorePlugin>
          </DataServiceProvider>
        </AppRegistryProvider>
      </PreferencesProvider>
    </CompassComponentsProvider>
  );
};

export { CompassWeb };
