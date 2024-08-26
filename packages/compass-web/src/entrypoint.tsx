import React, { useEffect, useRef } from 'react';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from 'hadron-app-registry';
import {
  type ConnectionInfo,
  ConnectionInfoProvider,
  useConnectionActions,
  useSingleConnectionModeConnectionInfoStatus,
} from '@mongodb-js/compass-connections/provider';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import type { OpenWorkspaceOptions } from '@mongodb-js/compass-workspaces';
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
import { AtlasServiceProvider } from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import { LoggerProvider } from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import CompassConnections from '@mongodb-js/compass-connections';
import {
  AtlasCloudConnectionStorageProvider,
  useSandboxAutoconnectInfo,
} from './connection-storage';
import { AtlasCloudAuthServiceProvider } from './atlas-auth-service';
import type {
  TrackFunction,
  LogFunction,
  DebugFunction,
} from './logger-and-telemetry';
import { useCompassWebLoggerAndTelemetry } from './logger-and-telemetry';
import { type TelemetryServiceOptions } from '@mongodb-js/compass-telemetry';

const WithAtlasProviders: React.FC = ({ children }) => {
  return (
    <AtlasCloudAuthServiceProvider>
      <AtlasServiceProvider>
        <AtlasAiServiceProvider>{children}</AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasCloudAuthServiceProvider>
  );
};

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
> & { connectionInfo: ConnectionInfo };

type CompassWebProps = {
  appName?: string;

  orgId: string;
  projectId: string;

  darkMode?: boolean;

  renderConnecting?: (connectionInfo: ConnectionInfo | null) => React.ReactNode;
  renderError?: (
    connectionInfo: ConnectionInfo | null,
    err: any
  ) => React.ReactNode;

  initialWorkspace: Extract<
    OpenWorkspaceOptions,
    { type: 'Databases' | 'Collections' | 'Collection' }
  >;
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];

  initialPreferences?: Partial<AllPreferences>;

  onLog?: LogFunction;
  onDebug?: DebugFunction;
  onTrack?: TrackFunction;

  onAutoconnectInfoRequest?: () => Promise<ConnectionInfo>;
};

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

const WithSingleConnectionState: React.FunctionComponent<{
  children: (
    status: ReturnType<typeof useSingleConnectionModeConnectionInfoStatus>
  ) => React.ReactNode;
}> = ({ children }) => {
  const status = useSingleConnectionModeConnectionInfoStatus();
  const actions = useConnectionActions();
  useEffect(() => {
    const intervalId = setInterval(() => {
      void actions.refreshConnections();
    }, /* Matches default polling intervals in mms codebase */ 60_000);
    return () => {
      clearInterval(intervalId);
    };
  }, [actions]);
  return <>{children(status)}</>;
};

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
  orgId,
  projectId,
  darkMode,
  initialWorkspace,
  onActiveWorkspaceTabChange,
  initialPreferences,
  renderConnecting = () => null,
  renderError = () => null,
  onLog,
  onDebug,
  onTrack,
  onAutoconnectInfoRequest,
}: CompassWebProps) => {
  const appRegistry = useRef(new AppRegistry());
  const logger = useCompassWebLoggerAndTelemetry({
    onLog,
    onDebug,
  });

  const preferencesAccess = useRef(
    new ReadOnlyPreferenceAccess({
      maxTimeMS: 10_000,
      enableExplainPlan: true,
      enableAggregationBuilderRunPipeline: true,
      enableAggregationBuilderExtraOptions: true,
      enableImportExport: false,
      enableGenAIFeatures: false,
      enableNewMultipleConnectionSystem: false,
      enablePerformanceAdvisorBanner: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: false,
      },
      maximumNumberOfActiveConnections: 1,
      trackUsageStatistics: true,
      ...initialPreferences,
    })
  );
  const initialWorkspaceRef = useRef(initialWorkspace);
  const initialWorkspaceTabsRef = useRef(
    initialWorkspaceRef.current ? [initialWorkspaceRef.current] : []
  );

  const onTrackRef = useRef(onTrack);

  const telemetryOptions = useRef<TelemetryServiceOptions>({
    sendTrack: (event: string, properties: Record<string, any> | undefined) => {
      onTrackRef.current && void onTrackRef.current(event, properties || {});
    },
    logger,
    preferences: preferencesAccess.current,
  });

  const sandboxAutoconnectOptions = useSandboxAutoconnectInfo();

  return (
    <GlobalAppRegistryProvider value={appRegistry.current}>
      <AppRegistryProvider scopeName="Compass Web Root">
        <CompassComponentsProvider
          darkMode={darkMode}
          // Making sure that compass-web modals and tooltips are definitely not
          // hidden by Cloud UI sidebar and page header
          stackedElementsZIndex={10_000}
          {...LINK_PROPS}
        >
          <PreferencesProvider value={preferencesAccess.current}>
            <LoggerProvider value={logger}>
              <TelemetryProvider options={telemetryOptions.current}>
                <WithAtlasProviders>
                  <AtlasCloudConnectionStorageProvider
                    orgId={orgId}
                    projectId={projectId}
                  >
                    <CompassConnections
                      appName={appName ?? 'Compass Web'}
                      onExtraConnectionDataRequest={() => {
                        return Promise.resolve([{}, null] as [
                          Record<string, unknown>,
                          null
                        ]);
                      }}
                      onAutoconnectInfoRequest={
                        onAutoconnectInfoRequest ??
                        (() => {
                          return Promise.resolve(
                            sandboxAutoconnectOptions ?? undefined
                          );
                        })
                      }
                    >
                      <CompassInstanceStorePlugin>
                        <FieldStorePlugin>
                          <WithSingleConnectionState>
                            {({
                              isConnected,
                              connectionInfo,
                              connectionError,
                            }) => {
                              return isConnected && connectionInfo ? (
                                <AppRegistryProvider
                                  key={connectionInfo.id}
                                  scopeName="Connected Application"
                                >
                                  <ConnectionInfoProvider
                                    connectionInfoId={connectionInfo.id}
                                  >
                                    <CompassWorkspace
                                      connectionInfo={connectionInfo}
                                      initialWorkspaceTabs={
                                        initialWorkspaceTabsRef.current
                                      }
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
                              );
                            }}
                          </WithSingleConnectionState>
                        </FieldStorePlugin>
                      </CompassInstanceStorePlugin>
                    </CompassConnections>
                  </AtlasCloudConnectionStorageProvider>
                </WithAtlasProviders>
              </TelemetryProvider>
            </LoggerProvider>
          </PreferencesProvider>
        </CompassComponentsProvider>
      </AppRegistryProvider>
    </GlobalAppRegistryProvider>
  );
};

export { CompassWeb };
