import { EventEmitter } from 'events';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';
import type { IndexesDataService } from './store';
import { activateIndexesPlugin, type IndexesStore } from './store';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

class FakeInstance extends EventEmitter {
  isWritable = true;
  description = 'initial description';
}

const fakeInstance = new FakeInstance();

describe('IndexesStore [Store]', function () {
  let globalAppRegistry: AppRegistry;
  let localAppRegistry: AppRegistry;

  let store: IndexesStore;
  let deactivate: () => void;

  beforeEach(function () {
    globalAppRegistry = new AppRegistry();
    localAppRegistry = new AppRegistry();

    const plugin = activateIndexesPlugin(
      {
        namespace: 'test.coll',
        isReadonly: true,
        serverVersion: '6.0.0',
        isSearchIndexesSupported: true,
      },
      {
        globalAppRegistry: globalAppRegistry,
        localAppRegistry: localAppRegistry,
        instance: fakeInstance as any,
        dataService: {
          indexes: (
            ns: string,
            options: unknown,
            callback: (...args: any[]) => void
          ) => {
            callback('err', []);
          },
          isConnected: () => true,
        } as IndexesDataService,
        logger: createNoopLoggerAndTelemetry(),
      },
      createActivateHelpers()
    );
    store = plugin.store;
    deactivate = () => plugin.deactivate();
  });

  afterEach(function () {
    deactivate();
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
