import AppRegistry from 'hadron-app-registry';
import store from 'stores/drop-index';
import { reset } from 'modules/reset';

describe('DropIndexStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();

    before(() => {
      store.onActivated(appRegistry);
    });
    context('when the data service is connected', () => {
      const ds = {'data-service': 1};
      beforeEach(() => {
        appRegistry.emit('data-service-connected', null, ds);
      });
      it('dispatches the data service connected action', () => {
        expect(store.getState().dataService).to.deep.equal({'data-service': 1});
      });
    });
    context('when the data service errors', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', {message: 'err'}, null);
      });
      it('dispatches the data service connected action', () => {
        expect(store.getState().error).to.equal('err');
      });
    });
  });
});
