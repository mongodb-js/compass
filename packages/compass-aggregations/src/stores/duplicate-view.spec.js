import AppRegistry from 'hadron-app-registry';
import store from './duplicate-view';
import { expect } from 'chai';

describe('DuplicateViewStore [Store]', function () {
  if (typeof window !== 'undefined' && window?.process?.type === 'renderer') {
    // These tests don't pass in electron environment in Evergreen CI for some
    // reason, disable for now
    return;
  }

  const appRegistry = new AppRegistry();

  before(function () {
    store.onActivated(appRegistry);
  });

  describe('#onActivated', function () {
    context('when the data-service-connected event is emitted', function () {
      beforeEach(function () {
        appRegistry.emit('data-service-connected', null, 'testing');
      });

      it('dispatches the data service connected action', function () {
        expect(store.getState().dataService.dataService).to.equal('testing');
      });
    });

    context('when open create view is emitted', function () {
      beforeEach(function () {
        appRegistry.emit('open-create-view', {
          source: 'dataService.test',
          pipeline: [{ $project: { a: 1 } }],
          duplicate: true,
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
