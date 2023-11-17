import { expect } from 'chai';
import Sinon from 'sinon';
import type { RenameCollectionRootState } from './rename-collection';
import { renameCollection, renameRequestInProgress } from './rename-collection';
import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './rename-collection';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import AppRegistry from 'hadron-app-registry';
import type { RenameCollectionPluginServices } from '../../stores/rename-collection';
import { activateRenameCollectionPlugin } from '../../stores/rename-collection';
import type { ToastActions } from '@mongodb-js/compass-components';

describe('rename collection module', function () {
  let store;
  beforeEach(() => {
    store = legacy_createStore(
      rootReducer,

      applyMiddleware(thunk)
    );
  });

  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService = {
    renameCollection: sandbox.stub().resolves({}),
  };
  const toastService: ToastActions = {
    openToast: sandbox.spy(),
    closeToast: sandbox.spy(),
  };
  const extraThunkArgs: RenameCollectionPluginServices = {
    globalAppRegistry: appRegistry,
    toastService,
    dataService,
  };
  context('when the modal is visible', function () {
    beforeEach(function () {
      const plugin = activateRenameCollectionPlugin(
        {},
        {
          globalAppRegistry: appRegistry,
          dataService,
          toastService,
        }
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
        expect(dataService.renameCollection.called).to.be.true;
      });

      it('opens a success toast', async () => {
        const creator = renameCollection('new-collection');
        await creator(dispatch, getState, extraThunkArgs);
        expect(toastService.openToast).to.have.been.called;
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
