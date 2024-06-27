import { expect } from 'chai';
import path from 'path';
import { onStarted, openImport, selectImportFileName } from './import';
import {
  type ImportPluginServices,
  configureStore,
} from '../stores/import-store';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import {
  type ConnectionRepository,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import { AppRegistry } from 'hadron-app-registry';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';

const logger = createNoopLogger();
const track = createNoopTrack();

const mockServices = {
  globalAppRegistry: new AppRegistry(),
  logger,
  track,
  connectionsManager: new ConnectionsManager({ logger: logger.log.unbound }),
  workspaces: {} as WorkspacesService,
  connectionRepository: {
    getConnectionInfoById: () => ({ id: 'TEST' }),
  } as unknown as ConnectionRepository,
} as ImportPluginServices;

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
      expect(mockStore.getState().import.errors.length).to.equal(0);

      await mockStore.dispatch(selectImportFileName(noExistFile) as any);

      expect(mockStore.getState().import.fileName).to.equal('');

      expect(mockStore.getState().import.errors.length).to.equal(1);
    });
  });
});
