import { expect } from 'chai';
import path from 'path';
import { onStarted, openImport, selectImportFileName } from './import';
import type { ImportStore } from '../stores/import-store';
import { ImportPlugin } from '../index';
import { createPluginTestHelpers } from '@mongodb-js/testing-library-compass';

const { activatePluginWithConnections } = createPluginTestHelpers(ImportPlugin);

function activatePlugin(
  dataService = {
    findCursor() {},
    aggregateCursor() {},
  } as any
) {
  return activatePluginWithConnections(undefined, {
    connectFn() {
      return dataService;
    },
  });
}

describe('import [module]', function () {
  let mockStore: ImportStore;

  beforeEach(function () {
    mockStore = activatePlugin().plugin.store;
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
          connectionId: 'TEST',
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
          connectionId: 'TEST',
        }) as any
      );

      expect(mockStore.getState().import.namespace).to.equal(testNS);
      expect(mockStore.getState().import.connectionId).to.equal('TEST');
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
      expect(mockStore.getState().import.firstErrors.length).to.equal(0);

      await mockStore.dispatch(selectImportFileName(noExistFile) as any);

      expect(mockStore.getState().import.fileName).to.equal('');

      expect(mockStore.getState().import.firstErrors.length).to.equal(1);
    });
  });
});
