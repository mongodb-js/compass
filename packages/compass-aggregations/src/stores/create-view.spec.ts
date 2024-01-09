import AppRegistry from 'hadron-app-registry';
import { activateCreateViewPlugin } from './create-view';
import { expect } from 'chai';

describe('CreateViewStore [Store]', function () {
  if (
    typeof window !== 'undefined' &&
    (window?.process as any)?.type === 'renderer'
  ) {
    // These tests don't pass in electron environment in Evergreen CI for some
    // reason, disable for now
    return;
  }

  let store: any;
  let deactivate: any;
  const globalAppRegistry = new AppRegistry();
  const ds = 'data-service' as any;
  const logger = {} as any;

  beforeEach(function () {
    ({ store, deactivate } = activateCreateViewPlugin(
      {},
      {
        globalAppRegistry,
        dataService: ds,
        logger,
        workspaces: {} as any,
      }
    ));
  });

  afterEach(function () {
    store = null;
    deactivate();
  });

  describe('#configureStore', function () {
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
