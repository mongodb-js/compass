import { expect } from 'chai';
import sinon from 'sinon';
import type { IndexesStore } from '../stores/store';
import { setupStore } from '../../test/setup-store';
import reducer, {
  INITIAL_STATE,
  OPEN_INDEXES_LIST_DRAWER_VIEW,
  OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
  SET_IS_DIRTY,
  SET_EXPANDED_ROWS,
  SET_REGULAR_INDEXES_ACCORDION_OPEN,
  openIndexesListDrawerView,
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  setIsDirty,
  setExpandedRows,
  setRegularIndexesAccordionOpen,
} from './indexes-drawer';
import { ActionTypes as SearchIndexesActionTypes } from './search-indexes';

// Importing this to stub showConfirmation
import * as indexesDrawerSlice from './indexes-drawer';

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
          expandedRowIndexNames: [],
        });

        expect(state.currentView).to.equal('indexes-list');
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'create-search-index' as const,
          currentIndexType: 'search' as const,
          currentIndexName: 'test-index',
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: false,
          isDirty: false,
        };

        const state = reducer(previousState, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: [],
        });

        expect(state.currentView).to.equal('indexes-list');
        expect(state.currentIndexType).to.equal('search');
        expect(state.currentIndexName).to.equal('test-index');
        expect(state.isDirty).to.equal(false);
        expect(state.isRegularIndexesAccordionOpen).to.equal(true);
      });

      it('sets expandedRowIndexNames from the action', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: ['myIndex'],
        });

        expect(state.expandedRowIndexNames).to.deep.equal(['myIndex']);
      });

      it('sets expandedRowIndexNames to empty when none provided', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: [],
        });

        expect(state.expandedRowIndexNames).to.deep.equal([]);
      });

      it('replaces expandedRowIndexNames on each dispatch', function () {
        const state1 = reducer(INITIAL_STATE, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: ['indexA'],
        });
        expect(state1.expandedRowIndexNames).to.deep.equal(['indexA']);

        const state2 = reducer(state1, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: ['indexB'],
        });
        expect(state2.expandedRowIndexNames).to.deep.equal(['indexB']);
      });

      it('closes regular indexes accordion when expandedRowIndexNames has entries', function () {
        const state = reducer(INITIAL_STATE, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: ['myIndex'],
        });

        expect(state.isRegularIndexesAccordionOpen).to.equal(false);
      });

      it('opens regular indexes accordion when expandedRowIndexNames is empty', function () {
        const previousState = {
          ...INITIAL_STATE,
          isRegularIndexesAccordionOpen: false,
        };

        const state = reducer(previousState, {
          type: OPEN_INDEXES_LIST_DRAWER_VIEW,
          expandedRowIndexNames: [],
        });

        expect(state.isRegularIndexesAccordionOpen).to.equal(true);
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
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: true,
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

    describe('SET_EXPANDED_ROWS', function () {
      it('sets expanded row index names', function () {
        const state = reducer(INITIAL_STATE, {
          type: SET_EXPANDED_ROWS,
          expandedRowIndexNames: ['myIndex'],
        });

        expect(state.expandedRowIndexNames).to.deep.equal(['myIndex']);
      });

      it('replaces expanded row index names entirely', function () {
        const previousState = {
          ...INITIAL_STATE,
          expandedRowIndexNames: ['indexA'],
        };

        const state = reducer(previousState, {
          type: SET_EXPANDED_ROWS,
          expandedRowIndexNames: ['indexB'],
        });

        expect(state.expandedRowIndexNames).to.deep.equal(['indexB']);
      });
    });

    describe('SET_REGULAR_INDEXES_ACCORDION_OPEN', function () {
      it('sets isRegularIndexesAccordionOpen to true', function () {
        const previousState = {
          ...INITIAL_STATE,
          isRegularIndexesAccordionOpen: false,
        };

        const state = reducer(previousState, {
          type: SET_REGULAR_INDEXES_ACCORDION_OPEN,
          isOpen: true,
        });

        expect(state.isRegularIndexesAccordionOpen).to.equal(true);
      });

      it('sets isRegularIndexesAccordionOpen to false', function () {
        const state = reducer(INITIAL_STATE, {
          type: SET_REGULAR_INDEXES_ACCORDION_OPEN,
          isOpen: false,
        });

        expect(state.isRegularIndexesAccordionOpen).to.equal(false);
      });

      it('does not affect expandedRowIndexNames', function () {
        const previousState = {
          ...INITIAL_STATE,
          expandedRowIndexNames: ['myIndex'],
        };

        const state = reducer(previousState, {
          type: SET_REGULAR_INDEXES_ACCORDION_OPEN,
          isOpen: false,
        });

        expect(state.expandedRowIndexNames).to.deep.equal(['myIndex']);
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
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: true,
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
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: true,
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

    describe('CreateSearchIndexSucceeded', function () {
      it('resets isDirty to false when search index is successfully created', function () {
        const previousState = {
          ...INITIAL_STATE,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.CreateSearchIndexSucceeded,
        });

        expect(state.isDirty).to.equal(false);
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'create-search-index' as const,
          currentIndexType: 'vectorSearch' as const,
          currentIndexName: 'test-index',
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: true,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.CreateSearchIndexSucceeded,
        });

        expect(state.isDirty).to.equal(false);
        expect(state.currentView).to.equal('create-search-index');
        expect(state.currentIndexType).to.equal('vectorSearch');
        expect(state.currentIndexName).to.equal('test-index');
      });
    });

    describe('UpdateSearchIndexSucceeded', function () {
      it('resets isDirty to false when search index is successfully updated', function () {
        const previousState = {
          ...INITIAL_STATE,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.UpdateSearchIndexSucceeded,
        });

        expect(state.isDirty).to.equal(false);
      });

      it('preserves other state properties', function () {
        const previousState = {
          currentView: 'edit-search-index' as const,
          currentIndexType: 'search' as const,
          currentIndexName: 'my-index',
          expandedRowIndexNames: [],
          isRegularIndexesAccordionOpen: true,
          isDirty: true,
        };

        const state = reducer(previousState, {
          type: SearchIndexesActionTypes.UpdateSearchIndexSucceeded,
        });

        expect(state.isDirty).to.equal(false);
        expect(state.currentView).to.equal('edit-search-index');
        expect(state.currentIndexType).to.equal('search');
        expect(state.currentIndexName).to.equal('my-index');
      });
    });
  });

  describe('action creators', function () {
    let showConfirmationStub: sinon.SinonStub;

    beforeEach(function () {
      showConfirmationStub = sinon.stub(indexesDrawerSlice, 'showConfirmation');
    });

    afterEach(function () {
      showConfirmationStub.restore();
    });

    describe('openIndexesListDrawerView', function () {
      it('dispatches OPEN_INDEXES_LIST_DRAWER_VIEW action', async function () {
        await store.dispatch(openIndexesListDrawerView());

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'indexes-list'
        );
      });

      it('sets expandedRowIndexNames with focused index when it exists in search indexes', async function () {
        Object.assign(store.getState(), {
          searchIndexes: {
            ...store.getState().searchIndexes,
            indexes: [{ name: 'mySearchIndex' }],
          },
        });

        await store.dispatch(openIndexesListDrawerView('mySearchIndex'));

        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal(['mySearchIndex']);
      });

      it('sets expandedRowIndexNames to empty when focused index does not exist in search indexes', async function () {
        await store.dispatch(openIndexesListDrawerView('nonexistent'));

        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal([]);
      });

      it('sets expandedRowIndexNames to empty when no focused index is provided', async function () {
        await store.dispatch(openIndexesListDrawerView());

        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal([]);
      });

      it('replaces expandedRowIndexNames on each dispatch', async function () {
        Object.assign(store.getState(), {
          searchIndexes: {
            ...store.getState().searchIndexes,
            indexes: [{ name: 'indexA' }, { name: 'indexB' }],
          },
        });

        await store.dispatch(openIndexesListDrawerView('indexA'));
        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal(['indexA']);

        await store.dispatch(openIndexesListDrawerView('indexB'));
        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal(['indexB']);
      });

      it('shows confirmation dialog when isDirty is true and dispatches action when confirmed', async function () {
        // Stub showConfirmation to return true (user confirms)
        showConfirmationStub.resolves(true);

        // Set initial view to something other than indexes-list (without isDirty)
        await store.dispatch(openCreateSearchIndexDrawerView('search'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open indexes list view
        await store.dispatch(openIndexesListDrawerView());

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;
        expect(showConfirmationStub.firstCall.args[0]).to.deep.equal({
          title: 'Any unsaved progress will be lost',
          buttonText: 'Discard',
          variant: 'danger',
          description: 'Are you sure you want to continue?',
        });

        // Action should have been dispatched
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'indexes-list'
        );
      });

      it('shows confirmation dialog when isDirty is true and does not dispatch action when cancelled', async function () {
        // Stub showConfirmation to return false (user cancels)
        showConfirmationStub.resolves(false);

        // Set initial view to something other than indexes-list (without isDirty)
        await store.dispatch(openCreateSearchIndexDrawerView('search'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open indexes list view
        await store.dispatch(openIndexesListDrawerView());

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;

        // Action should NOT have been dispatched - view should remain unchanged
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
      });
    });

    describe('openCreateSearchIndexDrawerView', function () {
      it('dispatches OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW action with search type', async function () {
        await store.dispatch(openCreateSearchIndexDrawerView('search'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexType).to.equal(
          'search'
        );
      });

      it('dispatches OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW action with vectorSearch type', async function () {
        await store.dispatch(openCreateSearchIndexDrawerView('vectorSearch'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexType).to.equal(
          'vectorSearch'
        );
      });

      it('shows confirmation dialog when isDirty is true and dispatches action when confirmed', async function () {
        // Stub showConfirmation to return true (user confirms)
        showConfirmationStub.resolves(true);

        // Set initial view to edit (without isDirty)
        await store.dispatch(openEditSearchIndexDrawerView('test-index'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open create view
        await store.dispatch(openCreateSearchIndexDrawerView('vectorSearch'));

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;

        // Action should have been dispatched
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexType).to.equal(
          'vectorSearch'
        );
      });

      it('shows confirmation dialog when isDirty is true and does not dispatch action when cancelled', async function () {
        // Stub showConfirmation to return false (user cancels)
        showConfirmationStub.resolves(false);

        // Set initial view to edit (without isDirty)
        await store.dispatch(openEditSearchIndexDrawerView('test-index'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open create view
        await store.dispatch(openCreateSearchIndexDrawerView('search'));

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;

        // Action should NOT have been dispatched - view should remain unchanged
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );
      });
    });

    describe('openEditSearchIndexDrawerView', function () {
      it('dispatches OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW action', async function () {
        await store.dispatch(openEditSearchIndexDrawerView('my-index'));

        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexName).to.equal(
          'my-index'
        );
      });

      it('shows confirmation dialog when isDirty is true and dispatches action when confirmed', async function () {
        // Stub showConfirmation to return true (user confirms)
        showConfirmationStub.resolves(true);

        // Set initial view to create (without isDirty)
        await store.dispatch(openCreateSearchIndexDrawerView('search'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open edit view
        await store.dispatch(openEditSearchIndexDrawerView('another-index'));

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;

        // Action should have been dispatched
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'edit-search-index'
        );
        expect(store.getState().indexesDrawer.currentIndexName).to.equal(
          'another-index'
        );
      });

      it('shows confirmation dialog when isDirty is true and does not dispatch action when cancelled', async function () {
        // Stub showConfirmation to return false (user cancels)
        showConfirmationStub.resolves(false);

        // Set initial view to create (without isDirty)
        await store.dispatch(openCreateSearchIndexDrawerView('search'));
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
        );

        // Now set isDirty to true
        store.dispatch(setIsDirty(true));
        expect(store.getState().indexesDrawer.isDirty).to.equal(true);

        // Try to open edit view
        await store.dispatch(openEditSearchIndexDrawerView('my-index'));

        // Confirmation should have been shown
        expect(showConfirmationStub.calledOnce).to.be.true;

        // Action should NOT have been dispatched - view should remain unchanged
        expect(store.getState().indexesDrawer.currentView).to.equal(
          'create-search-index'
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

    describe('setExpandedRows', function () {
      it('sets expanded row index names', function () {
        store.dispatch(setExpandedRows(['myIndex']));

        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal(['myIndex']);
      });

      it('replaces expanded row index names entirely', function () {
        store.dispatch(setExpandedRows(['indexA']));
        store.dispatch(setExpandedRows(['indexB']));

        expect(
          store.getState().indexesDrawer.expandedRowIndexNames
        ).to.deep.equal(['indexB']);
      });
    });

    describe('setRegularIndexesAccordionOpen', function () {
      it('sets accordion open state', function () {
        store.dispatch(setRegularIndexesAccordionOpen(false));

        expect(
          store.getState().indexesDrawer.isRegularIndexesAccordionOpen
        ).to.equal(false);

        store.dispatch(setRegularIndexesAccordionOpen(true));

        expect(
          store.getState().indexesDrawer.isRegularIndexesAccordionOpen
        ).to.equal(true);
      });
    });
  });
});
