import { expect } from 'chai';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import path from 'path';

import {
  onStarted,
  openImport,
  selectImportFileType,
  selectImportFileName,
  INITIAL_STATE,
} from './import';
import rootReducer from '.';
import type { RootImportState } from '../stores/import-store';
import {} from './import';

type DispatchFunctionType = ThunkDispatch<RootImportState, void, AnyAction>;

const mockEmptyState = {
  importData: {
    ...INITIAL_STATE,
  },
};

describe('import [module]', function () {
  // This is re-created in the `beforeEach`, it's useful for typing to have it here as well.
  let mockStore = createStore(
    rootReducer,
    mockEmptyState,
    applyMiddleware<DispatchFunctionType, RootImportState>(thunk)
  );
  beforeEach(function () {
    const mockState = {
      importData: {
        ...INITIAL_STATE,
      },
    };
    mockStore = createStore(
      rootReducer,
      mockState,
      applyMiddleware<DispatchFunctionType, RootImportState>(thunk)
    );
  });

  describe('#openImport', function () {
    it('sets isInProgressMessageOpen to true when import is in progress and does not open', function () {
      const abortController = new AbortController();
      mockStore.dispatch(onStarted(abortController));

      expect(mockStore.getState().importData.status).to.equal('STARTED');
      expect(mockStore.getState().importData.isInProgressMessageOpen).to.equal(
        false
      );

      mockStore.dispatch(openImport('test.test'));

      expect(mockStore.getState().importData.isInProgressMessageOpen).to.equal(
        true
      );
      expect(mockStore.getState().importData.isOpen).to.equal(false);
    });

    it('opens and sets the namespace', function () {
      const testNS = 'test.test';
      expect(mockStore.getState().importData.status).to.equal('UNSPECIFIED');
      expect(mockStore.getState().ns).to.not.equal(testNS);
      expect(mockStore.getState().importData.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().importData.isOpen).to.equal(false);

      mockStore.dispatch(openImport('test.test'));

      expect(mockStore.getState().ns).to.equal(testNS);
      expect(mockStore.getState().importData.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().importData.isOpen).to.equal(true);
    });
  });

  describe('#selectImportFileType', function () {
    it('should update fileType to csv', async function () {
      // changing file type uses fileName from the state, so set it first
      expect(mockStore.getState().importData.fileName).to.equal('');
      const fileName = path.join(
        __dirname,
        '..',
        '..',
        'test',
        'json',
        'good.json'
      );
      await mockStore.dispatch(selectImportFileName(fileName));

      expect(mockStore.getState().importData.fileType).to.be.deep.equal('json');

      mockStore.dispatch(selectImportFileType('csv'));

      expect(mockStore.getState().importData.fileType).to.be.deep.equal('csv');
    });

    it('should update fileType to json', function () {
      expect(mockStore.getState().importData.fileType).to.be.deep.equal('');

      mockStore.dispatch(selectImportFileType('json'));

      expect(mockStore.getState().importData.fileType).to.be.deep.equal('json');
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

      expect(mockStore.getState().importData.fileName).to.equal('');

      await mockStore.dispatch(selectImportFileName(fileName));

      expect(mockStore.getState().importData.fileName).to.equal(fileName);
    });

    it('adds an error when the file does not exist', async function () {
      const noExistFile = path.join(__dirname, 'no-exist.json');

      expect(mockStore.getState().importData.fileName).to.equal('');

      await mockStore.dispatch(selectImportFileName(noExistFile));

      expect(mockStore.getState().importData.fileName).to.equal('');

      expect(mockStore.getState().importData.errors.length).to.equal(1);
      expect(mockStore.getState().importData.status).to.equal('FAILED');
    });
  });
});
