import React, { useCallback, useRef, useState } from 'react';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from 'hadron-app-registry';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  type ConnectionInfo,
  ConnectionInfoProvider,
} from '@mongodb-js/compass-connections/provider';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import {
  DatabasesWorkspaceTab,
  CollectionsWorkspaceTab,
} from '@mongodb-js/compass-databases-collections';
import { CompassComponentsProvider, css } from '@mongodb-js/compass-components';
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
import type { AllPreferences } from 'compass-preferences-model/provider';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import {
  AtlasAuthService,
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import { ConnectionStorageProvider } from '@mongodb-js/connection-storage/provider';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import CompassConnections from '@mongodb-js/compass-connections';
import { CompassWebConnectionStorage } from './compass-web-connection-storage';

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

const atlasAuthService = new CloudAtlasAuthService();

const WithAtlasProviders: React.FC = ({ children }) => {
  return (
    <AtlasAuthServiceProvider value={atlasAuthService}>
      <AtlasServiceProvider>
        <AtlasAiServiceProvider>{children}</AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasAuthServiceProvider>
  );
};

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
> & { connectionInfo: ConnectionInfo };

type CompassWebProps = {
  appName?: string;
  darkMode?: boolean;
  stackedElementsZIndex?: number;
  onAutoconnectInfoRequest: () => Promise<ConnectionInfo>;
  renderConnecting?: (connectionInfo: ConnectionInfo | null) => React.ReactNode;
  renderError?: (
    connectionInfo: ConnectionInfo | null,
    err: any
  ) => React.ReactNode;
  initialPreferences?: Partial<AllPreferences>;
} & Pick<
  CompassWorkspaceProps,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
>;

function CompassWorkspace({
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  connectionInfo,
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
            openOnEmptyWorkspace={{
              type: 'Databases',
              connectionId: connectionInfo.id,
            }}
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

const LINK_PROPS = {
  utmSource: 'DE',
  utmMedium: 'product',
} as const;

const connectedContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
});

const CompassWeb = ({
  appName,
  darkMode,
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  initialPreferences,
  stackedElementsZIndex,
  onAutoconnectInfoRequest,
  renderConnecting = () => null,
  renderError = () => null,
  // @ts-expect-error not an interface we want to expose in any way, only for
  // testing purposes, should never be used otherwise
  __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
}: CompassWebProps) => {
  // It's imperative that this method doesn't change during render otherwise the
  // application will be stuck in a neverending re-connect loop
  const onAutoconnectInfoRequestRef = useRef(onAutoconnectInfoRequest);
  const appRegistry = useRef(new AppRegistry());
  const loggerAndTelemetry = useLoggerAndTelemetry('COMPASS-WEB-UI');

  const connectionsManager = useRef(
    new ConnectionsManager({
      appName,
      logger: loggerAndTelemetry.log.unbound,
      __TEST_CONNECT_FN: __TEST_MONGODB_DATA_SERVICE_CONNECT_FN,
    })
  );

  const [{ connectionInfo, isConnected, connectionError }, setConnectedState] =
    useState<{
      connectionInfo: ConnectionInfo | null;
      isConnected: boolean;
      connectionError: any | null;
    }>({ connectionInfo: null, isConnected: false, connectionError: null });

  const onConnected = useCallback((connectionInfo: ConnectionInfo) => {
    setConnectedState({
      isConnected: true,
      connectionInfo,
      connectionError: null,
    });
  }, []);

  const onConnectionFailed = useCallback(
    (connectionInfo: ConnectionInfo | null, error: Error) => {
      setConnectedState((prevState) => {
        return {
          isConnected: false,
          connectionInfo: connectionInfo ?? prevState.connectionInfo,
          connectionError: error,
        };
      });
    },
    []
  );

  const onConnectionAttemptStarted = useCallback(
    (connectionInfo: ConnectionInfo) => {
      setConnectedState({
        isConnected: false,
        connectionInfo,
        connectionError: null,
      });
    },
    []
  );

  const connectionStorage = useRef(
    new CompassWebConnectionStorage(onAutoconnectInfoRequestRef.current)
  );

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

  return (
    <GlobalAppRegistryProvider value={appRegistry.current}>
      <AppRegistryProvider scopeName="Compass Web Root">
        <CompassComponentsProvider
          darkMode={darkMode}
          stackedElementsZIndex={stackedElementsZIndex}
          {...LINK_PROPS}
        >
          <PreferencesProvider value={preferencesAccess.current}>
            <WithAtlasProviders>
              <ConnectionStorageProvider value={connectionStorage.current}>
                <ConnectionsManagerProvider value={connectionsManager.current}>
                  <CompassConnections
                    onConnectionAttemptStarted={onConnectionAttemptStarted}
                    onConnectionFailed={onConnectionFailed}
                    onConnected={onConnected}
                  >
                    <CompassInstanceStorePlugin>
                      <FieldStorePlugin>
                        {isConnected && connectionInfo ? (
                          <AppRegistryProvider
                            key={connectionInfo.id}
                            scopeName="Connected Application"
                          >
                            <ConnectionInfoProvider
                              connectionInfoId={connectionInfo.id}
                            >
                              <CompassWorkspace
                                connectionInfo={connectionInfo}
                                initialWorkspaceTabs={initialWorkspaceTabs}
                                onActiveWorkspaceTabChange={
                                  onActiveWorkspaceTabChange
                                }
                              />
                            </ConnectionInfoProvider>
                          </AppRegistryProvider>
                        ) : connectionError ? (
                          renderError(connectionInfo, connectionError)
                        ) : (
                          renderConnecting(connectionInfo)
                        )}
                      </FieldStorePlugin>
                    </CompassInstanceStorePlugin>
                  </CompassConnections>
                </ConnectionsManagerProvider>
              </ConnectionStorageProvider>
            </WithAtlasProviders>
          </PreferencesProvider>
        </CompassComponentsProvider>
      </AppRegistryProvider>
    </GlobalAppRegistryProvider>
  );
};

export { CompassWeb };
