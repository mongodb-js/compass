import { createActivateHelpers } from 'hadron-app-registry';
import AppRegistry from 'hadron-app-registry';
import { activatePlugin } from './import-store';
import { ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { expect } from 'chai';

describe('ImportStore [Store]', function () {
  let store: any;
  let deactivate: any;
  let globalAppRegistry: AppRegistry;
  let connectionsManager: ConnectionsManager;
  let workspaces: WorkspacesService;

  beforeEach(function () {
    const logger = createNoopLogger();
    globalAppRegistry = new AppRegistry();
    connectionsManager = new ConnectionsManager({
      logger: logger.log.unbound,
    });

    ({ store, deactivate } = activatePlugin(
      {},
      {
        globalAppRegistry,
        connectionsManager,
        logger,
        workspaces,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    deactivate();
  });

  it(`throws when 'open-import' is emitted without connection metadata`, function () {
    expect(() => {
      globalAppRegistry.emit('open-import', {
        namespace: 'test.coll',
        origin: 'menu',
      });
    }).to.throw;
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
