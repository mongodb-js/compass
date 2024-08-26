import type AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import {
  activatePluginWithConnections,
  cleanup,
} from '@mongodb-js/compass-connections/test';
import { ExportPlugin } from '..';
import type { ExportStore } from './export-store';

describe('ExportStore [Store]', function () {
  let store: ExportStore;
  let globalAppRegistry: AppRegistry;

  beforeEach(function () {
    const result = activatePluginWithConnections(ExportPlugin, {});
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
});
