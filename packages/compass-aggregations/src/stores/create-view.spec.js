import AppRegistry from 'hadron-app-registry';
import { activateCreateViewPlugin } from './create-view';
import { expect } from 'chai';

describe('CreateViewStore [Store]', function () {
  if (typeof window !== 'undefined' && window?.process?.type === 'renderer') {
    // These tests don't pass in electron environment in Evergreen CI for some
    // reason, disable for now
    return;
  }

  let store;
  let deactivate;
  const globalAppRegistry = new AppRegistry();
  const ds = 'data-service';

  beforeEach(function () {
    ({ store, deactivate } = activateCreateViewPlugin(
      {},
      { globalAppRegistry }
    ));
  });

  afterEach(function () {
    store = null;
    deactivate();
  });

  describe('#configureStore', function () {
    it('dispatches the data service connected action on data-service-connected event', function () {
      globalAppRegistry.emit('data-service-connected', null, ds);
      expect(store.getState().dataService.dataService).to.equal(ds);
    });

    describe('when open create view is emitted', function () {
      beforeEach(function () {
        globalAppRegistry.emit('open-create-view', {
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
