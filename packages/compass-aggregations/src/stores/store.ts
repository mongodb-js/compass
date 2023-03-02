import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import { toJSString } from 'mongodb-query-parser';
import reducer from '../modules';
import { fieldsChanged } from '../modules/fields';
import { refreshInputDocuments } from '../modules/input-documents';
import type { IndexInfo } from '../modules/indexes';
import { indexesFetched } from '../modules/indexes';
import { openStoredPipeline } from '../modules/saved-pipeline';
import { PipelineBuilder } from '../modules/pipeline-builder/pipeline-builder';
import type { StoredPipeline } from '../utils/pipeline-storage';
import { PipelineStorage } from '../utils/pipeline-storage';
import { mapBuilderStageToStoreStage } from '../modules/pipeline-builder/stage-editor';
import { updatePipelinePreview } from '../modules/pipeline-builder/builder-helpers';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import type { ENVS } from '@mongodb-js/mongodb-constants';

export type ConfigureStoreOptions = {
  /**
   * Data service implementation (required)
   */
  dataProvider: {
    dataProvider: Pick<
      DataService,
      'isCancelError' | 'estimatedCount' | 'aggregate' | 'getConnectionString'
    >;
    error?: Error;
  };
  /**
   * Namespace to be used when running aggregations
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
   * Instance of local app registry, listens to `refresh-data` and
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
  const pipelineStorage = new PipelineStorage();

  const store = createStore(
    reducer,
    {
      appRegistry: {
        localAppRegistry: options.localAppRegistry ?? null,
        globalAppRegistry: options.globalAppRegistry ?? null,
      },
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
          stages: pipelineBuilder.stages.map((stage) =>
            mapBuilderStageToStoreStage(stage)
          ),
          stageIds: pipelineBuilder.stages.map((stage) => stage.id),
        },
      },
      sourceName: options.sourceName,
      editViewName: options.editViewName,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelineBuilder,
        pipelineStorage,
      })
    )
  );

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
      store.dispatch(fieldsChanged(fields.aceFields));
    });

    localAppRegistry.on(
      'indexes-changed',
      (ixs: { getAttributes(...args: any[]): IndexInfo }[]) => {
        store.dispatch(
          indexesFetched(
            ixs.map((index) => index.getAttributes({ props: true }, true))
          )
        );
      }
    );
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

  refreshInput();

  store.dispatch(updatePipelinePreview());

  return store;
};

export default configureStore;
