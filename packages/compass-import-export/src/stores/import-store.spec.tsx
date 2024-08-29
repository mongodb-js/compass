import type AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import {
  activatePluginWithConnections,
  cleanup,
} from '@mongodb-js/compass-connections/test';
import type { ImportStore } from './import-store';
import { ImportPlugin } from '..';

describe('ImportStore [Store]', function () {
  let store: ImportStore;
  let globalAppRegistry: AppRegistry;

  beforeEach(function () {
    const result = activatePluginWithConnections(ImportPlugin, {});
    globalAppRegistry = result.globalAppRegistry;
    store = result.plugin.store;
  });

  afterEach(function () {
    cleanup();
  });

  it(`throws when 'open-import' is emitted without connection metadata`, function () {
    expect(() => {
      globalAppRegistry.emit('open-import', {
        namespace: 'test.coll',
        origin: 'menu',
      });
    }).to.throw();
  });

  it('opens the import modal with properly set state', function () {
    globalAppRegistry.emit(
      'open-import',
      { namespace: 'test.coll', origin: 'menu' },
      { connectionId: 'TEST' }
    );
    expect(store.getState().import.connectionId).to.equal('TEST');
    expect(store.getState().import.namespace).to.equal('test.coll');
  });
});
