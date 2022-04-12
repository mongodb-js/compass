/* eslint-disable camelcase */
import type AppRegistry from 'hadron-app-registry';
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

const isNumber = (val: any) => {
  return typeof val === 'number' && !isNaN(val);
};

const store: any = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  updateCollectionDetails(collection: any) {
    const newState = {
      namespace: collection.ns,
      isReadonly: Boolean(collection.readonly),
      isTimeSeries: collection.type === 'timeseries',
      ...this._formatCollectionStats(collection),
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
      isEditing: false,
      isReadonly: false,
      isTimeSeries: false,
      documentCount: INVALID,
      storageSize: INVALID,
      avgDocumentSize: INVALID,
      indexCount: INVALID,
      totalIndexSize: INVALID,
      avgIndexSize: INVALID,
    };
  },

  _formatCollectionStats(collectionModel: any) {
    const {
      document_count,
      index_count,
      index_size,
      status,
      avg_document_size,
      storage_size,
      free_storage_size,
    } = collectionModel;

    if (['initial', 'fetching', 'error'].includes(status)) {
      return {
        documentCount: INVALID,
        storageSize: INVALID,
        avgDocumentSize: INVALID,
        indexCount: INVALID,
        totalIndexSize: INVALID,
        avgIndexSize: INVALID,
      };
    }

    return {
      documentCount: this._format(document_count),
      storageSize: this._format(storage_size - free_storage_size, 'b'),
      avgDocumentSize: this._format(avg_document_size, 'b'),
      indexCount: this._format(index_count),
      totalIndexSize: this._format(index_size, 'b'),
      avgIndexSize: this._format(this._avg(index_size, index_count), 'b'),
    };
  },

  _avg(size: number, count: number) {
    if (count <= 0) {
      return 0;
    }
    return size / count;
  },

  _format(value: any, format = 'a') {
    if (!isNumber(value)) {
      return INVALID;
    }
    const precision = value <= 1000 ? '0' : '0.0';
    return numeral(value).format(precision + format);
  },
});

function onCollectionStatusChange(model: any, status: string) {
  if (model.ns === store.state.namespace) {
    if (status === 'ready') {
      store.updateCollectionDetails(model);
    }
    if (status === 'error') {
      debug('failed to fetch collection details', model.statusError);
      store.setState({
        ...store.getInitialState(),
        namespace: store.state.namespace,
      });
    }
  }
}

// We use these symbols so that nothing from outside can access these values on
// the store
const kInstance = Symbol('instance');
const kGlobalAppRegistry = Symbol('globalAppRegistry');

function onInstanceDestroyed() {
  // When instance destroyed, remove the reference so that configureStore knows
  // that we need to re-attach status change listeners again
  store[kInstance] = null;
}

/**
 * Collection Stats store.
 */
const configureStore = (storeOptions: any): any => {
  const namespace: string | undefined = storeOptions.namespace;
  const globalAppRegistry: AppRegistry = storeOptions.globalAppRegistry;
  const isEditing: boolean = storeOptions.isEditing || false;

  if (!namespace) {
    throw new Error('Trying to render collection stats without namespace');
  }

  const instanceStore: any = globalAppRegistry.getStore('App.InstanceStore');
  const { instance } = instanceStore?.getState() ?? {};

  if (!instance) {
    throw new Error(
      'Trying to configure collection stats plugin store without instance model'
    );
  }

  // We only want to attach listeners to the instance once if we haven't done it
  // before, we use stored instances as a flag to determine if we did it already
  if (!store[kGlobalAppRegistry]) {
    store[kGlobalAppRegistry] = globalAppRegistry;
    globalAppRegistry.on('instance-destroyed', onInstanceDestroyed);
  }

  if (!store[kInstance]) {
    store[kInstance] = instance;
    instance.on('change:collections.status', onCollectionStatusChange);
  }

  store.setState({ namespace, isEditing });

  const { database, ns } = toNS(namespace);

  const coll = instance.databases?.get(database)?.collections.get(ns) ?? null;

  if (!coll) {
    throw new Error(
      `Couldn't find collection model for namespace ${namespace}`
    );
  }

  store.updateCollectionDetails(coll);

  return store;
};

export default configureStore;
