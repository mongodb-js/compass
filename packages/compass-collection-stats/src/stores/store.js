import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import numeral from 'numeral';

/**
 * Invalid stats.
 */
const INVALID = 'N/A';

/**
 * Collection Stats store.
 */
const CollectionStatsStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * This method is called when all plugins are activated. You can register
   * listeners to other plugins' stores here, e.g.
   *
   * appRegistry.getStore('OtherPlugin.Store').listen(this.otherStoreChanged.bind(this));
   *
   * If this plugin does not depend on other stores, you can delete the method.
   *
   * @param {Object} appRegistry - app registry containing all stores and components
   */
  // eslint-disable-next-line no-unused-vars
  onActivated(appRegistry) {
    this.appRegistry = appRegistry;
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    appRegistry.on('document-deleted', this.onDocumentsModified.bind(this));
    appRegistry.on('document-inserted', this.onDocumentsModified.bind(this));
    appRegistry.on('import-finished', this.onDocumentsModified.bind(this));
    appRegistry.on('data-service-connected', this.onConnected.bind(this));
    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
    appRegistry.on('refresh-data', () => {
      const ns = appRegistry.getStore('App.NamespaceStore').ns;
      if (ns.indexOf('.' === 0)) {
        this.onDocumentsModified();
        this.onCollectionChanged();
      }
    });
  },

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
   * Handle document deletion.
   */
  onDocumentsModified() {
    this.loadCollectionStats();
  },

  /**
   * Handle collection being changed.
   *
   * @param {String} ns - The namespace.
   */
  onCollectionChanged(ns) {
    this.ns = ns;
    this.loadCollectionStats();
  },

  /**
   * Load the collection stats.
   *
   * @param {String} ns - The namespace.
   */
  loadCollectionStats() {
    if (toNS(this.ns || '').collection) {
      if (this.CollectionStore.isReadonly()) {
        this.setState(this.getInitialState());
        this.appRegistry.emit('document-count-loaded', null);
      } else {
        this.dataService.collection(this.ns, {}, (err, result) => {
          if (!err) {
            this.setState(this._parseCollectionDetails(result));
            console.log(result.document_count);
            this.appRegistry.emit('document-count-loaded', result.document_count);
          }
        });
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

export default CollectionStatsStore;
export { CollectionStatsStore };
