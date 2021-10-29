import AppRegistry from 'hadron-app-registry';
import { InstanceStore as store } from './';
import { reset } from '../modules/instance/reset';
import { INITIAL_STATE } from '../modules/instance/instance';
import { changeDataService } from '../modules/instance/data-service';
import { once } from 'events';

describe('InstanceStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  function createDataService(
    instanceInfo = { build: { version: '1.2.3' }, host: { arch: 'x64' } }
  ) {
    return {
      getConnectionString() {
        return { hosts: ['localhost:27020'] };
      },
      instance(cb) {
        cb(null, instanceInfo);
        return;
      },
      listDatabases(_opts, cb) {
        cb(null, []);
        return;
      },
      listCollections(_dbName, cb) {
        cb(null, []);
        return;
      }
    };
  }

  describe('#onActivated', () => {
    let hold;
    let hideSpy;
    let configureSpy;
    let emitSpy;

    beforeEach(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      emitSpy = sinon.spy(global.hadronApp.appRegistry, 'emit');
      hideSpy = sinon.spy();
      configureSpy = sinon.spy();
      global.hadronApp.appRegistry.getAction = () => ({
        hide: hideSpy,
        configure: configureSpy
      });
      store.onActivated(global.hadronApp.appRegistry);
    });

    afterEach(() => {
      global.hadronApp.appRegistry = hold;
      emitSpy = null;
      hideSpy = null;
      configureSpy = null;
    });

    context('when data service connects', () => {
      const dataService = createDataService();

      beforeEach(async() => {
        expect(store.getState().dataService).to.deep.equal(null); // initial state
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit('data-service-connected', null, dataService);
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('dispatches the change data service action', () => {
        expect(store.getState().dataService).to.equal(dataService);
      });

      it('creates instance and makes it globally available through global.hadronApp.instance', () => {
        const {instance} = store.getState();
        expect(store.getState().instance.getType()).to.equal('Instance');
        expect(global.hadronApp.instance).to.equal(instance);
      });

      it('calls StatusAction hide', () => {
        expect(hideSpy.called).to.equal(true);
      });

      it('emits instance-refreshed event', () => {
        expect(emitSpy.callCount).to.equal(2);
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-refreshed'
        ]);
      });
    });

    context('when data service connects with error', () => {
      beforeEach(() => {
        expect(store.getState().dataService).to.deep.equal(null); // initial state
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit(
          'data-service-connected',
          { message: 'test err msg' },
          null
        );
      });

      it('sets dataService to null', () => {
        expect(store.getState().dataService).to.equal(null);
      });

      it('sets instance to null', () => {
        expect(store.getState().instance).to.equal(null);
      });

      it('sets errorMessage', () => {
        expect(store.getState().errorMessage).to.equal('test err msg');
      });

      it('emits instance-refreshed event', () => {
        expect(emitSpy.callCount).to.equal(2);
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-refreshed'
        ]);
      });
    });

    context('on refresh data', () => {
      beforeEach(async() => {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit('data-service-connected', null, createDataService());
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
        expect(store.getState().instance).to.have.nested.property('build.version', '1.2.3');
        store.dispatch(
          changeDataService(createDataService({ build: { version: '3.2.1' } }))
        );
        global.hadronApp.appRegistry.emit('refresh-data');
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('calls statusAction configure', () => {
        expect(configureSpy.called).to.equal(true);
        expect(configureSpy.args[0]).to.deep.equal([
          { animation: true, message: 'Loading databases', visible: true }
        ]);
      });

      it('calls instance model fetch', () => {
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '3.2.1'
        );
      });

      it('emits instance-changed event', () => {
        expect(emitSpy.callCount).to.equal(4);
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-refreshed',
          'refresh-data',
          'instance-refreshed',
        ]);
      });
    });

    context('on agg pipeline out', () => {
      beforeEach(async() => {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.appRegistry.emit('data-service-connected', null, createDataService());
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
        expect(store.getState().instance).to.have.nested.property('build.version', '1.2.3');
        store.dispatch(
          changeDataService(createDataService({ build: { version: '3.2.1' } }))
        );
        global.hadronApp.appRegistry.emit('agg-pipeline-out-executed');
        await once(global.hadronApp.appRegistry, 'instance-refreshed');
      });

      it('calls statusAction configure', () => {
        expect(configureSpy.called).to.equal(true);
        expect(configureSpy.args[0]).to.deep.equal([
          { animation: true, message: 'Loading databases', visible: true }
        ]);
      });

      it('calls instance model fetch', () => {
        expect(store.getState().instance).to.have.nested.property(
          'build.version',
          '3.2.1'
        );
      });

      it('emits instance-changed event', () => {
        expect(emitSpy.callCount).to.equal(4);
        const events = emitSpy.args.map(([evtName]) => evtName);
        expect(events).to.eql([
          'data-service-connected',
          'instance-refreshed',
          'agg-pipeline-out-executed',
          'instance-refreshed',
        ]);
      });
    });
  });
});
