import { expect } from 'chai';
import type { IndexesStore } from '../stores/store';
import { setupStore } from '../../test/setup-store';
import reducer, {
  INITIAL_STATE,
  OPEN_INDEXES_LIST_DRAWER_VIEW,
  OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
  SET_IS_DIRTY,
  openIndexesListDrawerView,
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  setIsDirty,
} from './indexes-drawer';
import { ActionTypes as SearchIndexesActionTypes } from './search-indexes';

describe('indexes-drawer module', function () {
  let store: IndexesStore;

  beforeEach(function () {
    store = setupStore({}, {});
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
          isDirty: false,
        };

        const state = reducer(previousState, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
        });

        expect(state.currentView).to.equal('indexes-list');
        expect(state.currentIndexType).to.equal('search');
        expect(state.currentIndexName).to.equal('test-index');
        expect(state.isDirty).to.equal(false);
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

    describe('SET_IS_EDITING', function () {
      it('sets isDirty to true', function () {
        const state = reducer(INITIAL_STATE, {
          type: SET_IS_DIRTY,
          isDirty: true,
        });

        expect(state.isDirty).to.equal(true);
      });

      it('sets isDirty to false', function () {
        const previousState = {
          ...INITIAL_STATE,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SET_IS_DIRTY,
          isDirty: false,
        });

        expect(state.isDirty).to.equal(false);
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'edit-search-index' as const,
          currentIndexType: 'vectorSearch' as const,
          currentIndexName: 'test-index',
          isDirty: false,
        };

        const state = reducer(previousState, {
          type: SET_IS_DIRTY,
          isDirty: true,
        });

        expect(state.isDirty).to.equal(true);
        expect(state.currentView).to.equal('edit-search-index');
        expect(state.currentIndexType).to.equal('vectorSearch');
        expect(state.currentIndexName).to.equal('test-index');
      });
    });

    describe('CreateSearchIndexClosed', function () {
      it('resets isDirty to false', function () {
        const previousState = {
          ...INITIAL_STATE,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.CreateSearchIndexClosed,
        });

        expect(state.isDirty).to.equal(false);
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'create-search-index' as const,
          currentIndexType: 'vectorSearch' as const,
          currentIndexName: 'test-index',
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.CreateSearchIndexClosed,
        });

        expect(state.isDirty).to.equal(false);
        expect(state.currentView).to.equal('create-search-index');
        expect(state.currentIndexType).to.equal('vectorSearch');
        expect(state.currentIndexName).to.equal('test-index');
      });
    });

    describe('UpdateSearchIndexClosed', function () {
      it('resets isDirty to false', function () {
        const previousState = {
          ...INITIAL_STATE,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.UpdateSearchIndexClosed,
        });

        expect(state.isDirty).to.equal(false);
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'edit-search-index' as const,
          currentIndexType: 'search' as const,
          currentIndexName: 'my-index',
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.UpdateSearchIndexClosed,
        });

        expect(state.isDirty).to.equal(false);
        expect(state.currentView).to.equal('edit-search-index');
        expect(state.currentIndexType).to.equal('search');
        expect(state.currentIndexName).to.equal('my-index');
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
    });

    describe('setIsDirty', function () {
      it('dispatches SET_IS_DIRTY action with true', function () {
        store.dispatch(setIsDirty(true));

        expect(store.getState().indexesDrawer.isDirty).to.equal(true);
      });

      it('dispatches SET_IS_DIRTY action with false', function () {
        store.dispatch(setIsDirty(true));
        store.dispatch(setIsDirty(false));

        expect(store.getState().indexesDrawer.isDirty).to.equal(false);
      });
    });
  });
});
