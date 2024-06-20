import { createActivateHelpers } from 'hadron-app-registry';
import AppRegistry from 'hadron-app-registry';
import { activatePlugin } from './export-store';
import { ConnectionsManager } from '@mongodb-js/compass-connections/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { expect } from 'chai';
import { type PreferencesAccess } from 'compass-preferences-model/provider';

describe('ExportStore [Store]', function () {
  let store: any;
  let deactivate: any;
  let globalAppRegistry: AppRegistry;
  let connectionsManager: ConnectionsManager;
  const preferences = {} as PreferencesAccess;

  beforeEach(function () {
    const logger = createNoopLogger();
    const track = createNoopTrack();
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
        track,
        preferences,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    deactivate();
  });

  it(`throws when 'open-export' is emitted without connection metadata`, function () {
    expect(() => {
      globalAppRegistry.emit('open-export', {
        namespace: 'test.coll',
        origin: 'menu',
      });
    }).to.throw;
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
