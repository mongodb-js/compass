import React, { useEffect, useRef } from 'react';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from 'hadron-app-registry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useConnectionActions } from '@mongodb-js/compass-connections/provider';
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
import { CompassIndexesPlugin } from '@mongodb-js/compass-indexes';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import { CompassGlobalWritesPlugin } from '@mongodb-js/compass-global-writes';
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import {
  CreateNamespacePlugin,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import {
  PreferencesProvider,
  CompassWebPreferencesAccess,
} from 'compass-preferences-model/provider';
import type { AllPreferences } from 'compass-preferences-model/provider';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import { AtlasServiceProvider } from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import { LoggerProvider } from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import CompassConnections from '@mongodb-js/compass-connections';
import { AtlasCloudConnectionStorageProvider } from './connection-storage';
import { AtlasCloudAuthServiceProvider } from './atlas-auth-service';
import type {
  TrackFunction,
  LogFunction,
  DebugFunction,
} from './logger-and-telemetry';
import { useCompassWebLoggerAndTelemetry } from './logger-and-telemetry';
import { type TelemetryServiceOptions } from '@mongodb-js/compass-telemetry';
import { WorkspaceTab as WelcomeWorkspaceTab } from '@mongodb-js/compass-welcome';

const WithAtlasProviders: React.FC = ({ children }) => {
  return (
    <AtlasCloudAuthServiceProvider>
      <AtlasServiceProvider>
        <AtlasAiServiceProvider apiURLPreset="cloud">
          {children}
        </AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasCloudAuthServiceProvider>
  );
};

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
> &
  Pick<
    React.ComponentProps<typeof CompassSidebarPlugin>,
    'onOpenConnectViaModal'
  >;

type CompassWebProps = {
  /**
   * App name to be passed with the connection string when connection to a
   * cluster (default: "Compass Web")
   */
  appName?: string;

  /**
   * Atlas Cloud organization id
   */
  orgId: string;
  /**
   * Atlas Cloud project id (sometimes called group id)
   */
  projectId: string;

  /**
   * Whether or not darkMode should be active for the app
   */
  darkMode?: boolean;

  /**
   * Optional. If passed, compass-web will try to find connection info with that
   * id in connection storage and pass it as autoconnect info to the
   * compass-connections
   */
  initialAutoconnectId?: string;
  /**
   * Optional. If passed, compass-web will open provided workspace right away.
   * If workspace requires active connection, the connectionId from the
   * workspace will be used for the autoconnect info getter. In that case
   * connectionId from the workspace takes precedence over
   * `initialAutoconnectId`
   */
  initialWorkspace?: OpenWorkspaceOptions;
  /**
   * Callback prop called when current active workspace changes. Can be used to
   * communicate current workspace back to the parent component for example to
   * sync router with the current active workspace
   */
  onActiveWorkspaceTabChange: React.ComponentProps<
    typeof WorkspacesPlugin
  >['onActiveWorkspaceTabChange'];

  /**
   * Set of initial preferences to override default values
   */
  initialPreferences?: Partial<AllPreferences>;

  /**
   * Callback prop called every time any code inside Compass logs something
   */
  onLog?: LogFunction;
  /**
   * Callback prop called every time any code inside Compass prints a debug
   * statement
   */
  onDebug?: DebugFunction;
  /**
   * Callback prop called for every track event inside Compass
   */
  onTrack?: TrackFunction;

  /**
   * Callback prop that will be called with atlas metadata for a certain cluster
   * when the action is selected from the sidebar actions. Should be used to
   * show the Atlas Cloud "Connect" modal
   */
  onOpenConnectViaModal?: (
    atlasMetadata: ConnectionInfo['atlasMetadata']
  ) => void;
};

function CompassWorkspace({
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  onOpenConnectViaModal,
}: CompassWorkspaceProps) {
  return (
    <WorkspacesProvider
      value={[
        WelcomeWorkspaceTab,
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
          CompassGlobalWritesPlugin,
        ]}
        modals={[
          ExplainPlanCollectionTabModal,
          ExportToLanguageCollectionTabModal,
        ]}
      >
        <div
          data-testid="compass-web-connected"
          className={connectedContainerStyles}
        >
          <WorkspacesPlugin
            initialWorkspaceTabs={initialWorkspaceTabs}
            openOnEmptyWorkspace={{ type: 'Welcome' }}
            onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
            renderSidebar={() => {
              return (
                <CompassSidebarPlugin
                  showSidebarHeader={false}
                  onOpenConnectViaModal={onOpenConnectViaModal}
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

const WithConnectionsStore: React.FunctionComponent<{
  children: React.ReactElement;
}> = ({ children }) => {
  const actions = useConnectionActions();
  useEffect(() => {
    const intervalId = setInterval(() => {
      void actions.refreshConnections();
    }, /* Matches default polling intervals in mms codebase */ 60_000);
    return () => {
      clearInterval(intervalId);
    };
  }, [actions]);
  return <>{children}</>;
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
  initialAutoconnectId,
  initialWorkspace,
  onActiveWorkspaceTabChange,
  initialPreferences,
  onLog,
  onDebug,
  onTrack,
  onOpenConnectViaModal,
}: CompassWebProps) => {
  const appRegistry = useRef(new AppRegistry());
  const logger = useCompassWebLoggerAndTelemetry({
    onLog,
    onDebug,
  });

  const preferencesAccess = useRef(
    new CompassWebPreferencesAccess({
      maxTimeMS: 10_000,
      enableExplainPlan: true,
      enableAggregationBuilderRunPipeline: true,
      enableAggregationBuilderExtraOptions: true,
      enableImportExport: false,
      enableGenAIFeatures: false,
      enableMultipleConnectionSystem: true,
      enablePerformanceAdvisorBanner: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: false,
      },
      maximumNumberOfActiveConnections: 10,
      trackUsageStatistics: true,
      enableShell: false,
      enableCreatingNewConnections: false,
      enableGlobalWrites: false,
      optInDataExplorerGenAIFeatures: false,
      ...initialPreferences,
    })
  );
  const initialWorkspaceRef = useRef(initialWorkspace);
  const initialWorkspaceTabsRef = useRef(
    initialWorkspaceRef.current ? [initialWorkspaceRef.current] : []
  );

  const autoconnectId =
    initialWorkspaceRef.current &&
    initialWorkspaceRef.current.type !== 'Welcome' &&
    initialWorkspaceRef.current?.type !== 'My Queries'
      ? initialWorkspaceRef.current.connectionId
      : initialAutoconnectId ?? undefined;

  const onTrackRef = useRef(onTrack);

  const telemetryOptions = useRef<TelemetryServiceOptions>({
    sendTrack: (event: string, properties: Record<string, any> | undefined) => {
      onTrackRef.current && void onTrackRef.current(event, properties || {});
    },
    logger,
    preferences: preferencesAccess.current,
  });

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
                      onAutoconnectInfoRequest={(connectionStore) => {
                        if (autoconnectId) {
                          return connectionStore.loadAll().then(
                            (connections) => {
                              return connections.find(
                                (connectionInfo) =>
                                  connectionInfo.id === autoconnectId
                              );
                            },
                            (err) => {
                              const { log, mongoLogId } = logger;
                              log.warn(
                                mongoLogId(1_001_000_329),
                                'Compass Web',
                                'Could not load connections when trying to autoconnect',
                                { err: err.message }
                              );
                              return undefined;
                            }
                          );
                        }
                        return Promise.resolve(undefined);
                      }}
                    >
                      <CompassInstanceStorePlugin>
                        <FieldStorePlugin>
                          <WithConnectionsStore>
                            <CompassWorkspace
                              initialWorkspaceTabs={
                                initialWorkspaceTabsRef.current
                              }
                              onActiveWorkspaceTabChange={
                                onActiveWorkspaceTabChange
                              }
                              onOpenConnectViaModal={onOpenConnectViaModal}
                            />
                          </WithConnectionsStore>
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
