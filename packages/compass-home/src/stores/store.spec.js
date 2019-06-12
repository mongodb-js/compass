import store from 'stores';
import { reset } from 'modules/reset';
import AppRegistry from 'hadron-app-registry';
import { changeInstanceId } from 'modules/instance-id';
import { activate } from '@mongodb-js/compass-app-stores';
import UI_STATES from 'constants/ui-states';

describe('HomeStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    let hold;
    const initialState = {
      authentication: 'NONE',
      sshTunnel: 'NONE',
      ssl: 'NONE',
      errorMessage: '',
      instanceId: '',
      isAtlas: false,
      isCollapsed: false,
      isConnected: false,
      namespace: '',
      title: '',
      uiStatus: UI_STATES.INITIAL,
      isDataLake: false
    };
    beforeEach(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      global.hadronApp.instance = {
        fetch: (s) => {
          s.success('new instance');
        }
      };
      activate(global.hadronApp.appRegistry);
      store.onActivated(global.hadronApp.appRegistry);
      global.hadronApp.appRegistry.onActivated();
    });
    afterEach(() => {
      global.hadronApp.appRegistry = hold;
    });
    it('has initial state', () => {
      expect(store.getState()).to.deep.equal(initialState);
    });
    context('on instance refresh with error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        global.hadronApp.appRegistry.emit('instance-refreshed', {
          errorMessage: 'err'
        });
      });
      it('dispatches the change error action', () => {
        expect(store.getState().errorMessage).to.equal('err');
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal(UI_STATES.ERROR);
      });
    });
    context('on instance refresh without error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        store.dispatch(changeInstanceId('test'));
        global.hadronApp.appRegistry.emit('instance-refreshed', {
          errorMessage: '',
          instance: { dataLake: {isDataLake: false} }
        });
      });
      it('dispatches the change error action', () => {
        expect(store.getState().errorMessage).to.equal('');
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal(UI_STATES.COMPLETE);
      });
      it('dispatches the change title action', () => {
        expect(store.getState().title).to.equal(' - test');
      });
    });
    context('on data-service-connected with error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        global.hadronApp.appRegistry.emit('data-service-connected', {
          message: 'err'
        }, null);
      });
      it('dispatches the change error action', () => {
        expect(store.getState().errorMessage).to.equal('err');
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal(UI_STATES.ERROR);
      });
    });
    context('on data-service-connected without error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        global.hadronApp.appRegistry.emit('data-service-connected', null, {
          get: () => {},
          client: {
            model: {
              instance_id: 'test_id',
              hostname: 'mongodb.net',
              authentication: 'test_auth',
              ssl: 'test_ssl',
              ssh_tunnel: 'test_ssh_tunnel'
            }
          }
        });
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal(UI_STATES.COMPLETE);
      });
      it('dispatches the isAtlas action', () => {
        expect(store.getState().isAtlas).to.equal(true);
      });
      it('dispatches the isConnected action', () => {
        expect(store.getState().isConnected).to.equal(true);
      });
      it('dispatches the authentication action', () => {
        expect(store.getState().authentication).to.equal('test_auth');
      });
      it('dispatches the ssl action', () => {
        expect(store.getState().ssl).to.equal('test_ssl');
      });
      it('dispatches the sshTunnel action', () => {
        expect(store.getState().sshTunnel).to.equal('test_ssh_tunnel');
      });
    });
    context('on data-service-disconnected from success', () => {
      beforeEach(() => {
        global.hadronApp.appRegistry.emit('data-service-connected', null, {
          get: () => {},
          client: {
            model: {
              instance_id: 'test_id',
              hostname: 'mongodb.net',
              authentication: 'test_auth',
              ssl: 'test_ssl',
              ssh_tunnel: 'test_ssh_tunnel'
            }
          }
        });
        expect(store.getState()).to.deep.equal({
          errorMessage: '',
          instanceId: 'test_id',
          isCollapsed: false,
          namespace: '',
          title: ' - test_id',
          isConnected: true,
          isAtlas: true,
          uiStatus: UI_STATES.COMPLETE,
          authentication: 'test_auth',
          ssl: 'test_ssl',
          sshTunnel: 'test_ssh_tunnel',
          isDataLake: false
        });
        global.hadronApp.appRegistry.emit('data-service-disconnected');
      });
      it('resets to initial state', () => {
        expect(store.getState()).to.deep.equal(initialState);
      });
    });
    context('on data-service-disconnected from error', () => {
      beforeEach(() => {
        global.hadronApp.appRegistry.emit('data-service-connected', {
          message: 'err'
        }, null);
        expect(store.getState()).to.deep.equal({
          errorMessage: 'err',
          instanceId: '',
          isCollapsed: false,
          namespace: '',
          title: '',
          isConnected: false,
          isAtlas: false,
          uiStatus: UI_STATES.ERROR,
          authentication: 'NONE',
          ssl: 'NONE',
          sshTunnel: 'NONE',
          isDataLake: false
        });
        global.hadronApp.appRegistry.emit('data-service-disconnected');
      });
      // This doesn't reset on error state. Not sure if intended, given this commit: https://github.com/10gen/compass/commit/a679eec29e0416ab9e721b1658d97786318d7da9
      // it('resets to initial state', () => {
      //   console.log(emitSpy.args);
      //   expect(store.getState()).to.deep.equal(initialState);
      // });
    });
    context('on database-changed', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        global.hadronApp.appRegistry.emit('database-selected', 'test.coll');
      });
      it('dispatches the change namespace action', () => {
        expect(store.getState().namespace).to.equal('test.coll');
      });
      it('dispatches the changetitle action', () => {
        expect(store.getState().title).to.equal(' - /test.coll');
      });
    });
  });
});
