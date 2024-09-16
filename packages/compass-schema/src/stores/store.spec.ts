import type { SchemaStore } from './store';
import { activateSchemaPlugin } from './store';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const dummyLogger = createNoopLogger('TEST');
const dummyTrack = createNoopTrack();

const mockFieldStoreService = {
  updateFieldsFromDocuments() {},
  updateFieldsFromSchema() {},
} as unknown as FieldStoreService;

const mockQueryBar = {
  getLastAppliedQuery() {
    return {};
  },
};

describe('Schema Store', function () {
  describe('#configureStore', function () {
    let store: SchemaStore;
    let deactivate: () => void;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const dataService = 'test';
    const namespace = 'db.coll';
    const connectionInfoRef = {
      current: {},
    } as ConnectionInfoRef;

    beforeEach(async function () {
      const plugin = activateSchemaPlugin(
        {
          namespace: namespace,
        },
        {
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataService: dataService as any,
          logger: dummyLogger,
          track: dummyTrack,
          preferences: await createSandboxFromDefaultPreferences(),
          fieldStoreService: mockFieldStoreService,
          queryBar: mockQueryBar as any,
          connectionInfoRef,
        },
        createActivateHelpers()
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    afterEach(function () {
      deactivate();
    });

    it('sets the local app registry', function () {
      expect(store.localAppRegistry).to.equal(localAppRegistry);
    });

    it('sets the global app registry', function () {
      expect(store.globalAppRegistry).to.equal(globalAppRegistry);
    });

    it('sets the data provider', function () {
      expect(store.dataService).to.equal(dataService);
    });

    it('sets the namespace', function () {
      expect(store.ns).to.equal(namespace);
    });

    it('defaults analysis state to initial', function () {
      expect(store.state.analysisState).to.equal(ANALYSIS_STATE_INITIAL);
    });

    it('defaults the error to empty', function () {
      expect(store.state.errorMessage).to.equal('');
    });

    it('defaults the schema to null', function () {
      expect(store.state.schema).to.equal(null);
    });
  });
});
