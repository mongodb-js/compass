import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules';
import toNS from 'mongodb-ns';
import { fieldsChanged } from '../modules/fields';
import { refreshInputDocuments } from '../modules/input-documents';
import { indexesFetched } from '../modules/indexes';
import { runStage } from '../modules/pipeline';
import { createPipelineFromView } from '../modules/import-pipeline';
import { openPipeline } from '../modules/saved-pipeline';
import { PipelinePreviewManager } from '../modules/pipeline-builder/pipeline-preview-manager';

/**
 * Refresh the input documents.
 *
 * @param {Store} store - The store.
 */
export const refreshInput = (store) => {
  store.dispatch(refreshInputDocuments());
};

/**
 * Set the fields for the autocompleter.
 *
 * @param {Store} store - The store.
 * @param {Array} fields - The fields array in the ACE autocompleter format.
 */
export const setFields = (store, fields) => {
  store.dispatch(fieldsChanged(fields));
};

export const setIndexes = (store, indexes) => {
  store.dispatch(
    indexesFetched(
      indexes.map((index) => index.getAttributes({ props: true }, true))
    )
  );
};

/**
 * One method configure store call.
 *
 * @param {Options} options - The options.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const { collection } = toNS(options?.namespace ?? '');

  const store = createStore(
    reducer,
    {
      appRegistry: {
        localAppRegistry: options.localAppRegistry ?? null,
        globalAppRegistry: options.globalAppRegistry ?? null
      },
      dataService: {
        error: options.dataProvider?.error ?? null,
        dataService: options.dataProvider?.dataProvider ?? null
      },
      namespace: collection ? options.namespace : undefined,
      serverVersion: options.serverVersion,
      isTimeSeries: options.isTimeSeries,
      isReadonly: options.isReadonly,
      sourceName: options.sourceName,
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
        options.globalAppRegistry?.getStore('App.InstanceStore').getState()
          .instance.env,
      // options.isAtlasDeployed is only used by mms to change some behaviour in the
      // aggregations plugin
      isAtlasDeployed:
        options.isAtlasDeployed !== null &&
        options.isAtlasDeployed !== undefined,
      // options.fields is only used by mms, but always set to [] which is the initial value anyway
      fields: options.fields ?? [],
      // options.outResultsFn is only used by mms
      outResultsFn: options.outResultsFn,
      editViewName: options.editViewName,
      pipeline: options.sourcePipeline
        ? createPipelineFromView(options.sourcePipeline)
        : undefined
    },
    applyMiddleware(
      thunk.withExtraArgument({
        pipelinePreviewManager: new PipelinePreviewManager(
          options.dataProvider?.dataProvider ?? null
        )
      })
    )
  );

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;

    /**
     * Refresh documents on data refresh.
     */
    localAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    /**
     * When the schema fields change, update the state with the new
     * fields.
     *
     * @param {Object} fields - The fields.
     */
    localAppRegistry.on('fields-changed', (fields) => {
      setFields(store, fields.aceFields);
    });

    localAppRegistry.on('indexes-changed', (ixs) => {
      setIndexes(store, ixs);
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    /**
     * Refresh documents on global data refresh.
     */
    globalAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    globalAppRegistry.on('import-finished', ({ ns }) => {
      const { namespace } = store.getState();
      if (ns === namespace) {
        refreshInput(store);
      }
    });
  }

  // If we are loading aggregation, open pipeline (this will kick off preview
  // fetch when loaded)
  if (options.aggregation) {
    store.dispatch(openPipeline(options.aggregation));
    // Otherwise if we are editing a view pipeline, kick off preview fetch right
    // away
  } else if (options.editViewName) {
    store.dispatch(runStage(0, true));
  }

  if (collection) {
    refreshInput(store);
  }

  return store;
};

export default configureStore;
