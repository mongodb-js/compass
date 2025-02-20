import { expect } from 'chai';
import Sinon from 'sinon';
import type { RenameCollectionRootState } from './rename-collection';
import { renameCollection, renameRequestInProgress } from './rename-collection';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import type { RenameCollectionPluginServices } from '../../stores/rename-collection';
import { activateRenameCollectionPlugin } from '../../stores/rename-collection';

describe('rename collection module', function () {
  let store: ReturnType<typeof activateRenameCollectionPlugin>['store'];

  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  const connectionsService = {
    getDataServiceForConnection: sandbox.stub().returns(dataService),
  } as any;
  const instancesManager = {} as any;
  const favoriteQueries = {
    getStorage: () => ({
      loadAll: sandbox.stub().resolves([]),
    }),
  };
  const pipelineStorage = {
    loadAll: sandbox.stub().resolves([]),
  };

  const extraThunkArgs: RenameCollectionPluginServices = {
    globalAppRegistry: appRegistry,
    connections: connectionsService,
    instancesManager: instancesManager,
    queryStorage: favoriteQueries as any,
    pipelineStorage: pipelineStorage as any,
  };

  context('when the modal is visible', function () {
    beforeEach(function () {
      const plugin = activateRenameCollectionPlugin(
        {},
        {
          globalAppRegistry: appRegistry,
          connections: connectionsService,
          instancesManager: instancesManager,
          queryStorage: favoriteQueries as any,
          pipelineStorage: pipelineStorage as any,
        },
        createActivateHelpers()
      );
      store = plugin.store;
    });

    describe('#reducer', function () {
      context('RENAME_REQUEST_IN_PROGRESS', () => {
        it('marks the state as running', () => {
          store.dispatch(renameRequestInProgress());
          expect(store.getState().isRunning).to.be.true;
        });
        it('nulls out any existing errors', () => {
          store.dispatch(renameRequestInProgress());
          expect(store.getState().error).to.be.null;
        });
      });

      context('OPEN', () => {
        it('marks the state as running', () => {
          store.dispatch(renameRequestInProgress());
          expect(store.getState().isRunning).to.be.true;
        });
        it('nulls out any existing errors', () => {
          store.dispatch(renameRequestInProgress());
          expect(store.getState().error).to.be.null;
        });
      });
    });

    describe('#renameCollection', () => {
      let dispatch: ThunkDispatch<
        RenameCollectionRootState,
        RenameCollectionPluginServices,
        AnyAction
      >;
      let getState: () => RenameCollectionRootState;
      beforeEach(() => {
        dispatch = store.dispatch.bind(store);
        getState = store.getState.bind(store);
      });

      it('renames the collection', async () => {
        const creator = renameCollection('new-collection');
        await creator(dispatch, getState, extraThunkArgs);
        expect(dataService.renameCollection).to.have.been.called;
        // because we did not emit any event and directly called the action the
        // database in store is set to an empty string '' which is how the old
        // namespace will be just a '.' and connectionId will just be ''
        expect(appRegistry.emit).to.have.been.calledWithExactly(
          'collection-renamed',
          {
            to: '.new-collection',
            from: '.',
          },
          { connectionId: '' }
        );
      });

      context('when there is an error', () => {
        const error = new Error('something went wrong');
        beforeEach(() => {
          dataService.renameCollection.rejects(error);
        });

        it('sets the state to not running', async () => {
          const creator = renameCollection('new-collection');
          await creator(dispatch, getState, extraThunkArgs);
          expect(store.getState().isRunning).to.be.false;
        });

        it('reports an error', async () => {
          const creator = renameCollection('new-collection');
          await creator(dispatch, getState, extraThunkArgs);
          expect(store.getState().error).to.equal(error);
        });
      });
    });
  });
});
