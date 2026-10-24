import type AppRegistry from '@mongodb-js/compass-app-registry';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { ExportPlugin } from '..';
import type { ExportStore } from './export-store';

const { activatePluginWithConnections } = createPluginTestHelpers(ExportPlugin);

describe('ExportStore [Store]', function () {
  let store: ExportStore;
  let globalAppRegistry: AppRegistry;

  beforeEach(function () {
    const result = activatePluginWithConnections();
    store = result.plugin.store;
    globalAppRegistry = result.globalAppRegistry;
  });

  afterEach(function () {
    cleanup();
  });

  it(`throws when 'open-export' is emitted without connection metadata`, function () {
    expect(() => {
      globalAppRegistry.emit('open-export', {
        namespace: 'test.coll',
        origin: 'menu',
      });
    }).to.throw();
  });

  it('opens the import modal with properly set state', function () {
    globalAppRegistry.emit(
      'open-export',
      { namespace: 'test.coll', origin: 'menu' },
      { connectionId: 'TEST' }
    );
    expect(store.getState().export.connectionId).to.equal('TEST');
    expect(store.getState().export.namespace).to.equal('test.coll');
  });

  it(`throws when 'open-export-collections' is emitted without connection metadata`, function () {
    expect(() => {
      globalAppRegistry.emit('open-export-collections', {
        databaseName: 'store',
        origin: 'sidebar',
      });
    }).to.throw();
  });

  it('opens the export collections modal for the database', function () {
    globalAppRegistry.emit(
      'open-export-collections',
      { databaseName: 'store', origin: 'sidebar' },
      { connectionId: 'TEST' }
    );
    const state = store.getState().exportCollections;
    expect(state.isOpen).to.equal(true);
    expect(state.connectionId).to.equal('TEST');
    expect(state.databaseName).to.equal('store');
  });
});
