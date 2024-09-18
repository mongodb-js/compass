import { EventEmitter } from 'events';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';
import type { IndexesDataService } from './store';
import { activateIndexesPlugin, type IndexesStore } from './store';

import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

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
          indexes: () => {
            return Promise.resolve([]);
          },
          isConnected: () => true,
        } as unknown as IndexesDataService,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        connectionInfoRef: {
          current: {
            id: 'TEST',
          },
        } as ConnectionInfoRef,
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

  context('in-progress-indexes-added', function () {
    it('dispatches the load indexes action', function (done) {
      // so it will actually merge
      store.getState().isReadonlyView = false;

      const newIndex = {
        id: 'my-new-index',
        key: { description: 'text' },
        fields: [{ field: 'description', value: 'text' }],
        name: 'description_text',
        ns: 'my_collection',
        size: 1,
        relativeSize: 2,
        usageCount: 3,
        extra: {
          status: 'inprogress',
        },
      };

      localAppRegistry.once('indexes-changed', (allIndexes) => {
        expect(allIndexes).to.deep.equal([newIndex]);
        done();
      });

      localAppRegistry.emit('in-progress-indexes-added', newIndex);
    });
  });
});
