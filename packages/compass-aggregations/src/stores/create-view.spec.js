import AppRegistry from 'hadron-app-registry';
import store from 'stores/create-view';
import { reset } from 'modules/create-view/reset';

describe('CreateViewStore [Store]', () => {
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

    describe('when the data service is connected', () => {
      const ds = 'data-service';

      beforeEach(() => {
        appRegistry.emit('data-service-connected', null, ds);
      });

      it('dispatches the data service connected action', () => {
        expect(store.getState().dataService.dataService).to.equal(ds);
      });
    });

    describe('when open create view is emitted', () => {
      beforeEach(() => {
        appRegistry.emit('open-create-view', 'dataService.test', [
          { $project: { a: 1 } }
        ]);
      });

      it('dispatches the toggle action', () => {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the pipeline', () => {
        expect(store.getState().pipeline).to.deep.equal([
          { $project: { a: 1 } }
        ]);
      });

      it('sets the source', () => {
        expect(store.getState().source).to.equal('dataService.test');
      });
    });
  });
});
