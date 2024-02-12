import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import { toJSString } from 'mongodb-query-parser';
import {
  AtlasAuthService,
  type AtlasService,
} from '@mongodb-js/atlas-service/renderer';
import type { PipelineBuilderThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import { refreshInputDocuments } from '../modules/input-documents';
import { openStoredPipeline } from '../modules/saved-pipeline';
import { PipelineBuilder } from '../modules/pipeline-builder/pipeline-builder';
import { generateAggregationFromQuery } from '../modules/pipeline-builder/pipeline-ai';
import type { SavedPipeline } from '@mongodb-js/my-queries-storage';
import { PipelineStorage } from '@mongodb-js/my-queries-storage';
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
import { disableAIFeature } from '../modules/pipeline-builder/pipeline-ai';
import { INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE } from '../modules/search-indexes';
import { INITIAL_PANEL_OPEN_LOCAL_STORAGE_KEY } from '../modules/side-panel';
import type { DataService } from '../modules/data-service';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type Database from 'mongodb-database-model';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { PreferencesAccess } from 'compass-preferences-model';
import { preferencesMaxTimeMSChanged } from '../modules/max-time-ms';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { GenerativeAiService } from '@mongodb-js/compass-generative-ai';

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
    /**
     * Storage service for saved aggregations
     */
    pipelineStorage: PipelineStorage;
    /**
     * Service for interacting with Atlas-only features
     */
    atlasAuthService: AtlasAuthService;
  }>;

export type AggregationsPluginServices = {
  dataService: DataService;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  workspaces: WorkspacesService;
  instance: MongoDBInstance;
  preferences: PreferencesAccess;
  logger: LoggerAndTelemetry;
  atlasService: AtlasService;
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
    atlasService,
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

  const atlasAuthService = options.atlasAuthService ?? new AtlasAuthService();

  const pipelineStorage = options.pipelineStorage ?? new PipelineStorage();

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
    },
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        localAppRegistry,
        pipelineBuilder,
        pipelineStorage,
        atlasAuthService,
        workspaces,
        instance,
        preferences,
        logger,
        aiClient: GenerativeAiService.getInstance(atlasService),
      })
    )
  );

  store.dispatch(
    preferencesMaxTimeMSChanged(preferences.getPreferences().maxTimeMS)
  );
  addCleanup(
    preferences.onPreferenceValueChanged('maxTimeMS', (newValue) =>
      store.dispatch(preferencesMaxTimeMSChanged(newValue))
    )
  );

  on(atlasAuthService, 'user-config-changed', (config) => {
    if (config.enabledAIFeature === false) {
      store.dispatch(disableAIFeature());
    }
  });

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

  on(globalAppRegistry, 'import-finished', ({ ns }) => {
    const { namespace } = store.getState();
    if (ns === namespace) {
      refreshInput();
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
