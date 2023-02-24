import { expect } from 'chai';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import path from 'path';

import {
  selectImportFileType,
  selectImportFileName,
  INITIAL_STATE,
  OPEN,
} from './import';
import rootReducer from '.';
import type { RootImportState } from '../stores/import-store';

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

  describe('#selectImportFileType', function () {
    it('should update fileType to csv', function () {
      expect(mockStore.getState().importData.fileType).to.be.deep.equal('');

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

    it('opens the modal when isInitialFileInputOpen is true', async function () {
      const fileName = path.join(
        __dirname,
        '..',
        '..',
        'test',
        'json',
        'good.json'
      );

      mockStore.dispatch({
        type: OPEN,
      });

      expect(mockStore.getState().importData.isInitialFileInputOpen).to.equal(
        true
      );
      expect(mockStore.getState().importData.isOpen).to.equal(false);

      await mockStore.dispatch(selectImportFileName(fileName));

      expect(mockStore.getState().importData.isInitialFileInputOpen).to.equal(
        false
      );
      expect(mockStore.getState().importData.isOpen).to.equal(true);
    });

    it('does not open the modal when isInitialFileInputOpen is false', async function () {
      const fileName = path.join(
        __dirname,
        '..',
        '..',
        'test',
        'json',
        'good.json'
      );

      expect(mockStore.getState().importData.isInitialFileInputOpen).to.equal(
        false
      );

      await mockStore.dispatch(selectImportFileName(fileName));

      expect(mockStore.getState().importData.isOpen).to.equal(false);
      expect(mockStore.getState().importData.isInitialFileInputOpen).to.equal(
        false
      );
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
