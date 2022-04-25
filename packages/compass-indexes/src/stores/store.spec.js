import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { expect } from 'chai';

import configureStore from './';

const WriteStateStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { isWritable: true, description: 'store initial state description' };
  },
});

describe('IndexesStore [Store]', function () {
  let appRegistry;
  let localAppRegistry;

  let store;

  beforeEach(function () {
    appRegistry = new AppRegistry();
    localAppRegistry = new AppRegistry();
    appRegistry.registerStore(
      'DeploymentAwareness.WriteStateStore',
      WriteStateStore
    );

    store = configureStore({
      globalAppRegistry: appRegistry,
      localAppRegistry: localAppRegistry,
      namespace: 'test.coll',
      dataProvider: {
        error: null,
        dataProvider: {
          indexes: (ns, options, callback) => {
            callback('err', []);
          },
          isConnected: () => true,
        },
      },
      isReadonly: true,
    });
  });

  it('activates the app registry module', function () {
    expect(store.getState().appRegistry.globalAppRegistry).to.deep.equal(
      appRegistry
    );
  });

  it('sets the namespace', function () {
    expect(store.getState().namespace).to.equal('test.coll');
  });

  it('sets is readonly', function () {
    expect(store.getState().isReadonlyView).to.equal(true);
  });

  it('sets the data service', function () {
    expect(store.getState().dataService).to.not.equal(null);
  });

  context('when write state changes', function () {
    beforeEach(function () {
      expect(store.getState().isWritable).to.equal(true); // initial state
      WriteStateStore.setState({
        isWritable: false,
        description: 'test description',
      });
    });

    it('dispatches the change write state action', function () {
      expect(store.getState().isWritable).to.equal(false);
      expect(store.getState().description).to.equal('test description');
    });
  });

  context('refresh-data emitted', function () {
    it('dispatches the load indexes action', function () {
      localAppRegistry.emit('refresh-data');
      expect(store.getState().indexes).to.deep.equal([]);
    });
  });
});
