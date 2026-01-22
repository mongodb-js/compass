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
  WorkspaceTab,
} from '@mongodb-js/workspace-info';
import WorkspacesPlugin, {
  type OpenWorkspaceOptions,
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
import ExplainPlanCollectionTabModal from '@mongodb-js/compass-explain-plan';
import ExportToLanguageCollectionTabModal from '@mongodb-js/compass-export-to-language';
import type {
  AllPreferences,
  AtlasCloudFeatureFlags,
} from 'compass-preferences-model/provider';
import {
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
import { LoggerProvider } from '@mongodb-js/compass-logging/provider';
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
import { useCompassWebPreferences } from './preferences';
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
import { CompassIndexesDrawerPlugin } from '@mongodb-js/compass-indexes';
import { APP_NAMES_FOR_PROMPT } from '@mongodb-js/compass-assistant';
import { assertsUserDataType } from '@mongodb-js/compass-user-data';

const WithAtlasProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AtlasCloudAuthServiceProvider>
      <AtlasClusterConnectionsOnlyProvider value={true}>
        <AtlasServiceProvider
          options={{
            defaultHeaders: {
              'X-Request-Origin': 'atlas-data-explorer',
            },
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
    const getResourceUrl = (path?: string) => {
      const pathParts = path?.split('/').filter(Boolean) || [];
      const type = pathParts[0];
      assertsUserDataType(type);
      const pathOrgId = pathParts[1];
      const pathProjectId = pathParts[2];
      const id = pathParts[3];

      // Use the path's orgId and projectId if provided, otherwise fall back to the context values
      const finalOrgId = pathOrgId || orgId;
      const finalProjectId = pathProjectId || projectId;

      return atlasService.userDataEndpoint(
        finalOrgId,
        finalProjectId,
        type,
        id
      );
    };

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
            <WorkspacesStorageServiceProviderWeb
              orgId={orgId}
              projectId={projectId}
              getResourceUrl={getResourceUrl}
              authenticatedFetch={authenticatedFetch}
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
  onActiveWorkspaceTabChange: <WS extends WorkspaceTab>(
    ws: WS | null,
    collectionInfo: WS extends { type: 'Collection' }
      ? CollectionTabInfo | null
      : never
  ) => void;

  /**
   * Set of initial preferences to override default values
   */
  initialPreferences?: Partial<AllPreferences>;

  /**
   * A subset of Atlas Cloud feature flags that maps to Compass feature flag
   * preferences. These flags have any effect ONLY if they were defined as
   * mapped for some Compass preferences feature flags
   */
  atlasCloudFeatureFlags?: Partial<AtlasCloudFeatureFlags>;

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

  /**
   * Callback that will get passed another callback function that, when called,
   * would return back true or false depending on whether or not tabs can be
   * safely closed without losing any important unsaved changes
   */
  onBeforeUnloadCallbackRequest?: (canCloseCallback: () => boolean) => void;
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
          CompassIndexesDrawerPlugin,
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

/** @public */
const CompassWeb = ({
  appName,
  orgId,
  projectId,
  darkMode,
  initialAutoconnectId,
  initialWorkspace: _initialWorkspace,
  onActiveWorkspaceTabChange,
  initialPreferences,
  atlasCloudFeatureFlags,
  onLog,
  onDebug,
  onTrack,
  onOpenConnectViaModal,
  onFailToLoadConnections,
  onBeforeUnloadCallbackRequest,
}: CompassWebProps) => {
  const appRegistry = useInitialValue(new AppRegistry());
  const preferencesAccess = useCompassWebPreferences(
    initialPreferences,
    atlasCloudFeatureFlags
  );
  const { logger, telemetry: telemetryOptions } =
    useCompassWebLoggerAndTelemetry({
      onLog,
      onDebug,
      onTrack,
      preferences: preferencesAccess,
    });

  // TODO (COMPASS-9565): My Queries feature flag will be used to conditionally provide storage providers
  const initialWorkspace = useInitialValue(_initialWorkspace);
  const initialWorkspaceTabs = useInitialValue(() =>
    initialWorkspace ? [initialWorkspace] : []
  );

  const autoconnectId =
    initialWorkspace && 'connectionId' in initialWorkspace
      ? initialWorkspace.connectionId
      : initialAutoconnectId ?? undefined;

  return (
    <GlobalAppRegistryProvider value={appRegistry}>
      <AppRegistryProvider scopeName="Compass Web Root">
        <PreferencesProvider value={preferencesAccess}>
          <LoggerProvider value={logger}>
            <TelemetryProvider options={telemetryOptions}>
              <CompassComponentsProviderWeb darkMode={darkMode}>
                <WithAtlasProviders>
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
                            appNameForPrompt={APP_NAMES_FOR_PROMPT.DataExplorer}
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
                              </CompassInstanceStorePlugin>
                            </CompassConnections>
                          </CompassAssistantProvider>
                        </ToolsControllerProvider>
                      </AtlasCloudConnectionStorageProvider>
                    </DataModelStorageServiceProviderWeb>
                  </WithStorageProviders>
                </WithAtlasProviders>
              </CompassComponentsProviderWeb>
            </TelemetryProvider>
          </LoggerProvider>
        </PreferencesProvider>
      </AppRegistryProvider>
    </GlobalAppRegistryProvider>
  );
};

export { CompassWeb };
