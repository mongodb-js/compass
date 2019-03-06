import store from 'stores';
import { reset } from 'modules/reset';
import AppRegistry from 'hadron-app-registry';
import { changeInstanceId } from 'modules/instance-id';

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
      uiStatus: 'INITIAL'
    };
    beforeEach(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      store.onActivated(global.hadronApp.appRegistry);
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
        expect(store.getState().uiStatus).to.equal('ERROR');
      });
    });
    context('on instance refresh without error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        store.dispatch(changeInstanceId('test'));
        global.hadronApp.appRegistry.emit('instance-refreshed', {
          errorMessage: ''
        });
      });
      it('dispatches the change error action', () => {
        expect(store.getState().errorMessage).to.equal('');
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal('COMPLETE');
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
        }, {});
      });
      it('dispatches the change error action', () => {
        expect(store.getState().errorMessage).to.equal('err');
      });
      it('dispatches the change ui status action', () => {
        expect(store.getState().uiStatus).to.equal('ERROR');
      });
    });
    context('on data-service-connected without error', () => {
      beforeEach(() => {
        expect(store.getState()).to.deep.equal(initialState);
        global.hadronApp.appRegistry.emit('data-service-connected', null, {
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
        expect(store.getState().uiStatus).to.equal('LOADING');
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
  });
});
