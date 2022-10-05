import { expect } from 'chai';
import { EventEmitter } from 'events';
import AppRegistry from 'hadron-app-registry';
import sinon from 'sinon';
import store, { INITIAL_STATE, reset } from './index';
import { dataLakeChanged } from '../modules/is-data-lake';
import { namespaceChanged } from '../modules/namespace';
import { serverVersionChanged } from '../modules/server-version';

class FakeDataLake extends EventEmitter {
  isDataLake = false;
}

class FakeBuild extends EventEmitter {
  version = '0.0.0';
}

class FakeInstance extends EventEmitter {
  dataLake = new FakeDataLake();
  build = new FakeBuild();
}

describe('Collection Store', function () {
  let appRegistry: AppRegistry;
  let dispatchSpy: sinon.SinonSpy;

  before(function () {
    appRegistry = new AppRegistry();
    store.onActivated(appRegistry);
  });

  beforeEach(function () {
    store.dispatch(reset());
    dispatchSpy = sinon.spy(store, 'dispatch');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#onActivated', function () {
    describe('on instance-created', function () {
      let instance: FakeInstance;

      before(function () {
        instance = new FakeInstance();
        appRegistry.emit('instance-created', { instance });
      });

      it('ignores instance change:collections.status ready for other namespaces', function () {
        store.dispatch(namespaceChanged('foo.bar'));
        const collection = { ns: 'foo.baz' };
        dispatchSpy.resetHistory();
        instance.emit('change:collections.status', collection, 'ready');
        expect(dispatchSpy.args).to.deep.equal([
          [
            {
              namespace: 'foo.bar',
              stats: {
                avgDocumentSize: 'N/A',
                avgIndexSize: 'N/A',
                documentCount: 'N/A',
                indexCount: 'N/A',
                storageSize: 'N/A',
                totalIndexSize: 'N/A',
              },
              type: 'collection/stats/UPDATE_COLLECTION_DETAILS',
            },
          ],
        ]);
      });

      it('responds to instance change:collections.status', function () {
        store.dispatch(namespaceChanged('foo.bar'));

        const collection = { ns: 'foo.bar' };

        expect(store.getState().stats).to.deep.equal({});

        instance.emit(
          'change:collections.status',
          { ...collection, document_count: 1 },
          'ready'
        );
        expect(store.getState().stats['foo.bar'].documentCount).to.equal('1');

        instance.emit('change:collections.status', collection, 'error');
        expect(store.getState().stats['foo.bar'].documentCount).to.equal('N/A');
      });

      it('responds to instance.dataLake change:isDataLake', function () {
        expect(store.getState().isDataLake).to.equal(false);
        instance.dataLake.emit('change:isDataLake', {}, true);
        expect(store.getState().isDataLake).to.equal(true);
      });

      it('responds to instance.build change:version', function () {
        // NOTE: from initial state, not instance.build.version at instance-created time
        expect(store.getState().serverVersion).to.equal('4.0.0');
        instance.build.emit('change:version', {}, '1.2.3');
        expect(store.getState().serverVersion).to.equal('1.2.3');
      });
    });

    it('responds to instance-destroyed', function () {
      const initialState = {
        ...INITIAL_STATE,
        appRegistry,
      };

      expect(store.getState()).to.deep.equal(initialState);

      store.dispatch(dataLakeChanged(true));
      store.dispatch(serverVersionChanged('1.2.3'));

      expect(store.getState()).to.deep.equal({
        ...initialState,
        isDataLake: true,
        serverVersion: '1.2.3',
      });

      appRegistry.emit('instance-destroyed');

      expect(store.getState()).to.deep.equal(initialState);
    });
  });
});
