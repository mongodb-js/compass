import React, { useEffect, useRef } from 'react';
import AppRegistry, {
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from '@mongodb-js/compass-app-registry';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { useConnectionActions } from '@mongodb-js/compass-connections/provider';
import { CompassInstanceStorePlugin } from '@mongodb-js/compass-app-stores';
import type {
  CollectionTabInfo,
  OpenWorkspaceOptions,
  WorkspaceTab,
} from '@mongodb-js/compass-workspaces';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';
import {
  CollectionsWorkspaceTab,
  CreateNamespacePlugin,
  DatabasesWorkspaceTab,
  DropNamespacePlugin,
  RenameCollectionPlugin,
} from '@mongodb-js/compass-databases-collections';
import { CompassComponentsProvider, css } from '@mongodb-js/compass-components';
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
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import type { AllPreferences } from 'compass-preferences-model/provider';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import FieldStorePlugin from '@mongodb-js/compass-field-store';
import {
  atlasServiceLocator,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import { LoggerProvider } from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import CompassConnections from '@mongodb-js/compass-connections';
import { AtlasCloudConnectionStorageProvider } from './connection-storage';
import { AtlasCloudAuthServiceProvider } from './atlas-auth-service';
import type { DebugFunction, LogFunction } from './logger';
import { useCompassWebLogger } from './logger';
import { type TelemetryServiceOptions } from '@mongodb-js/compass-telemetry';
import { WebWorkspaceTab as WelcomeWorkspaceTab } from '@mongodb-js/compass-welcome';
import { WorkspaceTab as MyQueriesWorkspace } from '@mongodb-js/compass-saved-aggregations-queries';
import { useCompassWebPreferences } from './preferences';
import { DataModelingWorkspaceTab as DataModelingWorkspace } from '@mongodb-js/compass-data-modeling';
import { DataModelStorageServiceProviderInMemory } from '@mongodb-js/compass-data-modeling/web';
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

/** @public */
export type TrackFunction = (
  event: string,
  properties: Record<string, any>
) => void;

const WithAtlasProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AtlasCloudAuthServiceProvider>
      <AtlasClusterConnectionsOnlyProvider value={true}>
        <AtlasServiceProvider>
          <AtlasAiServiceProvider apiURLPreset="cloud">
            {children}
          </AtlasAiServiceProvider>
        </AtlasServiceProvider>
      </AtlasClusterConnectionsOnlyProvider>
    </AtlasCloudAuthServiceProvider>
  );
};

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
    const authenticatedFetch =
      atlasService.authenticatedFetch.bind(atlasService);
    const getResourceUrl = (path?: string) =>
      atlasService.userDataEndpoint(`/${path || ''}`);

    const pipelineStorage = useRef<PipelineStorageAccess>({
      getStorage() {
        return createWebPipelineStorage({
          orgId,
          projectId,
          getResourceUrl,
          authenticatedFetch,
        });
      },
    });
    const favoriteQueryStorage = useRef<FavoriteQueryStorageAccess>({
      getStorage() {
        return createWebFavoriteQueryStorage({
          orgId,
          projectId,
          getResourceUrl,
          authenticatedFetch,
        });
      },
    });
    const recentQueryStorage = useRef<RecentQueryStorageAccess>({
      getStorage() {
        return createWebRecentQueryStorage({
          orgId,
          projectId,
          getResourceUrl,
          authenticatedFetch,
        });
      },
    });
    return (
      <PipelineStorageProvider value={pipelineStorage.current}>
        <FavoriteQueryStorageProvider value={favoriteQueryStorage.current}>
          <RecentQueryStorageProvider value={recentQueryStorage.current}>
            {children}
          </RecentQueryStorageProvider>
        </FavoriteQueryStorageProvider>
      </PipelineStorageProvider>
    );
  }
);

type CompassWorkspaceProps = Pick<
  React.ComponentProps<typeof WorkspacesPlugin>,
  'initialWorkspaceTabs' | 'onActiveWorkspaceTabChange'
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
  onActiveWorkspaceTabChange<WS extends WorkspaceTab>(
    ws: WS | null,
    collectionInfo: WS extends { type: 'Collection' }
      ? CollectionTabInfo | null
      : never
  ): void;

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
  onOpenConnectViaModal?: (atlasMetadata?: AtlasClusterMetadata) => void;

  /**
   * Callback prop called when connections fail to load
   */
  onFailToLoadConnections: (err: Error) => void;
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

/** @public */
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
  onFailToLoadConnections,
}: CompassWebProps) => {
  const appRegistry = useRef(new AppRegistry());
  const logger = useCompassWebLogger({
    onLog,
    onDebug,
  });
  const preferencesAccess = useCompassWebPreferences(initialPreferences);
  // TODO (COMPASS-9565): My Queries feature flag will be used to conditionally provide storage providers
  const initialWorkspaceRef = useRef(initialWorkspace);
  const initialWorkspaceTabsRef = useRef(
    initialWorkspaceRef.current ? [initialWorkspaceRef.current] : []
  );

  const autoconnectId =
    initialWorkspaceRef.current && 'connectionId' in initialWorkspaceRef.current
      ? initialWorkspaceRef.current.connectionId
      : initialAutoconnectId ?? undefined;

  const onTrackRef = useRef(onTrack);
  onTrackRef.current = onTrack;

  const telemetryOptions = useRef<TelemetryServiceOptions>({
    sendTrack: (event: string, properties: Record<string, any> | undefined) => {
      void onTrackRef.current?.(event, properties || {});
    },
    logger,
    preferences: preferencesAccess.current,
  });

  useEffect(() => {
    // TODO(COMPASS-9353): Provide a standard way of updating Compass' preferences from web.
    // Avoid duplicating this pattern until we address this ticket.
    const updateEarlyIndexesPreferences = async () => {
      await preferencesAccess.current.savePreferences({
        enableIndexesGuidanceExp: initialPreferences?.enableIndexesGuidanceExp,
        showIndexesGuidanceVariant:
          initialPreferences?.showIndexesGuidanceVariant,
      });
    };
    void updateEarlyIndexesPreferences();
  }, [
    initialPreferences?.enableIndexesGuidanceExp,
    initialPreferences?.showIndexesGuidanceVariant,
    preferencesAccess,
  ]);

  return (
    <GlobalAppRegistryProvider value={appRegistry.current}>
      <AppRegistryProvider scopeName="Compass Web Root">
        <CompassComponentsProvider
          darkMode={darkMode}
          // Making sure that compass-web modals and tooltips are definitely not
          // hidden by Cloud UI sidebar and page header
          stackedElementsZIndex={10_000}
          onNextGuideGue={(cue) => {
            onTrackRef.current?.('Guide Cue Dismissed', {
              groupId: cue.groupId,
              cueId: cue.cueId,
              step: cue.step,
            });
          }}
          onNextGuideCueGroup={(cue) => {
            if (cue.groupSteps !== cue.step) {
              onTrackRef.current?.('Guide Cue Group Dismissed', {
                groupId: cue.groupId,
                cueId: cue.cueId,
                step: cue.step,
              });
            }
          }}
          onContextMenuOpen={(itemGroups) => {
            if (itemGroups.length > 0) {
              onTrackRef.current?.('Context Menu Opened', {
                item_groups: itemGroups.map((group) => group.telemetryLabel),
              });
            }
          }}
          onContextMenuItemClick={(itemGroup, item) => {
            onTrackRef.current?.('Context Menu Item Clicked', {
              item_group: itemGroup.telemetryLabel,
              item_label: item.label,
            });
          }}
          onDrawerSectionOpen={(drawerSectionId) => {
            onTrackRef.current?.('Drawer Section Opened', {
              sectionId: drawerSectionId,
            });
          }}
          onDrawerSectionHide={(drawerSectionId) => {
            onTrackRef.current?.('Drawer Section Closed', {
              sectionId: drawerSectionId,
            });
          }}
          onSignalMount={(id) => {
            onTrackRef.current?.('Signal Shown', { id });
          }}
          onSignalOpen={(id) => {
            onTrackRef.current?.('Signal Opened', { id });
          }}
          onSignalPrimaryActionClick={(id) => {
            onTrackRef.current?.('Signal Action Button Clicked', { id });
          }}
          onSignalLinkClick={(id) => {
            onTrackRef.current?.('Signal Link Clicked', { id });
          }}
          onSignalClose={(id) => {
            onTrackRef.current?.('Signal Closed', { id });
          }}
          {...LINK_PROPS}
        >
          <PreferencesProvider value={preferencesAccess.current}>
            <LoggerProvider value={logger}>
              <TelemetryProvider options={telemetryOptions.current}>
                <WithAtlasProviders>
                  <WithStorageProviders orgId={orgId} projectId={projectId}>
                    <DataModelStorageServiceProviderInMemory>
                      <AtlasCloudConnectionStorageProvider
                        orgId={orgId}
                        projectId={projectId}
                      >
                        <CompassConnections
                          appName={appName ?? 'Compass Web'}
                          onFailToLoadConnections={onFailToLoadConnections}
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
                            <CompassAssistantProvider
                              originForPrompt="atlas-data-explorer"
                              appNameForPrompt={
                                APP_NAMES_FOR_PROMPT.DataExplorer
                              }
                            >
                              <FieldStorePlugin>
                                <WithConnectionsStore>
                                  <CompassWorkspace
                                    initialWorkspaceTabs={
                                      initialWorkspaceTabsRef.current
                                    }
                                    onActiveWorkspaceTabChange={
                                      onActiveWorkspaceTabChange
                                    }
                                    onOpenConnectViaModal={
                                      onOpenConnectViaModal
                                    }
                                  ></CompassWorkspace>
                                </WithConnectionsStore>
                              </FieldStorePlugin>
                              <CompassGenerativeAIPlugin
                                projectId={projectId}
                                isCloudOptIn={true}
                              />
                            </CompassAssistantProvider>
                          </CompassInstanceStorePlugin>
                        </CompassConnections>
                      </AtlasCloudConnectionStorageProvider>
                    </DataModelStorageServiceProviderInMemory>
                  </WithStorageProviders>
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
