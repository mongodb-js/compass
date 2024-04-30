import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { activateCreateViewPlugin } from './create-view';
import { expect } from 'chai';
import { ConnectionsManager } from '@mongodb-js/compass-connections/provider';

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
  const logger = {} as any;

  beforeEach(function () {
    ({ store, deactivate } = activateCreateViewPlugin(
      {},
      {
        globalAppRegistry,
        connectionsManager: new ConnectionsManager({ logger }),
        logger,
        workspaces: {} as any,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    store = null;
    deactivate();
  });

  describe('#configureStore', function () {
    describe('when open create view is emitted', function () {
      it('throws an error when the action is emitted without connection meta', function () {
        expect(() => {
          globalAppRegistry.emit('open-create-view', {
            source: 'dataService.test',
            pipeline: [{ $project: { a: 1 } }],
          });
        }).to.throw;
      });
      it('dispatches the open action and sets the correct state', function () {
        globalAppRegistry.emit(
          'open-create-view',
          {
            source: 'dataService.test',
            pipeline: [{ $project: { a: 1 } }],
          },
          {
            connectionId: 'TEST',
          }
        );
        expect(store.getState().isVisible).to.equal(true);
        expect(store.getState().pipeline).to.deep.equal([
          { $project: { a: 1 } },
        ]);
        expect(store.getState().source).to.equal('dataService.test');
        expect(store.getState().connectionId).to.equal('TEST');
      });
    });
  });
});
