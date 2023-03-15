import { EventEmitter } from 'events';
import AppRegistry from 'hadron-app-registry';
import { InstanceStore as store } from './';
import { reset } from '../modules/instance/reset';
import { INITIAL_STATE } from '../modules/instance/instance';
import { changeDataService } from '../modules/instance/data-service';
import { once } from 'events';
import sinon from 'sinon';
import { expect } from 'chai';

class FakeDataService extends EventEmitter {
  getConnectionString() {
    return { hosts: ['localhost:27020'] };
  }
  instance() {
    return Promise.resolve(this.instanceInfo);
  }
  listDatabases() {
    return Promise.resolve([]);
  }
  listCollections() {
    return Promise.resolve([]);
  }
  getLastSeenTopology() {
    return {
      type: 'Unknown',
      servers: [],
      setName: 'foo',
    };
  }
}

function createDataService(
  instanceInfo = { build: { version: '1.2.3' }, host: { arch: 'x64' } }
) {
  const dataService = new FakeDataService();
  dataService.instanceInfo = instanceInfo;
  return dataService;
}

describe('InstanceStore [Store]', function () {
  beforeEach(function () {
    store.dispatch(reset());
  });

  afterEach(function () {
    store.dispatch(reset());
  });

  describe('#onActivated', function () {
    let hideSpy;
    let configureSpy;
    let showIndeterminateProgressBarSpy;
    let emitSpy;

    const hadronAppBkp = global.hadronApp;

    beforeEach(function () {
      global.hadronApp = {
        appRegistry: new AppRegistry(),
      };

      emitSpy = sinon.spy(global.hadronApp.appRegistry, 'emit');
      hideSpy = sinon.spy();
      configureSpy = sinon.spy();
      showIndeterminateProgressBarSpy = sinon.spy();
      global.hadronApp.appRegistry.getAction = () => ({
        hide: hideSpy,
        configure: configureSpy,
        showIndeterminateProgressBar: showIndeterminateProgressBarSpy,
      });
      store.onActivated(global.hadronApp.appRegistry);
    });

    afterEach(function () {
      global.hadronApp = hadronAppBkp;
      emitSpy = null;
      hideSpy = null;
      configureSpy = null;
    });

    context('when data service connects', function () {
      const dataService = createDataService();

      beforeEach(async function () {
        expect(store.getState().dataService).to.deep.equal(null); // initial state
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit(
          'data-service-connected',
          null,
          dataService
        );
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('dispatches the change data service action', function () {
        expect(store.getState().dataService).to.equal(dataService);
      });

      it('creates instance and makes it globally available through global.hadronApp.instance', function () {
        const { instance } = store.getState();
        expect(store.getState().instance.getType()).to.equal('Instance');
        expect(global.hadronApp.instance).to.equal(instance);
      });

      it('emits instance-refreshed event', function () {
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-created',
          'instance-refreshed',
        ]);
      });
    });

    context('when data service connects with error', function () {
      beforeEach(function () {
        expect(store.getState().dataService).to.deep.equal(null); // initial state
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit(
          'data-service-connected',
          { message: 'test err msg' },
          null
        );
      });

      it('sets dataService to null', function () {
        expect(store.getState().dataService).to.equal(null);
      });

      it('sets instance to null', function () {
        expect(store.getState().instance).to.equal(null);
      });

      it('sets errorMessage', function () {
        expect(store.getState().errorMessage).to.equal('test err msg');
      });

      it('emits instance-refreshed event', function () {
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql(['data-service-connected', 'instance-refreshed']);
      });
    });

    context('on refresh data', function () {
      beforeEach(async function () {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit(
          'data-service-connected',
          null,
          createDataService()
        );
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '1.2.3'
        );
        store.dispatch(
          changeDataService(createDataService({ build: { version: '3.2.1' } }))
        );
        global.hadronApp.appRegistry.emit('refresh-data');
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('calls instance model fetch', function () {
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '3.2.1'
        );
      });

      it('emits instance-changed event', function () {
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-created',
          'instance-refreshed',
          'refresh-data',
          'instance-refreshed',
        ]);
      });
    });

    context('on agg pipeline out', function () {
      beforeEach(async function () {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit(
          'data-service-connected',
          null,
          createDataService()
        );
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '1.2.3'
        );
        store.dispatch(
          changeDataService(createDataService({ build: { version: '3.2.1' } }))
        );
        global.hadronApp.appRegistry.emit('agg-pipeline-out-executed');
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('calls instance model fetch', function () {
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '3.2.1'
        );
      });

      it('emits instance-changed event', function () {
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-created',
          'instance-refreshed',
          'agg-pipeline-out-executed',
          'instance-refreshed',
        ]);
      });
    });
  });
});
