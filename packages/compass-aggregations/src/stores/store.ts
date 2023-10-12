import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import { toJSString } from 'mongodb-query-parser';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import reducer from '../modules';
import { fieldsChanged } from '../modules/fields';
import { refreshInputDocuments } from '../modules/input-documents';
import { openStoredPipeline } from '../modules/saved-pipeline';
import { PipelineBuilder } from '../modules/pipeline-builder/pipeline-builder';
import { generateAggregationFromQuery } from '../modules/pipeline-builder/pipeline-ai';
import type { StoredPipeline } from '../utils/pipeline-storage';
import { PipelineStorage } from '../utils/pipeline-storage';
import {
  mapBuilderStageToStoreStage,
  mapStoreStagesToStageIdAndType,
} from '../modules/pipeline-builder/stage-editor';
import { updatePipelinePreview } from '../modules/pipeline-builder/builder-helpers';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import type { ENVS } from '@mongodb-js/mongodb-constants';
import {
  setCollectionFields,
  setCollections,
} from '../modules/collections-fields';
import type { CollectionInfo } from '../modules/collections-fields';
import { disableAIFeature } from '../modules/pipeline-builder/pipeline-ai';

export type ConfigureStoreOptions = {
  /**
   * Data service implementation (required)
   */
  dataProvider: {
    dataProvider: Pick<
      DataService,
      'isCancelError' | 'estimatedCount' | 'aggregate' | 'getConnectionString'
    > &
      // Optional methods for getting insights
      Partial<Pick<DataService, 'explainAggregate'>>;
    error?: Error;
  };
  /**
   * Namespace to be used when running aggregations (required, only collection namespaces are supported)
   */
  namespace: string;
} & Partial<{
  /**
   * Instance of local app registry, listens to `refresh-data` and
   * `fields-changed` events and updates corresponding redux slices
   * accordingly
   */
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'getStore'>;
  /**
   * Instance of global app registry, listens to `refresh-data` and
   * `import-finished` events and updates corresponding redux slices
   * accordingly
   */
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'getStore'>;
  /**
   * Should be provided if namespace is a view. Affects available stages
   */
  sourceName: string;
  /**
   * Current server version. Affects available stages
   */
  serverVersion: string;
  /**
   * Whether or not collection is a timeseries collection. Affects available
   * stages
   */
  isTimeSeries: boolean;
  /**
   * Whether or not collection is part of ADF (ex ADL). Used only to provide
   * correct explain plan verbosity
   */
  isDataLake: boolean;
  /**
   * Current connection env type. Affects available stages. Accepted values:
   * "atlas" | "on-prem" | "adl"
   */
  env: typeof ENVS[number] | null;
  /**
   * Indicates that the plugin is used in Atlas Cloud
   */
  isAtlasDeployed: boolean | null;
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
   * Stored pipeline metadata. Can be provided to preload stored pipeline
   * right when the plugin is initialized
   */
  aggregation: StoredPipeline;
  /**
   * Namespace for the view that is being edited. Needs to be provided
   * with the `sourcePipeline` options. Takes precedence over `pipeline`
   * option
   */
  editViewName: string;
  /**
   * Pipeline definition for the view that is being edited. Needs to be
   * provided with the `editViewName` option. Takes precedence over
   * `pipeline` option
   */
  sourcePipeline: unknown[];
  /**
   * Initial pipeline that will be converted to a string to be used by the
   * aggregation builder. Takes precedence over `pipelineText` option
   */
  pipeline: unknown[];
  /**
   * Initial pipeline text to be used by the aggregation builder
   */
  pipelineText: string;
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
  atlasService: AtlasService;
  /**
   * Whether or not search indexes are supported in the current environment
   */
  isSearchIndexesSupported: boolean;
}>;

const configureStore = (options: ConfigureStoreOptions) => {
  if (!options.dataProvider?.dataProvider) {
    throw new Error(
      "Can't configure store for aggregation plugin without data serivce"
    );
  }

  if (options.editViewName && !options.sourcePipeline) {
    throw new Error(
      'Option `editViewName` can be used only if `sourcePipeline` is provided'
    );
  }

  const editingView = !!(options.editViewName && options.sourcePipeline);

  const initialPipelineSource =
    (editingView
      ? toJSString(options.sourcePipeline, '  ')
      : options.pipeline
      ? toJSString(options.pipeline)
      : options.pipelineText) ?? undefined;

  const { collection } = toNS(options.namespace);

  if (!collection) {
    throw new Error("Aggregation plugin doesn't support database namespaces");
  }

  const pipelineBuilder = new PipelineBuilder(
    options.dataProvider.dataProvider as DataService,
    initialPipelineSource
  );

  const atlasService = options.atlasService ?? new AtlasService();

  const pipelineStorage = options.pipelineStorage ?? new PipelineStorage();

  const stages = pipelineBuilder.stages.map((stage, idx) =>
    mapBuilderStageToStoreStage(stage, idx)
  );

  const stagesIdAndType = mapStoreStagesToStageIdAndType(stages);

  const store = createStore(
    reducer,
    {
      // TODO: move this to thunk extra arg
      appRegistry: {
        localAppRegistry: options.localAppRegistry ?? null,
        globalAppRegistry: options.globalAppRegistry ?? null,
      },
      // TODO: move this to thunk extra arg
      dataService: {
        error: options.dataProvider?.error ?? null,
        dataService:
          (options.dataProvider?.dataProvider as DataService) ?? null,
      },
      namespace: options.namespace,
      serverVersion: options.serverVersion,
      isTimeSeries: options.isTimeSeries,
      isDataLake: options.isDataLake,
      env:
        // mms specifies options.env whereas we don't currently get this variable when
        // we use the aggregations plugin inside compass. In that use case we get it
        // from the instance model above.
        options.env ??
        // TODO: for now this is how we get to the env in compass as opposed to in
        // mms where it comes from options.env. Ideally options.env would be
        // required so we can always get it from there, but that's something for a
        // future task. In theory we already know the env by the time this code
        // executes, so it should be doable.
        (
          options.globalAppRegistry?.getStore('App.InstanceStore') as
            | Store
            | undefined
        )?.getState().instance.env,
      // options.isAtlasDeployed is only used by mms to change some behaviour in the
      // aggregations plugin
      isAtlasDeployed:
        options.isAtlasDeployed !== null &&
        options.isAtlasDeployed !== undefined,
      // options.fields is only used by mms, but always set to [] which is the initial value anyway
      fields: options.fields ?? [],
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
        isSearchIndexesSupported: Boolean(options.isSearchIndexesSupported),
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelineBuilder,
        pipelineStorage,
        atlasService,
      })
    )
  );

  atlasService.on('user-config-changed', (config) => {
    if (config.enabledAIFeature === false) {
      store.dispatch(disableAIFeature());
    }
  });

  const refreshInput = () => {
    void store.dispatch(refreshInputDocuments());
  };

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    /**
     * Refresh documents on data refresh.
     */
    localAppRegistry.on('refresh-data', () => {
      refreshInput();
    });

    /**
     * When the schema fields change, update the state with the new
     * fields.
     *
     * @param {Object} fields - The fields.
     */
    localAppRegistry.on('fields-changed', (fields) => {
      store.dispatch(fieldsChanged(fields.autocompleteFields));
    });

    localAppRegistry.on('generate-aggregation-from-query', (data) => {
      store.dispatch(generateAggregationFromQuery(data));
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    /**
     * Refresh documents on global data refresh.
     */
    globalAppRegistry.on('refresh-data', () => {
      refreshInput();
    });

    globalAppRegistry.on('import-finished', ({ ns }) => {
      const { namespace } = store.getState();
      if (ns === namespace) {
        refreshInput();
      }
    });
  }

  // If stored pipeline was passed through options and we are not editing,
  // restore pipeline
  if (!editingView && options.aggregation) {
    store.dispatch(openStoredPipeline(options.aggregation, false));
  }

  handleDatabaseCollections(store, options);
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

  return store;
};

type DbModel = {
  collections: Array<{
    _id: string;
    type: 'collection' | 'view';
  }>;
};

const handleDatabaseCollections = (
  store: ReturnType<typeof configureStore>,
  options: Pick<
    ConfigureStoreOptions,
    'namespace' | 'globalAppRegistry' | 'collections'
  >
) => {
  const { namespace, globalAppRegistry, collections } = options;

  // Give precedence to passed list of collection
  if (collections && collections.length > 0) {
    store.dispatch(setCollections(collections));
  }

  if (globalAppRegistry) {
    const instance = (
      globalAppRegistry.getStore('App.InstanceStore') as Store | undefined
    )?.getState().instance;
    const ns = toNS(namespace);
    const db = instance?.databases?.get(ns.database);
    if (!db) {
      return;
    }

    const onDatabaseCollectionStatusChange = (dbModel: DbModel) => {
      const collections = dbModel.collections.map((x) => ({
        name: toNS(x._id).collection,
        type: x.type,
      }));

      store.dispatch(setCollections(collections ?? []));
    };

    onDatabaseCollectionStatusChange(db);
    db.on('change:collectionsStatus', (model: DbModel) => {
      onDatabaseCollectionStatusChange(model);
    });
  }
};

export default configureStore;
