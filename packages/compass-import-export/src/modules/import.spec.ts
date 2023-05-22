import { expect } from 'chai';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import path from 'path';

import {
  onStarted,
  openImport,
  selectImportFileName,
  INITIAL_STATE,
} from './import';
import { rootImportReducer } from './import';
import type { RootImportState } from '../stores/import-store';

type DispatchFunctionType = ThunkDispatch<RootImportState, void, AnyAction>;

const mockEmptyState = {
  import: {
    ...INITIAL_STATE,
  },
};

describe('import [module]', function () {
  // This is re-created in the `beforeEach`, it's useful for typing to have it here as well.
  let mockStore = createStore(
    rootImportReducer,
    mockEmptyState,
    applyMiddleware<DispatchFunctionType, RootImportState>(thunk)
  );
  beforeEach(function () {
    const mockState = {
      import: {
        ...INITIAL_STATE,
      },
    };
    mockStore = createStore(
      rootImportReducer,
      mockState,
      applyMiddleware<DispatchFunctionType, RootImportState>(thunk)
    );
  });

  describe('#openImport', function () {
    it('sets isInProgressMessageOpen to true when import is in progress and does not open', function () {
      const abortController = new AbortController();
      mockStore.dispatch(
        onStarted({
          abortController,
          errorLogFilePath: 'test',
        })
      );

      expect(mockStore.getState().import.status).to.equal('STARTED');
      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        false
      );

      mockStore.dispatch(
        openImport({
          namespace: 'test.test',
          origin: 'menu',
        })
      );

      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        true
      );
      expect(mockStore.getState().import.isOpen).to.equal(false);
    });

    it('opens and sets the namespace', function () {
      const testNS = 'test.test';
      expect(mockStore.getState().import.status).to.equal('UNSPECIFIED');
      expect(mockStore.getState().ns).to.not.equal(testNS);
      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().import.isOpen).to.equal(false);

      mockStore.dispatch(
        openImport({
          namespace: 'test.test',
          origin: 'menu',
        })
      );

      expect(mockStore.getState().ns).to.equal(testNS);
      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().import.isOpen).to.equal(true);
    });
  });

  describe('#selectImportFileName', function () {
    it('updates the file name', async function () {
      const fileName = path.join(
        __dirname,
        '..',
        '..',
        'test',
        'json',
        'good.json'
      );

      expect(mockStore.getState().import.fileName).to.equal('');

      await mockStore.dispatch(selectImportFileName(fileName));

      expect(mockStore.getState().import.fileName).to.equal(fileName);
    });

    it('adds an error when the file does not exist', async function () {
      const noExistFile = path.join(__dirname, 'no-exist.json');

      expect(mockStore.getState().import.fileName).to.equal('');
      expect(mockStore.getState().import.errors.length).to.equal(0);

      await mockStore.dispatch(selectImportFileName(noExistFile));

      expect(mockStore.getState().import.fileName).to.equal('');

      expect(mockStore.getState().import.errors.length).to.equal(1);
    });
  });
});
