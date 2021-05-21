import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import numeral from 'numeral';
import createDebug from 'debug';
const debug = createDebug('compass-collection-stats:store');


/**
 * Invalid stats.
 */
const INVALID = 'N/A';

/**
 * Refresh the input.
 *
 * @param {Store} store - The store.
 */
export const refreshInput = (store) => {
  store.loadCollectionStats();
};

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (store, error, provider) => {
  store.onConnected(error, provider);
};

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Boolean} isReadonly - Is the store readonly.
 */
export const setIsReadonly = (store, isReadonly) => {
  store.setState({ isReadonly: isReadonly });
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
    store.ns = ns;
    refreshInput(store);
  }
};

/**
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (store, appRegistry) => {
  store.appRegistry = appRegistry;
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (store, appRegistry) => {
  store.globalAppRegistry = appRegistry;
};

/**
 * Collection Stats store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    /**
     * adds a state to the store, similar to React.Component's state
     * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
     *
     * If you call `this.setState({...})` this will cause the store to trigger
     * and push down its state as props to connected components.
     */
    mixins: [StateMixin.store],

    /**
     * Handle the data-service-connected event.
     *
     * @param {Error} err - The error.
     * @param {DataService} dataService - The data service.
     */
    onConnected(err, dataService) {
      if (!err) {
        this.dataService = dataService;
      }
    },

    /**
     * Load the collection stats.
     *
     * @param {String} ns - The namespace.
     */
    loadCollectionStats() {
      const collectionName = toNS(this.ns || '').collection;
      if (!collectionName) {
        return;
      }

      if (this.state.isReadonly) {
        this.setState(this.getInitialState());
      } else if (this.dataService && this.dataService.isConnected()) {
        this.fetchCollectionDetails();
      }
    },

    handleFetchError(err) {
      debug('failed to fetch collection details', err);
      this.setState(this.getInitialState());
    },

    ensureDocumentCount(result, cb) {
      if (result.document_count !== undefined) {
        return cb(null, result);
      }

      this.dataService.estimatedCount(this.ns, {}, (err, estimatedCount) => {
        if (err) {
          return cb(null, result);
        }

        cb(null, {
          ...result,
          document_count: estimatedCount
        });
      });
    },

    fetchCollectionDetails() {
      this.dataService.collection(this.ns, {}, (collectionError, result) => {
        if (collectionError) {
          return this.handleFetchError(collectionError);
        }

        this.ensureDocumentCount(result, (ensureDocumentCountError, resultWithDocumentCount) => {
          if (ensureDocumentCountError) {
            return this.handleFetchError(ensureDocumentCountError);
          }

          const details = this._parseCollectionDetails(resultWithDocumentCount);
          this.setState(details);
          if (this.globalAppRegistry) {
            this.globalAppRegistry.emit('compass:collection-stats:loaded', details);
          }
        });
      });
    },

    /**
     * Initialize the Collection Stats store state. The returned object must
     * contain all keys that you might want to modify with this.setState().
     *
     * @return {Object} initial store state.
     */
    getInitialState() {
      return {
        isReadonly: false,
        documentCount: INVALID,
        totalDocumentSize: INVALID,
        avgDocumentSize: INVALID,
        indexCount: INVALID,
        totalIndexSize: INVALID,
        avgIndexSize: INVALID,
        rawDocumentCount: 0,
        rawTotalDocumentSize: 0,
        rawAvgDocumentSize: 0,
        rawIndexCount: 0,
        rawTotalIndexSize: 0,
        rawAvgIndexSize: 0
      };
    },

    _parseCollectionDetails(result) {
      return {
        isReadonly: this.state.isReadonly || false,
        documentCount: this._format(result.document_count),
        totalDocumentSize: this._format(result.document_size, 'b'),
        avgDocumentSize: this._format(this._avg(result.document_size, result.document_count), 'b'),
        indexCount: this._format(result.index_count),
        totalIndexSize: this._format(result.index_size, 'b'),
        avgIndexSize: this._format(this._avg(result.index_size, result.index_count), 'b'),
        rawDocumentCount: result.document_count,
        rawTotalDocumentSize: result.document_size,
        rawAvgDocumentSize: this._avg(result.document_size, result.document_count),
        rawIndexCount: result.index_count,
        rawTotalIndexSize: result.index_size,
        rawAvgIndexSize: this._avg(result.index_size, result.index_count)
      };
    },

    _avg(size, count) {
      if (count <= 0) {
        return 0;
      }
      return size / count;
    },

    _format(value, format = 'a') {
      const precision = value <= 1000 ? '0' : '0.0';
      return numeral(value).format(precision + format);
    }
  });

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    setLocalAppRegistry(store, localAppRegistry);

    /**
     * When the collection is changed, update the store.
     */
    localAppRegistry.on('import-finished', () => {
      refreshInput(store);
    });

    /**
     * Refresh documents on data refresh.
     */
    localAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    /**
     * Refresh documents on document deletion.
     */
    localAppRegistry.on('document-deleted', () => {
      refreshInput(store);
    });

    /**
     * Refresh documents on document insertion.
     */
    localAppRegistry.on('document-inserted', () => {
      refreshInput(store);
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    setGlobalAppRegistry(store, globalAppRegistry);
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  if (options.isReadonly) {
    setIsReadonly(store, options.isReadonly);
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    setNamespace(store, options.namespace);
  }

  return store;
};

export default configureStore;
