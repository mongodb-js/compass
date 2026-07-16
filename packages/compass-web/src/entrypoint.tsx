import React, { useEffect, useMemo, useRef } from 'react';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from '@mongodb-js/compass-app-registry';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { useConnectionActions } from '@mongodb-js/compass-connections/provider';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import WorkspacesPlugin, {
  WorkspacesProvider,
  WorkspacesStorageServiceProviderWeb,
} from '@mongodb-js/compass-workspaces';
import {
  CollectionsWorkspaceTab,
  CreateNamespacePlugin,
  DatabasesWorkspaceTab,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import {
  CompassComponentsProvider,
  css,
  useInitialValue,
  openToast,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';
import {
  CollectionTabsProvider,
  WorkspaceTab as CollectionWorkspace,
} from '@mongodb-js/compass-collection';
import {
  AtlasClusterConnectionsOnlyProvider,
  CompassSidebarPlugin,
} from '@mongodb-js/compass-sidebar';
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
import { CompassGenerativeAIPlugin } from '@mongodb-js/compass-generative-ai';
import { CompassSettingsPlugin } from '@mongodb-js/compass-settings';
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import {
  type CompassWebPreferencesAccess,
  PreferencesProvider,
  usePreferences,
} from 'compass-preferences-model/provider';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import {
  atlasServiceLocator,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import {
  AtlasAiServiceProvider,
  ToolsControllerProvider,
} from '@mongodb-js/compass-generative-ai/provider';
import {
  LoggerProvider,
  useLogger,
} from '@mongodb-js/compass-logging/provider';
import {
  TelemetryProvider,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import CompassConnections from '@mongodb-js/compass-connections';
import { AtlasCloudConnectionStorageProvider } from './connection-storage';
import { AtlasCloudAuthServiceProvider } from './atlas-auth-service';
import type {
  TrackFunction,
  DebugFunction,
  LogFunction,
} from './logger-and-telemetry';
import { useCompassWebLoggerAndTelemetry } from './logger-and-telemetry';
import { WebWorkspaceTab as WelcomeWorkspaceTab } from '@mongodb-js/compass-welcome';
import { WorkspaceTab as MyQueriesWorkspace } from '@mongodb-js/compass-saved-aggregations-queries';
import {
  prefetchCompassWebPreferences,
  useCompassWebPreferences,
} from './preferences';
import { DataModelingWorkspaceTab as DataModelingWorkspace } from '@mongodb-js/compass-data-modeling';
import { DataModelStorageServiceProviderWeb } from '@mongodb-js/compass-data-modeling/web';
import {
  createWebRecentQueryStorage,
  createWebFavoriteQueryStorage,
  createWebPipelineStorage,
} from '@mongodb-js/my-queries-storage/web';
import {
  PipelineStorageProvider,
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
  type FavoriteQueryStorageAccess,
  type RecentQueryStorageAccess,
  type PipelineStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import { createServiceProvider } from '@mongodb-js/compass-app-registry';
import { CompassAssistantProvider } from '@mongodb-js/compass-assistant';
import { CompassAssistantDrawerWithConnections } from './compass-assistant-drawer';
import { APP_NAMES_FOR_PROMPT } from '@mongodb-js/compass-assistant';
import { Link, setMultiplexLink } from './multiplex-link';
import { useSyncHistory } from './use-sync-history';
import type { History } from './use-sync-history';
import { defaultHeaders } from './url-builder';

// Kick off the preferences request as the entrypoint loads, before React
// renders, so the data is ready by the time Compass mounts.
setTimeout(prefetchCompassWebPreferences);

const preferencesLoadingContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const WithAtlasProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AtlasCloudAuthServiceProvider>
      <AtlasClusterConnectionsOnlyProvider value={true}>
        <AtlasServiceProvider
          options={{
            defaultHeaders,
          }}
        >
          <AtlasAiServiceProvider apiURLPreset="cloud">
            {children}
          </AtlasAiServiceProvider>
        </AtlasServiceProvider>
      </AtlasClusterConnectionsOnlyProvider>
    </AtlasCloudAuthServiceProvider>
  );
};

const WithMultiplexTransport = createServiceProvider(
  function WithMultiplexTransport({
    projectId,
    children,
  }: {
    projectId: string;
    children: React.ReactNode;
  }) {
    const abortControllerRef = useRef(new AbortController());
    const logger = useLogger('COMPASS-WEB-MULTIPLEXING');
    const atlasService = atlasServiceLocator();
    const ccsUrls = useMemo(
      () => atlasService.multiplexWebsocketEndpoint(projectId),
      [atlasService, projectId]
    );

    useEffect(() => {
      const abortController = abortControllerRef.current;

      const link = new Link({
        baseUrls: ccsUrls,
        logger,
      });

      setMultiplexLink(link);
      void link.connect(abortController.signal).catch((err: Error) => {
        if (err.name === 'AbortError') {
          return;
        }
        logger.log.error(
          logger.mongoLogId(1_001_000_427),
          'COMPASS-WEB-MULTIPLEXING',
          'Multiplex WebSocket transport failed',
          { error: err.message }
        );
        openToast('multiplex-websocket-connection-failed', {
          title: 'WebSocket Connection Failed',
          description: err.message,
          variant: 'warning',
        });
      });
      return () => {
        abortController.abort();
        link.close('Compass Web Entrypoint Unmount');
        setMultiplexLink(null);
      };
    }, [ccsUrls, logger]);

    return <>{children}</>;
  }
);

const WithStorageProviders = createServiceProvider(
  function WithStorageProviders({
    orgId,
    projectId,
    children,
  }: {
    orgId: string;
    projectId: string;
    children: React.ReactNode;
  }) {
    const atlasService = atlasServiceLocator();

    const pipelineStorage = useRef<PipelineStorageAccess>({
      getStorage() {
        return createWebPipelineStorage({
          orgId,
          projectId,
          atlasService,
        });
      },
    });
    const favoriteQueryStorage = useRef<FavoriteQueryStorageAccess>({
      getStorage() {
        return createWebFavoriteQueryStorage({
          orgId,
          projectId,
          atlasService,
        });
      },
    });
    const recentQueryStorage = useRef<RecentQueryStorageAccess>({
      getStorage() {
        return createWebRecentQueryStorage({
          orgId,
          projectId,
          atlasService,
        });
      },
    });
    return (
      <PipelineStorageProvider value={pipelineStorage.current}>
        <FavoriteQueryStorageProvider value={favoriteQueryStorage.current}>
          <RecentQueryStorageProvider value={recentQueryStorage.current}>
            <WorkspacesStorageServiceProviderWeb
              orgId={orgId}
              projectId={projectId}
              atlasService={atlasService}
            >
              {children}
            </WorkspacesStorageServiceProviderWeb>
          </RecentQueryStorageProvider>
        </FavoriteQueryStorageProvider>
      </PipelineStorageProvider>
    );
  }
);

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  | 'initialWorkspaceTabs'
  | 'onActiveWorkspaceTabChange'
  | 'onBeforeUnloadCallbackRequest'
> &
  Pick<
    React.ComponentProps<typeof CompassSidebarPlugin>,
    'onOpenConnectViaModal'
  >;

/** @public */
export type CompassWebProps = {
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
  onOpenConnectViaModal?: (atlasMetadata?: AtlasClusterMetadata) => void;

  /**
   * A "react-router"-like history instance to be used to manipulate the current
   * route state. Optional, if not provided, no router handling logic will apply
   */
  history?: History;

  /**
   * Optional prefix to take into consideration when parsing current route
   * (default: "explorer")
   */
  historyRoutePrefix?: string;
};

function CompassWorkspace({
  initialWorkspaceTabs,
  onActiveWorkspaceTabChange,
  onOpenConnectViaModal,
  onBeforeUnloadCallbackRequest,
}: CompassWorkspaceProps) {
  return (
    <WorkspacesProvider
      value={[
        WelcomeWorkspaceTab,
        DatabasesWorkspaceTab,
        CollectionsWorkspaceTab,
        CollectionWorkspace,
        DataModelingWorkspace,
        MyQueriesWorkspace,
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
            onBeforeUnloadCallbackRequest={onBeforeUnloadCallbackRequest}
            initialWorkspaceTabs={initialWorkspaceTabs}
            openOnEmptyWorkspace={{ type: 'Welcome' }}
            onActiveWorkspaceTabChange={onActiveWorkspaceTabChange}
            renderSidebar={() => {
              return (
                <CompassSidebarPlugin
                  onOpenConnectViaModal={onOpenConnectViaModal}
                  isCompassWeb={true}
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
                  <CompassAssistantDrawerWithConnections appName="Data Explorer" />
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

const CompassComponentsProviderWeb: React.FunctionComponent<{
  darkMode?: boolean;
}> = ({ darkMode, children }) => {
  const track = useTelemetry();
  const { enableContextMenus, enableGuideCues, legacyUUIDDisplayEncoding } =
    usePreferences([
      'enableContextMenus',
      'enableGuideCues',
      'legacyUUIDDisplayEncoding',
    ]);
  return (
    <CompassComponentsProvider
      darkMode={darkMode}
      legacyUUIDDisplayEncoding={legacyUUIDDisplayEncoding}
      // Making sure that compass-web modals and tooltips are definitely not
      // hidden by Cloud UI sidebar and page header
      stackedElementsZIndex={10_000}
      onNextGuideGue={(cue) => {
        track('Guide Cue Dismissed', {
          groupId: cue.groupId,
          cueId: cue.cueId,
          step: cue.step,
        });
      }}
      onNextGuideCueGroup={(cue) => {
        if (cue.groupSteps !== cue.step) {
          track('Guide Cue Group Dismissed', {
            groupId: cue.groupId,
            cueId: cue.cueId,
            step: cue.step,
          });
        }
      }}
      onContextMenuOpen={(itemGroups) => {
        if (itemGroups.length > 0) {
          track('Context Menu Opened', {
            item_groups: itemGroups.map((group) => group.telemetryLabel),
          });
        }
      }}
      onContextMenuItemClick={(itemGroup, item) => {
        track('Context Menu Item Clicked', {
          item_group: itemGroup.telemetryLabel,
          item_label: item.label,
        });
      }}
      onDrawerSectionOpen={(drawerSectionId) => {
        track('Drawer Section Opened', {
          sectionId: drawerSectionId,
        });
      }}
      onDrawerSectionHide={(drawerSectionId) => {
        track('Drawer Section Closed', {
          sectionId: drawerSectionId,
        });
      }}
      onSignalMount={(id) => {
        track('Signal Shown', { id });
      }}
      onSignalOpen={(id) => {
        track('Signal Opened', { id });
      }}
      onSignalPrimaryActionClick={(id) => {
        track('Signal Action Button Clicked', { id });
      }}
      onSignalLinkClick={(id) => {
        track('Signal Link Clicked', { id });
      }}
      onSignalClose={(id) => {
        track('Signal Closed', { id });
      }}
      disableContextMenus={!enableContextMenus}
      disableGuideCues={!enableGuideCues}
      {...LINK_PROPS}
    >
      {children}
    </CompassComponentsProvider>
  );
};

const CompassWebWithPreferences = ({
  appName,
  orgId,
  preferences,
  projectId,
  darkMode,
  onLog,
  onDebug,
  onTrack,
  onOpenConnectViaModal,
  history,
  historyRoutePrefix,
}: CompassWebProps & {
  preferences: CompassWebPreferencesAccess;
}) => {
  const appRegistry = useInitialValue(new AppRegistry());
  const { logger, telemetry: telemetryOptions } =
    useCompassWebLoggerAndTelemetry({
      onLog,
      onDebug,
      onTrack,
      preferences,
    });

  const {
    initialWorkspaceTabs,
    autoconnectId,
    onActiveWorkspaceTabChange,
    onBeforeUnloadCallbackRequest,
  } = useSyncHistory(history, historyRoutePrefix);

  return (
    <GlobalAppRegistryProvider value={appRegistry}>
      <AppRegistryProvider scopeName="Compass Web Root">
        <PreferencesProvider value={preferences}>
          <LoggerProvider value={logger}>
            <TelemetryProvider options={telemetryOptions}>
              <CompassComponentsProviderWeb darkMode={darkMode}>
                <WithAtlasProviders>
                  <WithMultiplexTransport projectId={projectId}>
                    <WithStorageProviders orgId={orgId} projectId={projectId}>
                      <DataModelStorageServiceProviderWeb
                        orgId={orgId}
                        projectId={projectId}
                      >
                        <AtlasCloudConnectionStorageProvider
                          orgId={orgId}
                          projectId={projectId}
                        >
                          <ToolsControllerProvider>
                            <CompassAssistantProvider
                              originForPrompt="atlas-data-explorer"
                              appNameForPrompt={
                                APP_NAMES_FOR_PROMPT.DataExplorer
                              }
                              projectId={projectId}
                            >
                              <CompassConnections
                                appName={appName ?? 'Compass Web'}
                                showErrorStateOnConnectionLoadError
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
                                          initialWorkspaceTabs
                                        }
                                        onActiveWorkspaceTabChange={
                                          onActiveWorkspaceTabChange
                                        }
                                        onOpenConnectViaModal={
                                          onOpenConnectViaModal
                                        }
                                        onBeforeUnloadCallbackRequest={
                                          onBeforeUnloadCallbackRequest
                                        }
                                      ></CompassWorkspace>
                                    </WithConnectionsStore>
                                  </FieldStorePlugin>
                                  <CompassGenerativeAIPlugin
                                    projectId={projectId}
                                    isCloudOptIn={true}
                                  />
                                  {preferences.getPreferences().enableCompassWebSettings && (
                                    <CompassSettingsPlugin />
                                  )}
                                </CompassInstanceStorePlugin>
                              </CompassConnections>
                            </CompassAssistantProvider>
                          </ToolsControllerProvider>
                        </AtlasCloudConnectionStorageProvider>
                      </DataModelStorageServiceProviderWeb>
                    </WithStorageProviders>
                  </WithMultiplexTransport>
                </WithAtlasProviders>
              </CompassComponentsProviderWeb>
            </TelemetryProvider>
          </LoggerProvider>
        </PreferencesProvider>
      </AppRegistryProvider>
    </GlobalAppRegistryProvider>
  );
};

/** @public */
const CompassWeb = (props: CompassWebProps) => {
  const { preferencesAccess, isLoading, error } = useCompassWebPreferences(
    props.projectId
  );

  if (isLoading) {
    return (
      <div className={preferencesLoadingContainerStyles}>
        <SpinLoaderWithLabel
          darkMode={props.darkMode}
          data-testid="compass-web-preferences-loader"
          progressText="Loading Data Explorer…"
        />
      </div>
    );
  }

  if (error) {
    // When we can't fetch the preferences, we let mms handle the error state.
    throw error;
  }

  if (!preferencesAccess) {
    throw new Error('Failed to load data explorer preferences');
  }

  return (
    <CompassWebWithPreferences {...props} preferences={preferencesAccess} />
  );
};

export { CompassWeb };
