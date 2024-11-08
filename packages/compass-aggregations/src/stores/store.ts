import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import { toJSString } from 'mongodb-query-parser';
import type { PipelineBuilderThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import { refreshInputDocuments } from '../modules/input-documents';
import { openStoredPipeline } from '../modules/saved-pipeline';
import { PipelineBuilder } from '../modules/pipeline-builder/pipeline-builder';
import { generateAggregationFromQuery } from '../modules/pipeline-builder/pipeline-ai';
import type { SavedPipeline } from '@mongodb-js/my-queries-storage';
import {
  mapBuilderStageToStoreStage,
  mapStoreStagesToStageIdAndType,
} from '../modules/pipeline-builder/stage-editor';
import { updatePipelinePreview } from '../modules/pipeline-builder/builder-helpers';
import type AppRegistry from 'hadron-app-registry';
import type { ENVS } from '@mongodb-js/mongodb-constants';
import {
  setCollectionFields,
  setCollections,
} from '../modules/collections-fields';
import type { CollectionInfo } from '../modules/collections-fields';
import { INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE } from '../modules/search-indexes';
import { INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY } from '../modules/side-panel';
import type { DataService } from '../modules/data-service';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type Database from 'mongodb-database-model';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type { PipelineStorage } from '@mongodb-js/my-queries-storage/provider';
import { maxTimeMSChanged } from '../modules/max-time-ms';
import type {
  ConnectionInfoRef,
  ConnectionScopedAppRegistry,
} from '@mongodb-js/compass-connections/provider';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import {
  pickCollectionStats,
  collectionStatsFetched,
} from '../modules/collection-stats';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

export type ConfigureStoreOptions = CollectionTabPluginMetadata &
  Partial<{
    /**
     * Current connection env type. Affects available stages. Accepted values:
     * "atlas" | "on-prem" | "adl"
     */
    env: typeof ENVS[number] | null;
    /**
     * Namespace field values that will be used in autocomplete
     */
    fields: { name: string }[];
    /**
     * Function that overrides default handling of opening resulting namespace
     * of out stages ($out, $merge). When provided, will be called when user
     * clicks
     */
    outResultsFn: (namespace: string) => void;
    /**
     * List of all the collections in the current database. It is used inside
     * the stage wizard to populate the dropdown for $lookup use-case.
     */
    collections: CollectionInfo[];
  }>;

export type AggregationsPluginServices = {
  dataService: DataService;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  workspaces: WorkspacesService;
  instance: MongoDBInstance;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  atlasAiService: AtlasAiService;
  pipelineStorage?: PipelineStorage;
  connectionInfoRef: ConnectionInfoRef;
  connectionScopedAppRegistry: ConnectionScopedAppRegistry<'open-export'>;
  collection: Collection;
};

export function activateAggregationsPlugin(
  options: ConfigureStoreOptions,
  {
    dataService,
    localAppRegistry,
    globalAppRegistry,
    workspaces,
    instance,
    preferences,
    logger,
    track,
    atlasAiService,
    pipelineStorage,
    connectionInfoRef,
    connectionScopedAppRegistry,
    collection: collectionModel,
  }: AggregationsPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  if (options.editViewName && !options.pipeline) {
    throw new Error(
      'Option `editViewName` can be used only if `pipeline` is provided'
    );
  }

  const editingView = !!(options.editViewName && options.pipeline);

  const initialPipelineSource =
    (options.pipeline ? toJSString(options.pipeline) : options.pipelineText) ??
    undefined;

  const { collection } = toNS(options.namespace);

  if (!collection) {
    throw new Error("Aggregation plugin doesn't support database namespaces");
  }

  const pipelineBuilder = new PipelineBuilder(
    dataService,
    preferences,
    initialPipelineSource
  );

  const stages = pipelineBuilder.stages.map((stage, idx) =>
    mapBuilderStageToStoreStage(stage, idx)
  );

  const stagesIdAndType = mapStoreStagesToStageIdAndType(stages);

  const store: Store<RootState> & {
    dispatch: PipelineBuilderThunkDispatch;
  } = createStore(
    reducer,
    {
      // TODO: move this to thunk extra arg
      dataService: { dataService },
      namespace: options.namespace,
      serverVersion: options.serverVersion,
      isTimeSeries: options.isTimeSeries,
      isDataLake: options.isDataLake,
      env:
        // mms specifies options.env whereas we don't currently get this variable when
        // we use the aggregations plugin inside compass. In that use case we get it
        // from the instance model above.
        options.env ?? (instance.env as typeof ENVS[number]),
      // options.outResultsFn is only used by mms
      outResultsFn: options.outResultsFn,
      pipelineBuilder: {
        stageEditor: {
          stages,
          stagesIdAndType,
        },
      },
      sourceName: options.sourceName,
      editViewName: options.editViewName,
      searchIndexes: {
        ...SEARCH_INDEXES_INITIAL_STATE,
        isSearchIndexesSupported: Boolean(options.isSearchIndexesSupported),
      },
      // This is the initial state of the STAGE WIZARD side panel (NOT OPTIONS
      // side panel)
      sidePanel: {
        isPanelOpen:
          // The initial state, if the localStorage entry is not set,
          // should be 'hidden'.
          localStorage.getItem(INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY) === 'true',
      },
      collectionStats: pickCollectionStats(collectionModel),
    },
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        localAppRegistry,
        pipelineBuilder,
        pipelineStorage,
        workspaces,
        instance,
        preferences,
        logger,
        track,
        atlasAiService,
        connectionInfoRef,
        connectionScopedAppRegistry,
      })
    )
  );

  const refreshInput = () => {
    void store.dispatch(refreshInputDocuments());
  };

  on(localAppRegistry, 'generate-aggregation-from-query', (data) => {
    store.dispatch(generateAggregationFromQuery(data));
  });

  /**
   * Refresh documents on global data refresh.
   */
  on(globalAppRegistry, 'refresh-data', () => {
    refreshInput();
  });

  on(
    globalAppRegistry,
    'import-finished',
    (
      { ns }: { ns: string },
      { connectionId }: { connectionId?: string } = {}
    ) => {
      const { id: currentConnectionId } = connectionInfoRef.current;
      const { namespace } = store.getState();
      if (currentConnectionId === connectionId && ns === namespace) {
        refreshInput();
      }
    }
  );

  on(collectionModel, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  // If stored pipeline was passed through options and we are not editing,
  // restore pipeline
  if (!editingView && options.aggregation) {
    store.dispatch(
      openStoredPipeline(options.aggregation as SavedPipeline, false)
    );
  }

  addCleanup(handleDatabaseCollections(store, options, instance));

  if (options.fields) {
    store.dispatch(
      setCollectionFields(
        collection,
        options.sourceName ? 'view' : 'collection',
        options.fields.map((x) => x.name)
      )
    );
  }

  refreshInput();

  store.dispatch(updatePipelinePreview());

  store.dispatch(
    maxTimeMSChanged(preferences.getPreferences().maxTimeMS || null)
  );

  const onCloseOrReplace = () => {
    return !store.getState().isModified;
  };

  addCleanup(workspaces.onTabReplace?.(onCloseOrReplace));

  addCleanup(workspaces.onTabClose?.(onCloseOrReplace));

  return {
    store,
    deactivate: cleanup,
  };
}

const handleDatabaseCollections = (
  store: Store<RootState> & {
    dispatch: PipelineBuilderThunkDispatch;
  },
  options: Pick<ConfigureStoreOptions, 'namespace' | 'collections'>,
  instance: MongoDBInstance
): (() => void) => {
  const { namespace, collections } = options;

  // Give precedence to passed list of collection
  if (collections && collections.length > 0) {
    store.dispatch(setCollections(collections));
  }

  const ns = toNS(namespace);
  const db = instance?.databases?.get(ns.database);

  if (!db) {
    return () => {
      /* nothing */
    };
  }

  const onDatabaseCollectionStatusChange = (dbModel: Database) => {
    const collections = dbModel.collections.map((x) => ({
      name: toNS(x._id).collection,
      type: x.type,
    }));

    store.dispatch(setCollections(collections ?? []));
  };

  onDatabaseCollectionStatusChange(db);
  db.on('change:collectionsStatus', onDatabaseCollectionStatusChange);
  return () =>
    db.removeListener(
      'change:collectionsStatus',
      onDatabaseCollectionStatusChange
    );
};

export type AggregationsStore = ReturnType<
  typeof activateAggregationsPlugin
>['store'];
