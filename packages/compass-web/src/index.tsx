import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { connect } from 'mongodb-data-service';
import { AppRegistryProvider } from 'hadron-app-registry';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
} from '@mongodb-js/compass-connections/provider';
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
  ReadOnlyPreferenceAccess,
} from 'compass-preferences-model/provider';
import type { AllPreferences } from 'compass-preferences-model';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/renderer';
import { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

class CloudAtlasAuthService extends AtlasAuthService {
  signIn() {
    return this.getUserInfo();
  }
  signOut() {
    return Promise.resolve();
  }
  isAuthenticated() {
    return Promise.resolve(true);
  }
  getUserInfo(): Promise<AtlasUserInfo> {
    throw new Error('CloudAtlasAuthService.getUserInfo not implemented');
  }
  getAuthHeaders() {
    return Promise.resolve({});
  }
}

const WithAtlasProviders: React.FC = ({ children }) => {
  return (
    <AtlasAuthServiceProvider value={new CloudAtlasAuthService()}>
      <AtlasServiceProvider>
        <AtlasAiServiceProvider>{children}</AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasAuthServiceProvider>
  );
};

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
>;

type CompassWebProps = {
  darkMode?: boolean;
  connectionInfo: ConnectionInfo;
  initialPreferences?: Partial<AllPreferences>;
} & CompassWorkspaceProps;

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

function CompassWorkspace({
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
}: CompassWorkspaceProps) {
  return (
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
  connectionInfo,
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  initialPreferences,
  // @ts-expect-error not an interface we want to expose in any way, only for
  // testing purposes, should never be used otherwise
  __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
}: CompassWebProps) => {
  const preferencesAccess = useRef(
    new ReadOnlyPreferenceAccess({
      maxTimeMS: 10_000,
      enableExplainPlan: true,
      enableAggregationBuilderRunPipeline: true,
      enableAggregationBuilderExtraOptions: true,
      enableAtlasSearchIndexes: false,
      enableImportExport: false,
      enableGenAIFeatures: false,
      enableNewMultipleConnectionSystem: false,
      enableHackoladeBanner: false,
      enablePerformanceAdvisorBanner: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: false,
      },
      maximumNumberOfActiveConnections: 1,
      ...initialPreferences,
    })
  );
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<any | null>(null);
  const { log } = useLoggerAndTelemetry('CONNECTIONS-MANAGER');
  const connectionsManager = useRef(
    new ConnectionsManager({
      logger: log.unbound,
      __TEST_CONNECT_FN: __TEST_MONGODB_DATA_SERVICE_CONNECT_FN as
        | typeof connect
        | undefined,
    })
  );

  useEffect(() => {
    const connectionsManagerCurrent = connectionsManager.current;
    void (async () => {
      try {
        await connectionsManagerCurrent.connect(connectionInfo, {
          forceConnectionOptions: [],
          onDatabaseSecretsChange() {
            // noop
          },
          onNotifyOIDCDeviceFlow() {
            // noop
          },
        });
        setConnected(true);
      } catch (err) {
        setConnectionError(err);
      }
    })();
    return () => {
      void connectionsManagerCurrent.closeConnection(connectionInfo.id);
    };
  }, [connectionInfo, __TEST_MONGODB_DATA_SERVICE_CONNECT_FN]);

  // Re-throw connection error so that parent component can render an
  // appropriate error screen with an error boundary (only relevant while we are
  // handling a single connection)
  if (connectionError) {
    throw connectionError;
  }

  const linkProps = {
    utmSource: 'DE',
    utmMedium: 'product',
  };

  return (
    <CompassComponentsProvider darkMode={darkMode} {...linkProps}>
      <PreferencesProvider value={preferencesAccess.current}>
        <WithAtlasProviders>
          <AppRegistryProvider scopeName="Compass Web Root">
            <ConnectionsManagerProvider value={connectionsManager.current}>
              <CompassInstanceStorePlugin>
                <ConnectionInfoProvider value={connectionInfo}>
                  {connected ? (
                    <FieldStorePlugin>
                      <CompassWorkspace
                        initialWorkspaceTabs={initialWorkspaceTabs}
                        onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
                      />
                    </FieldStorePlugin>
                  ) : (
                    <LoadingScreen
                      connectionString={
                        connectionInfo.connectionOptions.connectionString
                      }
                    ></LoadingScreen>
                  )}
                </ConnectionInfoProvider>
              </CompassInstanceStorePlugin>
            </ConnectionsManagerProvider>
          </AppRegistryProvider>
        </WithAtlasProviders>
      </PreferencesProvider>
    </CompassComponentsProvider>
  );
};

export { CompassWeb } from './entrypoint';
