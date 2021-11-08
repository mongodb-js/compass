import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import toNS from 'mongodb-ns';
import numeral from 'numeral';
import createDebug from 'debug';
const debug = createDebug('compass-collection-stats:store');

const kInstance = Symbol('instance');
const kGlobalAppRegistry = Symbol('globalAppRegistry');

/**
 * Invalid stats.
 */
const INVALID = 'N/A';

const store = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  updateCollectionDetails(collection) {
    const newState = {
      namespace: collection.ns,
      isReadonly: collection.readonly,
      isTimeSeries: collection.type === 'timeseries',
      ...this._parseCollectionDetails(collection),
    };
    this.setState(newState);
  },

  /**
   * Initialize the Collection Stats store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      namespace: '',
      isReadonly: false,
      isTimeSeries: false,
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
      rawAvgIndexSize: 0,
    };
  },

  _parseCollectionDetails(result) {
    return {
      documentCount:
        result.document_count !== undefined
          ? this._format(result.document_count)
          : INVALID,
      totalDocumentSize: this._format(result.document_size, 'b'),
      avgDocumentSize: this._format(
        this._avg(result.document_size, result.document_count),
        'b'
      ),
      indexCount: this._format(result.index_count),
      totalIndexSize: this._format(result.index_size, 'b'),
      avgIndexSize: this._format(
        this._avg(result.index_size, result.index_count),
        'b'
      ),
      rawDocumentCount: result.document_count,
      rawTotalDocumentSize: result.document_size,
      rawAvgDocumentSize: this._avg(
        result.document_size,
        result.document_count
      ),
      rawIndexCount: result.index_count,
      rawTotalIndexSize: result.index_size,
      rawAvgIndexSize: this._avg(result.index_size, result.index_count),
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
  },
});

function onCollectionStatusChange(model, status) {
  if (model.ns === store.state.namespace) {
    if (status === 'ready') {
      store.updateCollectionDetails(model);
    }
    if (status === 'error') {
      debug('failed to fetch collection details', model.statusError);
      this.setState(this.getInitialState());
    }
  }
}

function onInstanceDestroyed() {
  store[kInstance] = null;
}

/**
 * Collection Stats store.
 */
const configureStore = ({
  namespace,
  globalAppRegistry
} = {}) => {
  const { instance } =
    globalAppRegistry.getStore('App.InstanceStore')?.getState() ?? {};

  if (!store[kGlobalAppRegistry]) {
    store[kGlobalAppRegistry] = globalAppRegistry;
    globalAppRegistry.on('instance-destroyed', onInstanceDestroyed);
  }

  if (!store[kInstance]) {
    store[kInstance] = instance;
    instance.on('change:collections.status', onCollectionStatusChange);
  }

  store.setState({ namespace });

  const { database, ns } = toNS(namespace);

  const coll = instance.databases.get(database)?.collections.get(ns) ?? {};

  store.updateCollectionDetails(coll);

  return store;
};

export default configureStore;
