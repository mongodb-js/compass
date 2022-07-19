/* eslint complexity: 0 */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, { newPipelineFromPaste, openPipeline } from '../modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from '../modules/namespace';
import { dataServiceConnected } from '../modules/data-service';
import { fieldsChanged } from '../modules/fields';
import { refreshInputDocuments } from '../modules/input-documents';
import { serverVersionChanged } from '../modules/server-version';
import { setIsAtlasDeployed } from '../modules/is-atlas-deployed';
import { outResultsFnChanged } from '../modules/out-results-fn';
import { envChanged } from '../modules/env';
import { isTimeSeriesChanged } from '../modules/is-time-series';
import { isReadonlyChanged } from '../modules/is-readonly';
import { sourceNameChanged } from '../modules/source-name';
import { modifyView } from '../modules';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { setDataLake } from '../modules/is-datalake';
import { indexesFetched } from '../modules/indexes';

/**
 * Refresh the input documents.
 *
 * @param {Store} store - The store.
 */
export const refreshInput = (store) => {
  store.dispatch(refreshInputDocuments());
};

/**
 * Set if the plugin is deployed in Atlas.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isAtlas - If the plugin is running in Atlas.
 */
export const setIsAtlas = (store, isAtlas) => {
  store.dispatch(setIsAtlasDeployed(isAtlas));
};

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (store, error, provider) => {
  store.dispatch(dataServiceConnected(error, provider));
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store, ns) => {
  const namespace = toNS(ns);
  if (namespace.collection) {
    store.dispatch(namespaceChanged(ns));
    refreshInput(store);
  }
};

/**
 * Set the $out results custom handler function.
 *
 * @param {Store} store - The store.
 * @param {Function} fn - The function.
 */
export const setOutResultsFn = (store, fn) => {
  store.dispatch(outResultsFnChanged(fn));
};

/**
 * Set the server version.
 *
 * @param {Store} store - The store.
 * @param {String} version - The version.
 */
export const setServerVersion = (store, version) => {
  store.dispatch(serverVersionChanged(version));
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
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (store, appRegistry) => {
  store.dispatch(localAppRegistryActivated(appRegistry));
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (store, appRegistry) => {
  store.dispatch(globalAppRegistryActivated(appRegistry));
};

/**
 * Set the view source.
 *
 * @param {Store} store - The store.
 * @param {String} name - The name.
 * @param {Array} pipeline - The pipeline.
 * @param {Boolean} isReadonly - The isReadonly flag.
 * @param {String} sourceName - The namespace on which created the view.
 */
export const setViewSource = (store, name, pipeline, isReadonly, sourceName) => {
  store.dispatch(modifyView(name, pipeline, isReadonly, sourceName));
};

/**
 * Set the environment.
 *
 * @param {Store} store - The store.
 * @param {String} env - The env. (atlas, adl, on-prem).
 */
export const setEnv = (store, env) => {
  store.dispatch(envChanged(env));
};

/**
 * Set the isTimeSeries flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isTimeSeries - If the collection is a time-series collection.
 */
export const setIsTimeSeries = (store, isTimeSeries) => {
  store.dispatch(isTimeSeriesChanged(isTimeSeries));
};

/**
 * Set the isReadonly flag in the store.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isReadonly - If the collection is a read-only collection.
 */
export const setIsReadonly = (store, isReadonly) => {
  store.dispatch(isReadonlyChanged(isReadonly));
};

/**
 * Set the sourceName flag in the store.
 *
 * @param {Store} store - The store.
 * @param {String} sourceName - The view created on the sourceName collection.
 */
export const setSourceNames = (store, sourceName) => {
  store.dispatch(sourceNameChanged(sourceName));
};

/**
 * One method configure store call.
 *
 * @param {Options} options - The options.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    setLocalAppRegistry(store, localAppRegistry);

    /**
     * Refresh documents on data refresh.
     */
    localAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    localAppRegistry.on('open-aggregation', () => {
      // newPipelineFromPaste
      refreshInput(store);
    });

    localAppRegistry.on('open-aggregation-in-editor', (pipelineText) => {
      console.log('Aggregations open pipeline from text from nlp', pipelineText);
      newPipelineFromPaste(pipelineText)(store.dispatch);
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
    setGlobalAppRegistry(store, globalAppRegistry);

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

    /**
     * Set the environment.
     */
    globalAppRegistry.on('compass:deployment-awareness:topology-changed', (data) => {
      setEnv(store, data.env);
    });
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  if (options.isAtlasDeployed !== null && options.isAtlasDeployed !== undefined) {
    setIsAtlas(store, options.isAtlasDeployed);
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    setNamespace(store, options.namespace);
  }

  // Setting server version in fields can change in order but must be after
  // the previous options.
  if (options.serverVersion) {
    setServerVersion(store, options.serverVersion);
  }
  if (options.fields) {
    setFields(store, options.fields);
  }
  if (options.outResultsFn) {
    setOutResultsFn(store, options.outResultsFn);
  }

  if (options.editViewName) {
    setViewSource(
      store,
      options.editViewName,
      options.sourcePipeline,
      options.isReadonly,
      options.sourceName
    );
  }

  if (options.env) {
    setEnv(store, options.env);
  } else if (global && global.hadronApp && global.hadronApp.appRegistry) {
    const deploymentAwarenessStore = global.hadronApp.appRegistry.getStore('DeploymentAwareness.Store');
    if (deploymentAwarenessStore) {
      setEnv(store, deploymentAwarenessStore.state.env);
    }
  }

  if (options.isTimeSeries) {
    setIsTimeSeries(store, options.isTimeSeries);
  }

  if (options.isReadonly) {
    setIsReadonly(store, options.isReadonly);
  }

  if (options.sourceName) {
    setSourceNames(store, options.sourceName);
  }

  if (options.aggregation) {
    openPipeline(options.aggregation)(store.dispatch);
  }

  if (options.isDataLake) {
    store.dispatch(setDataLake(options.isDataLake));
  }

  return store;
};

export default configureStore;
