import AppRegistry from 'hadron-app-registry';
import configureStore from 'stores/create-view';

describe('CreateViewStore [Store]', () => {
  let store;
  const appRegistry = new AppRegistry();
  const ds = 'data-service';

  beforeEach(() => {
    store = configureStore({
      localAppRegistry: appRegistry,
      dataProvider: {
        error: null,
        dataProvider: ds
      }
    });
  });

  afterEach(() => {
    store = null;
  });

  describe('#configureStore', () => {
    it('dispatches the data service connected action', () => {
      expect(store.getState().dataService.dataService).to.equal(ds);
    });

    describe('when open create view is emitted', () => {
      beforeEach(() => {
        appRegistry.emit('open-create-view', {source: 'dataService.test', pipeline: [
          { $project: { a: 1 } }
        ]});
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
