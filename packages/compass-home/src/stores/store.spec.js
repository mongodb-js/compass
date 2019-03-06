import store from 'stores';
import { reset } from 'modules/reset';

describe('HomeStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    it('has initial state', () => {
      expect(store.getState()).to.deep.equal({
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
      });
    });
  });
});
