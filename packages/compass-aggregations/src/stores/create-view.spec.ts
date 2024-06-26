import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { activateCreateViewPlugin } from './create-view';
import { expect } from 'chai';
import {
  type ConnectionInfoAccess,
  ConnectionsManager,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { changeViewName, createView } from '../modules/create-view';
import Sinon from 'sinon';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';

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
  let globalAppRegistry: AppRegistry;
  let appRegistryEmitSpy: Sinon.SinonSpy;
  const logger = {} as any;
  const track = () => {};
  const connectionInfoAccess = {
    getCurrentConnectionInfo: () => ({ id: 'TEST' }),
  } as ConnectionInfoAccess;
  const createViewStub = Sinon.stub();
  const dataService = {
    createView: createViewStub,
  } as unknown as DataService;
  const connectionsManager = new ConnectionsManager({ logger });
  const openCollectionWorkspaceStub = Sinon.stub();
  const workspaces = {
    openCollectionWorkspace: openCollectionWorkspaceStub,
  } as unknown as WorkspacesService;

  beforeEach(function () {
    globalAppRegistry = new AppRegistry();
    appRegistryEmitSpy = Sinon.spy(globalAppRegistry, 'emit');
    Sinon.stub(connectionsManager, 'getDataServiceForConnection').returns(
      dataService
    );
    ({ store, deactivate } = activateCreateViewPlugin(
      {},
      {
        globalAppRegistry,
        connectionsManager,
        logger,
        track,
        connectionInfoAccess,
        workspaces,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    store = null;
    Sinon.restore();
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

    it('handles createView action and notifies the rest of the app', async function () {
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
      store.dispatch(changeViewName('TestView'));
      await store.dispatch(createView());

      expect(createViewStub).to.be.calledWithExactly(
        'TestView',
        'dataService.test',
        [{ $project: { a: 1 } }],
        {}
      );

      expect(appRegistryEmitSpy.lastCall).to.be.calledWithExactly(
        'view-created',
        'dataService.TestView',
        { connectionId: 'TEST' }
      );

      expect(openCollectionWorkspaceStub).to.be.calledWithExactly(
        'TEST',
        'dataService.TestView',
        { newTab: true }
      );
    });
  });
});
