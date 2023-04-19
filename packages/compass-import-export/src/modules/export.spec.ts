import { expect } from 'chai';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';

import {
  openExport,
  initialState,
  rootExportReducer,
  addFieldToExport,
  toggleExportAllSelectedFields,
  toggleFieldToExport,
  selectFieldsToExport,
} from './export';
import type { RootState } from './export';

type DispatchFunctionType = ThunkDispatch<RootState, void, AnyAction>;

const mockEmptyState = {
  export: {
    ...initialState,
  },
};

describe('export [module]', function () {
  // This is re-created in the `beforeEach`, it's useful for typing to have it here as well.
  let mockStore = createStore(
    rootExportReducer,
    mockEmptyState,
    applyMiddleware<DispatchFunctionType, RootState>(thunk)
  );
  beforeEach(function () {
    const mockState = {
      export: {
        ...initialState,
      },
    };
    mockStore = createStore(
      rootExportReducer,
      mockState,
      applyMiddleware<DispatchFunctionType, RootState>(thunk)
    );
  });

  describe('#openExport', function () {
    it('sets isInProgressMessageOpen to true when export is in progress and does not open', function () {
      // TODO(COMPASS-6580)
    });

    it('opens and sets the namespace', function () {
      const testNS = 'test.123';
      expect(mockStore.getState().export.status).to.equal(undefined);
      expect(mockStore.getState().export.namespace).to.not.equal(testNS);
      expect(mockStore.getState().export.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().export.isOpen).to.equal(false);
      expect(mockStore.getState().export.exportFullCollection).to.equal(
        undefined
      );

      mockStore.dispatch(
        openExport({
          namespace: 'test.123',
          query: {
            filter: {},
          },
          exportFullCollection: true,
        })
      );

      expect(mockStore.getState().export.namespace).to.equal(testNS);
      expect(mockStore.getState().export.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().export.isOpen).to.equal(true);
      expect(mockStore.getState().export.exportFullCollection).to.equal(true);
    });
  });

  describe('#addFieldToExport', function () {
    it('adds the field to the fields to export', function () {
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({});

      mockStore.dispatch(addFieldToExport(['one', 'two']));

      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
      });
    });
  });

  describe('#toggleFieldToExport', function () {
    it('toggles the field to export', function () {
      mockStore.dispatch(addFieldToExport(['five']));
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      mockStore.dispatch(toggleFieldToExport('["five"]'));
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: false,
        },
      });
      mockStore.dispatch(toggleFieldToExport('["five"]'));
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });
    });
  });

  describe('#toggleExportAllSelectedFields', function () {
    it('toggles all of the fields', function () {
      mockStore.dispatch(addFieldToExport(['one']));
      mockStore.dispatch(toggleFieldToExport('["one"]'));
      mockStore.dispatch(addFieldToExport(['one', 'two']));
      mockStore.dispatch(addFieldToExport(['five']));

      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: false,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      mockStore.dispatch(toggleExportAllSelectedFields());
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: true,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      mockStore.dispatch(toggleExportAllSelectedFields());
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: false,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: false,
        },
        '["five"]': {
          path: ['five'],
          selected: false,
        },
      });

      mockStore.dispatch(toggleExportAllSelectedFields());
      expect(mockStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: true,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });
    });
  });

  describe('#selectFieldsToExport', function () {
    it('sets errors on the store', async function () {
      expect(mockStore.getState().export.errorLoadingFieldsToExport).to.equal(
        undefined
      );

      await mockStore.dispatch(selectFieldsToExport());

      expect(
        mockStore.getState().export.errorLoadingFieldsToExport
      ).to.not.equal(undefined);
    });
  });

  // TODO:
  // - runExport tests
  // - closeExport tests
});
