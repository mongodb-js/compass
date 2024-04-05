import type { SchemaStore } from './store';
import { activateSchemaPlugin } from './store';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { EventEmitter } from 'events';
import { expect } from 'chai';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';

const dummyLogger = createNoopLoggerAndTelemetry('TEST');

const mockFieldStoreService = {
  updateFieldsFromDocuments() {},
  updateFieldsFromSchema() {},
} as unknown as FieldStoreService;

describe('Schema Store', function () {
  describe('#configureStore', function () {
    let store: SchemaStore;
    let deactivate: () => void;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const dataService = 'test';
    const namespace = 'db.coll';

    beforeEach(async function () {
      const plugin = activateSchemaPlugin(
        {
          namespace: namespace,
        },
        {
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataService: dataService as any,
          loggerAndTelemetry: dummyLogger,
          preferences: await createSandboxFromDefaultPreferences(),
          fieldStoreService: mockFieldStoreService,
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

    it('defaults max time ms to the default', function () {
      expect(store.query.maxTimeMS).to.equal(60000);
    });

    it('defaults the schema to null', function () {
      expect(store.state.schema).to.equal(null);
    });
  });

  context('when query change events are emitted', function () {
    let store: SchemaStore;
    let deactivate: () => void;
    const localAppRegistry = new AppRegistry();
    const filter = { name: 'test' };
    const limit = 50;
    const project = { name: 1 };

    beforeEach(async function () {
      const plugin = activateSchemaPlugin(
        {
          namespace: 'test',
        },
        {
          localAppRegistry: localAppRegistry,
          globalAppRegistry: new EventEmitter() as any,
          dataService: {} as any,
          loggerAndTelemetry: dummyLogger,
          preferences: await createSandboxFromDefaultPreferences(),
          fieldStoreService: mockFieldStoreService,
        },
        createActivateHelpers()
      );
      localAppRegistry.emit('query-changed', {
        filter: filter,
        limit: limit,
        project: project,
      });
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    afterEach(function () {
      deactivate();
    });

    it('sets the filter', function () {
      expect(store.query.filter).to.deep.equal(filter);
    });

    it('sets the limit', function () {
      expect(store.query.limit).to.deep.equal(limit);
    });

    it('sets the project', function () {
      expect(store.query.project).to.deep.equal(project);
    });
  });
});
