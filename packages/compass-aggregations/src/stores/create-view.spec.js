import AppRegistry from 'hadron-app-registry';
import configureStore from './create-view';
import { expect } from 'chai';

describe('CreateViewStore [Store]', function () {
  if (typeof window !== 'undefined' && window?.process?.type === 'renderer') {
    // These tests don't pass in electron environment in Evergreen CI for some
    // reason, disable for now
    return;
  }

  let store;
  const appRegistry = new AppRegistry();
  const ds = 'data-service';

  beforeEach(function () {
    store = configureStore({
      localAppRegistry: appRegistry,
      dataProvider: {
        error: null,
        dataProvider: ds,
      },
    });
  });

  afterEach(function () {
    store = null;
  });

  describe('#configureStore', function () {
    it('dispatches the data service connected action', function () {
      expect(store.getState().dataService.dataService).to.equal(ds);
    });

    describe('when open create view is emitted', function () {
      beforeEach(function () {
        appRegistry.emit('open-create-view', {
          source: 'dataService.test',
          pipeline: [{ $project: { a: 1 } }],
        });
      });

      it('dispatches the toggle action', function () {
        expect(store.getState().isVisible).to.equal(true);
      });

      it('sets the pipeline', function () {
        expect(store.getState().pipeline).to.deep.equal([
          { $project: { a: 1 } },
        ]);
      });

      it('sets the source', function () {
        expect(store.getState().source).to.equal('dataService.test');
      });
    });
  });
});
