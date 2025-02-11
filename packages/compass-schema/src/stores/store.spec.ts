import { activateSchemaPlugin } from './store';
import type { SchemaStore, SchemaPluginServices } from './store';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { startAnalysis, stopAnalysis } from './schema-analysis-reducer';
import Sinon from 'sinon';
import { changeExportSchemaFormat } from './schema-export-reducer';

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
  let store: SchemaStore;
  let deactivate: () => void;
  let sandbox: Sinon.SinonSandbox;
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  const namespace = 'db.coll';
  let sampleStub: Sinon.SinonStub;
  let isCancelErrorStub: Sinon.SinonStub;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    sampleStub = sandbox.stub();
    isCancelErrorStub = sandbox.stub();
  });

  async function createStore(services: Partial<SchemaPluginServices> = {}) {
    const dataService = {
      sample: sampleStub,
      isCancelError: isCancelErrorStub,
    };
    const connectionInfoRef = {
      current: {
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        title: 'test',
        id: 'test',
      },
    };

    const plugin = activateSchemaPlugin(
      {
        namespace: namespace,
      },
      {
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataService,
        logger: dummyLogger,
        track: dummyTrack,
        preferences: await createSandboxFromDefaultPreferences(),
        fieldStoreService: mockFieldStoreService,
        queryBar: mockQueryBar as any,
        connectionInfoRef,
        ...services,
      },
      createActivateHelpers()
    );
    store = plugin.store;
    deactivate = () => plugin.deactivate();
  }

  describe('#configureStore', function () {
    beforeEach(async function () {
      await createStore();
    });

    afterEach(function () {
      deactivate();
      sandbox.reset();
    });

    it('defaults analysis state to initial', function () {
      expect(store.getState().schemaAnalysis.analysisState).to.equal(
        ANALYSIS_STATE_INITIAL
      );
    });

    it('defaults the error to empty', function () {
      expect(store.getState().schemaAnalysis.errorMessage).to.equal('');
    });

    it('defaults the schema to null', function () {
      expect(store.getState().schemaAnalysis.schema).to.equal(null);
    });

    it('runs analysis', async function () {
      const oldResultId = store.getState().schemaAnalysis.resultId;
      sampleStub.resolves([{ name: 'Hans' }, { name: 'Greta' }]);
      await store.dispatch(startAnalysis());
      expect(sampleStub).to.have.been.called;
      const { analysisState, errorMessage, schema, resultId } =
        store.getState().schemaAnalysis;
      expect(analysisState).to.equal('complete');
      expect(!!errorMessage).to.be.false;
      expect(schema).not.to.be.null;
      expect(resultId).not.to.equal(oldResultId);
    });

    it('analysis can be aborted', async function () {
      const analysisPromise = store.dispatch(startAnalysis());
      expect(store.getState().schemaAnalysis.analysisState).to.equal(
        'analyzing'
      );
      sampleStub.rejects(new Error('abort'));
      store.dispatch(stopAnalysis());
      isCancelErrorStub.returns(true);
      await analysisPromise;
      expect(store.getState().schemaAnalysis.analysisState).to.equal('initial');
    });

    describe('schema export', function () {
      describe('with an analyzed schema', function () {
        beforeEach(async function () {
          sampleStub.resolves([{ name: 'Hans' }, { name: 'Greta' }]);
          await store.dispatch(startAnalysis());
        });

        it('runs schema export formatting with the analyzed schema', async function () {
          sampleStub.resolves([{ name: 'Hans' }, { name: 'Greta' }]);
          await store.dispatch(changeExportSchemaFormat('standardJSON'));
          expect(sampleStub).to.have.been.called;
          const { exportStatus, errorMessage, exportedSchema } =
            store.getState().schemaExport;
          expect(exportStatus).to.equal('complete');
          expect(!!errorMessage).to.be.false;
          expect(exportedSchema).not.to.be.undefined;
          expect(JSON.parse(exportedSchema!).type).to.equal('object');
          expect(JSON.parse(exportedSchema!)['$schema']).to.equal(
            'https://json-schema.org/draft/2020-12/schema'
          );
          expect(JSON.parse(exportedSchema!).required).to.deep.equal(['name']);
          expect(JSON.parse(exportedSchema!).properties).to.deep.equal({
            name: { type: 'string' },
          });
        });
      });
    });

    it('runs the analysis with fallback read pref secondaryPreferred', async function () {
      sampleStub.resolves([{ name: 'Hans' }, { name: 'Greta' }]);
      await store.dispatch(startAnalysis());
      expect(sampleStub.getCall(0).args[3])
        .property('fallbackReadPreference')
        .to.equal('secondaryPreferred');
    });
  });

  describe('with a connection string with explicit read preference set', function () {
    beforeEach(async function () {
      await createStore({
        connectionInfoRef: {
          current: {
            connectionOptions: {
              connectionString:
                'mongodb://localhost:27017/?readPreference=primary',
            },
            title: 'test',
            id: 'test',
          },
        },
      });
    });

    it('does not set read preference to secondaryPreferred', async function () {
      await store.dispatch(startAnalysis());
      expect(sampleStub.getCall(0).args[2]).not.to.have.property(
        'readPreference'
      );
    });
  });
});
