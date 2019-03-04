import AppRegistry from 'hadron-app-registry';
import { InstanceStore as store } from 'stores';
import { reset } from 'modules/instance/reset';
import { INITIAL_STATE } from 'modules/instance/instance';

describe('InstanceStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

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
      beforeEach(() => {
        expect(store.getState().dataService).to.deep.equal(null); // initial state
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.instance = 'instance';
        global.hadronApp.appRegistry.emit('data-service-connected', null, 'ds');
      });

      it('dispatches the change data service action', () => {
        expect(store.getState().dataService).to.equal('ds');
      });
      it('sets initial instance to global.hadronApp.instance', () => {
        expect(store.getState().instance).to.equal('instance');
      });
      it('calls StatusAction hide', () => {
        expect(hideSpy.calledOnce).to.equal(true);
      });
      it('emits instance-changed event', () => {
        expect(emitSpy.callCount).to.equal(3);
        expect(emitSpy.args[2][0]).to.equal('instance-refreshed');
        expect(emitSpy.args[2][1].instance).to.deep.equal('instance');
      });
    });
    context('on refresh data', () => {
      beforeEach(() => {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.instance = {
          fetch: (arg) => {
            arg.success('result');
          }
        };
        global.hadronApp.appRegistry.emit('data-service-connected', null, {
          get: () => ({_id: 'test'})
        });
        global.hadronApp.appRegistry.emit('refresh-data');
      });
      it('calls statusAction configure', () => {
        expect(configureSpy.called).to.equal(true);
        expect(configureSpy.args[0]).to.deep.equal([
          { animation: true, message: 'Loading databases', visible: true }
        ]);
      });
      it('calls instance model fetch', () => {
        expect(store.getState().instance).to.equal('result');
      });
      it('emits instance-changed event', () => {
        expect(emitSpy.callCount).to.equal(5);
        expect(emitSpy.args[4][0]).to.equal('instance-refreshed');
        expect(emitSpy.args[4][1].instance).to.deep.equal('result');
      });
    });
    context('on agg pipeline out', () => {
      beforeEach(() => {
        expect(store.getState().instance).to.deep.equal(INITIAL_STATE);
        global.hadronApp.instance = {
          fetch: (arg) => {
            arg.success('result2');
          }
        };
        global.hadronApp.appRegistry.emit('data-service-connected', null, {
          get: () => ({_id: 'test'})
        });
        global.hadronApp.appRegistry.emit('agg-pipeline-out-executed');
      });
      it('calls statusAction configure', () => {
        expect(configureSpy.called).to.equal(true);
        expect(configureSpy.args[0]).to.deep.equal([
          { animation: true, message: 'Loading databases', visible: true }
        ]);
      });
      it('calls instance model fetch', () => {
        expect(store.getState().instance).to.equal('result2');
      });
      it('emits instance-changed event', () => {
        expect(emitSpy.callCount).to.equal(5);
        expect(emitSpy.args[4][0]).to.equal('instance-refreshed');
        expect(emitSpy.args[4][1].instance).to.deep.equal('result2');
      });
    });
  });
});
