import type AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import { changeViewName, createView } from '../modules/create-view';
import Sinon from 'sinon';
import {
  activatePluginWithConnections,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { CreateViewPlugin } from '../index';

const TEST_CONNECTION = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
};

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
  let appRegistry: Sinon.SinonSpiedInstance<AppRegistry>;

  const workspaces = {
    openCollectionWorkspace: Sinon.stub(),
  } as any;

  const dataService = {
    createView: Sinon.stub(),
  };

  beforeEach(async function () {
    const { plugin, globalAppRegistry, connectionsStore } =
      activatePluginWithConnections(
        CreateViewPlugin.withMockServices({ workspaces }) as any,
        {},
        {
          connections: [TEST_CONNECTION],
          connectFn() {
            return dataService;
          },
        }
      );

    await connectionsStore.actions.connect(TEST_CONNECTION);

    store = plugin.store;
    appRegistry = Sinon.spy(globalAppRegistry);
  });

  afterEach(function () {
    store = null;
    Sinon.restore();
    cleanup();
  });

  describe('#configureStore', function () {
    describe('when open create view is emitted', function () {
      it('throws an error when the action is emitted without connection meta', function () {
        expect(() => {
          appRegistry.emit('open-create-view', {
            source: 'dataService.test',
            pipeline: [{ $project: { a: 1 } }],
          });
        }).to.throw;
      });
      it('dispatches the open action and sets the correct state', function () {
        appRegistry.emit(
          'open-create-view',
          {
            source: 'dataService.test',
            pipeline: [{ $project: { a: 1 } }],
          },
          {
            connectionId: TEST_CONNECTION.id,
          }
        );
        expect(store.getState().isVisible).to.equal(true);
        expect(store.getState().pipeline).to.deep.equal([
          { $project: { a: 1 } },
        ]);
        expect(store.getState().source).to.equal('dataService.test');
        expect(store.getState().connectionId).to.equal(TEST_CONNECTION.id);
      });
    });

    it('handles createView action and notifies the rest of the app', async function () {
      appRegistry.emit(
        'open-create-view',
        {
          source: 'dataService.test',
          pipeline: [{ $project: { a: 1 } }],
        },
        {
          connectionId: TEST_CONNECTION.id,
        }
      );
      store.dispatch(changeViewName('TestView'));
      await store.dispatch(createView());

      expect(dataService.createView).to.be.calledWithExactly(
        'TestView',
        'dataService.test',
        [{ $project: { a: 1 } }],
        {}
      );

      expect(appRegistry.emit.lastCall).to.be.calledWithExactly(
        'view-created',
        'dataService.TestView',
        { connectionId: TEST_CONNECTION.id }
      );

      expect(workspaces.openCollectionWorkspace).to.be.calledWithExactly(
        TEST_CONNECTION.id,
        'dataService.TestView',
        { newTab: true }
      );
    });
  });
});
