import { expect } from 'chai';
import path from 'path';
import { onStarted, openImport, selectImportFileName } from './import';
import { configureStore } from '../stores/import-store';

const mockServices = {
  globalAppRegistry: {},
  dataService: {},
} as any;

describe('import [module]', function () {
  // This is re-created in the `beforeEach`, it's useful for typing to have it here as well.
  let mockStore = configureStore(mockServices);
  beforeEach(function () {
    mockStore = configureStore(mockServices);
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
        }) as any
      );

      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        true
      );
      expect(mockStore.getState().import.isOpen).to.equal(false);
    });

    it('opens and sets the namespace', function () {
      const testNS = 'test.test';
      expect(mockStore.getState().import.status).to.equal('UNSPECIFIED');
      expect(mockStore.getState().import.namespace).to.not.equal(testNS);
      expect(mockStore.getState().import.isInProgressMessageOpen).to.equal(
        false
      );
      expect(mockStore.getState().import.isOpen).to.equal(false);

      mockStore.dispatch(
        openImport({
          namespace: 'test.test',
          origin: 'menu',
        }) as any
      );

      expect(mockStore.getState().import.namespace).to.equal(testNS);
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

      await mockStore.dispatch(selectImportFileName(fileName) as any);

      expect(mockStore.getState().import.fileName).to.equal(fileName);
    });

    it('adds an error when the file does not exist', async function () {
      const noExistFile = path.join(__dirname, 'no-exist.json');

      expect(mockStore.getState().import.fileName).to.equal('');
      expect(mockStore.getState().import.errors.length).to.equal(0);

      await mockStore.dispatch(selectImportFileName(noExistFile) as any);

      expect(mockStore.getState().import.fileName).to.equal('');

      expect(mockStore.getState().import.errors.length).to.equal(1);
    });
  });
});
