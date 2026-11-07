import { expect } from 'chai';
import { createPluginTestHelpers } from '@mongodb-js/testing-library-compass';
import type { ImportStore } from '../stores/import-store';
import { ImportPlugin } from '../index';
import { fixtures } from '../../test/fixtures';
import {
  createChangedOnDiskFile,
  createFile,
  readFixtureFile,
} from '../../test/files';
import { onStarted, openImport, selectImportFile } from './import';

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

  describe('#selectImportFile', function () {
    it('select the file', async function () {
      const file = await readFixtureFile(fixtures.json.good);

      expect(mockStore.getState().import.file).to.equal(null);

      await mockStore.dispatch(selectImportFile(file) as any);

      expect(mockStore.getState().import.file).to.equal(file);
      expect(mockStore.getState().import.fileType).to.equal('json');
      expect(mockStore.getState().import.firstErrors).to.deep.equal([]);
    });

    it('add an error when the file is not valid UTF-8', async function () {
      const file = createFile(
        [new Uint8Array([0x61, 0x2c, 0x62, 0x0a, 0xff, 0x2c, 0x63, 0x0a])],
        'latin1.csv'
      );

      await mockStore.dispatch(selectImportFile(file) as any);

      expect(mockStore.getState().import.file).to.equal(null);
      expect(mockStore.getState().import.firstErrors).to.have.length(1);
      expect(mockStore.getState().import.firstErrors[0].message).to.include(
        'Unable to load the file. Make sure the file is valid CSV or JSON.'
      );
    });

    it('add an error when the file changed on disk after it was selected', async function () {
      const file = createChangedOnDiskFile('changed.json');

      await mockStore.dispatch(selectImportFile(file) as any);

      expect(mockStore.getState().import.file).to.equal(null);
      expect(mockStore.getState().import.firstErrors).to.have.length(1);
      expect(mockStore.getState().import.firstErrors[0].message).to.include(
        'The file changed since it was selected. Select it again.'
      );
    });
  });
});
