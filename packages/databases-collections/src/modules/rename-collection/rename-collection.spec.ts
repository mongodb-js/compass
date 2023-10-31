import { expect } from 'chai';
import type { RenameCollectionRootState } from './rename-collection';
import { open, renameCollection } from './rename-collection';
import { reset } from '../reset';
import * as sinon from 'sinon';
import * as compassComponents from '@mongodb-js/compass-components';
import { toggleIsRunning } from '../is-running';
import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './rename-collection';
import { dataServiceConnected } from '../data-service';
import type { DataService } from 'mongodb-data-service';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';

describe('rename collection module', function () {
  let store;
  beforeEach(() => {
    store = legacy_createStore(rootReducer, applyMiddleware(thunk));
  });
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is reset', function () {
        it('returns the reset state', function () {
          store.dispatch(reset());
          expect(store.getState()).to.contain({
            isRunning: false,
            isVisible: false,
            error: null,
            databaseName: '',
            initialCollectionName: '',
          });
        });
      });

      context('when the action is open', function () {
        it('returns the reset state', function () {
          store.dispatch(open('database-name', 'collection-name'));
          expect(store.getState()).to.contain({
            isRunning: false,
            isVisible: true,
            error: null,
            databaseName: 'database-name',
            initialCollectionName: 'collection-name',
          });
        });
      });
    });
  });

  describe('#renameCollection', () => {
    const renameCollectionSpy = sinon.stub();
    const openToast = sinon.stub(compassComponents, 'openToast');
    let dispatch: ThunkDispatch<RenameCollectionRootState, void, AnyAction>;
    let getState: () => RenameCollectionRootState;
    beforeEach(() => {
      store.dispatch(
        dataServiceConnected(null, {
          renameCollection: renameCollectionSpy,
        } as any as DataService)
      );
      dispatch = store.dispatch.bind(store);
      getState = store.getState.bind(store);
    });

    afterEach(() => sinon.restore());

    it('clears any existing errors', async () => {
      const creator = renameCollection('new-collection');
      await creator(dispatch, getState);
      expect(store.getState().error).to.be.null;
    });
    it('sets the state to "running"', async () => {
      const dispatchSpy = sinon.spy();
      const creator = renameCollection('new-collection');
      await creator(dispatchSpy, getState);
      expect(dispatchSpy).to.have.been.calledWith(toggleIsRunning(true));
    });
    it('renames the collection using the data service', async () => {
      const creator = renameCollection('new-collection');
      await creator(dispatch, getState);
      expect(renameCollectionSpy.called).to.be.true;
    });
    it('opens a success toast', async () => {
      const creator = renameCollection('new-collection', openToast);
      await creator(dispatch, getState);
      expect(openToast).to.have.been.called;
      const [id, options] = openToast.getCall(0).args;
      expect(id).to.equal('collection-rename-success');
      expect(options).to.deep.equal({
        variant: 'success',
        title: `Collection renamed to new-collection`,
        timeout: 5_000,
      });
    });

    context('when there is an error', () => {
      const error = new Error('something went wrong');
      beforeEach(() => {
        renameCollectionSpy.rejects(error);
      });

      it('sets the state to not running', async () => {
        const creator = renameCollection('new-collection');
        await creator(dispatch, getState);
        expect(store.getState().isRunning).to.be.false;
      });

      it('reports an error', async () => {
        const creator = renameCollection('new-collection');
        await creator(dispatch, getState);
        expect(store.getState().error).to.equal(error);
      });
    });
  });
});
