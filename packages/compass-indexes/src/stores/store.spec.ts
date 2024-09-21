import { EventEmitter } from 'events';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import { type IndexesStore } from './store';
import { setupStore } from '../../test/setup-store';

class FakeInstance extends EventEmitter {
  isWritable = true;
  description = 'initial description';
}

const fakeInstance = new FakeInstance();

describe('IndexesStore [Store]', function () {
  let localAppRegistry: AppRegistry;
  let store: IndexesStore;
  beforeEach(function () {
    localAppRegistry = new AppRegistry();
    store = setupStore(
      {
        namespace: 'test.coll',
        isReadonly: true,
      },
      undefined,
      {
        localAppRegistry,
        instance: fakeInstance as any,
      }
    );
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
});
