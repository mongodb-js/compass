import { expect } from 'chai';
import sinon from 'sinon';
import type { IndexesStore } from '../stores/store';
import { setupStore } from '../../test/setup-store';
import reducer, {
  INITIAL_STATE,
  OPEN_INDEXES_LIST_DRAWER_VIEW,
  OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
  openIndexesListDrawerView,
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
} from './indexes-drawer';

describe('indexes-drawer module', function () {
  let store: IndexesStore;
  let openDrawerSpy: sinon.SinonSpy;

  beforeEach(function () {
    openDrawerSpy = sinon.spy();
    store = setupStore(
      {},
      {},
      {
        drawerActions: {
          openDrawer: openDrawerSpy,
          closeDrawer: () => {},
        },
      }
    );
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('reducer', function () {
    it('returns the initial state', function () {
      expect(reducer(undefined, { type: 'UNKNOWN_ACTION' })).to.deep.equal(
        INITIAL_STATE
      );
    });

    describe('OPEN_INDEXES_LIST_DRAWER_VIEW', function () {
      it('sets currentView to indexes-list', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
        });

        expect(state.currentView).to.equal('indexes-list');
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'create-search-index' as const,
          currentIndexType: 'search' as const,
          currentIndexName: 'test-index',
        };

        const state = reducer(previousState, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
        });

        expect(state.currentView).to.equal('indexes-list');
        expect(state.currentIndexType).to.equal('search');
        expect(state.currentIndexName).to.equal('test-index');
      });
    });

    describe('OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW', function () {
      it('sets currentView to create-search-index and currentIndexType', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
          currentIndexType: 'search',
        });

        expect(state.currentView).to.equal('create-search-index');
        expect(state.currentIndexType).to.equal('search');
      });

      it('handles vectorSearch type', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
          currentIndexType: 'vectorSearch',
        });

        expect(state.currentView).to.equal('create-search-index');
        expect(state.currentIndexType).to.equal('vectorSearch');
      });
    });

    describe('OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW', function () {
      it('sets currentView to edit-search-index and currentIndexName', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
          currentIndexName: 'my-search-index',
        });

        expect(state.currentView).to.equal('edit-search-index');
        expect(state.currentIndexName).to.equal('my-search-index');
      });
    });
  });

  describe('action creators', function () {
    describe('openIndexesListDrawerView', function () {
      it('dispatches OPEN_INDEXES_LIST_DRAWER_VIEW action', function () {
        store.dispatch(openIndexesListDrawerView());

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'indexes-list'
        );
      });

      it('calls openDrawer with INDEXES_DRAWER_ID', function () {
        store.dispatch(openIndexesListDrawerView());

        expect(openDrawerSpy).to.have.been.calledOnceWithExactly(
          'compass-indexes-drawer'
        );
      });
    });

    describe('openCreateSearchIndexDrawerView', function () {
      it('dispatches OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW action with search type', function () {
        store.dispatch(openCreateSearchIndexDrawerView('search'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexType).to.equal(
          'search'
        );
      });

      it('dispatches OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW action with vectorSearch type', function () {
        store.dispatch(openCreateSearchIndexDrawerView('vectorSearch'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexType).to.equal(
          'vectorSearch'
        );
      });

      it('calls openDrawer with INDEXES_DRAWER_ID', function () {
        store.dispatch(openCreateSearchIndexDrawerView('search'));

        expect(openDrawerSpy).to.have.been.calledOnceWithExactly(
          'compass-indexes-drawer'
        );
      });
    });

    describe('openEditSearchIndexDrawerView', function () {
      it('dispatches OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW action', function () {
        store.dispatch(openEditSearchIndexDrawerView('my-index'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexName).to.equal(
          'my-index'
        );
      });

      it('calls openDrawer with INDEXES_DRAWER_ID', function () {
        store.dispatch(openEditSearchIndexDrawerView('my-index'));

        expect(openDrawerSpy).to.have.been.calledOnceWithExactly(
          'compass-indexes-drawer'
        );
      });
    });
  });
});
