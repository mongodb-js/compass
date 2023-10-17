import { EventEmitter } from 'events';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import configureStore from './';

class FakeInstance extends EventEmitter {
  isWritable = true;
  description = 'initial description';
}

const fakeInstance = new FakeInstance();

const fakeAppInstanceStore = {
  getState: function () {
    return {
      instance: fakeInstance,
    };
  },
};

describe('IndexesStore [Store]', function () {
  let appRegistry;
  let localAppRegistry;

  let store;

  beforeEach(function () {
    appRegistry = new AppRegistry();
    localAppRegistry = new AppRegistry();
    appRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);

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

  it('sets the namespace', function () {
    expect(store.getState().namespace).to.equal('test.coll');
  });

  it('sets is readonly', function () {
    expect(store.getState().isReadonlyView).to.equal(true);
  });

  it('sets the data service', function () {
    expect(store.getState().dataService).to.not.equal(null);
  });

  context('when instance state changes', function () {
    before(function () {
      expect(store.getState().isWritable).to.equal(true);
      expect(store.getState().description).to.equal('initial description');

      fakeInstance.isWritable = false;
      fakeInstance.emit(
        'change:isWritable',
        fakeInstance,
        fakeInstance.isWritable
      );
      fakeInstance.description = 'test description';
      fakeInstance.emit(
        'change:description',
        fakeInstance,
        fakeInstance.description
      );
    });

    it('dispatches the writeStateChanged action', function () {
      expect(store.getState().isWritable).to.equal(false);
    });

    it('dispatches the getDescription action', function () {
      expect(store.getState().description).to.equal('test description');
    });
  });

  context('refresh-data emitted', function () {
    it('dispatches the load indexes action', function () {
      localAppRegistry.emit('refresh-data');
      expect(store.getState().regularIndexes.indexes).to.deep.equal([]);
    });
  });
});
