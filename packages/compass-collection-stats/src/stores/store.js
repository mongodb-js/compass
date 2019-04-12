import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import numeral from 'numeral';

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
  store.isReadonly = isReadonly;
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
      if (toNS(this.ns || '').collection) {
        if (this.isReadonly) {
          this.setState(this.getInitialState());
        } else {
          if (this.dataService) {
            this.dataService.collection(this.ns, {}, (err, result) => {
              if (!err) {
                this.setState(this._parseCollectionDetails(result));
              }
            });
          }
        }
      }
    },

    /**
     * Initialize the Collection Stats store state. The returned object must
     * contain all keys that you might want to modify with this.setState().
     *
     * @return {Object} initial store state.
     */
    getInitialState() {
      return {
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
