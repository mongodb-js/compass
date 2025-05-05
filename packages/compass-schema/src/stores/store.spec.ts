import { activateSchemaPlugin } from './store';
import type { SchemaStore, SchemaPluginServices } from './store';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';
import { waitFor } from '@mongodb-js/testing-library-compass';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { startAnalysis, stopAnalysis } from './schema-analysis-reducer';
import Sinon from 'sinon';
import {
  changeExportSchemaFormat,
  openExportSchema,
} from './schema-export-reducer';

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

function createMockCursor(data: any[]) {
  return {
    *[Symbol.asyncIterator]() {
      yield* data;
    },
  };
}

describe('Schema Store', function () {
  let store: SchemaStore;
  let deactivate: () => void;
  let sandbox: Sinon.SinonSandbox;
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  const namespace = 'db.coll';
  let sampleCursorStub: Sinon.SinonStub;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    sampleCursorStub = sandbox.stub();
  });

  async function createStore(services: Partial<SchemaPluginServices> = {}) {
    const dataService = {
      sampleCursor: sampleCursorStub,
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
      expect(store.getState().schemaAnalysis.error).to.be.undefined;
    });

    it('defaults the schema to null', function () {
      expect(store.getState().schemaAnalysis.schema).to.equal(null);
    });

    it('runs analysis', async function () {
      const oldResultId = store.getState().schemaAnalysis.resultId;
      sampleCursorStub.returns(
        createMockCursor([{ name: 'Hans' }, { name: 'Greta' }])
      );
      await store.dispatch(startAnalysis());
      expect(sampleCursorStub).to.have.been.called;
      const { analysisState, error, schema, resultId, analysisStartTime } =
        store.getState().schemaAnalysis;
      expect(analysisState).to.equal('complete');
      expect(error).to.be.undefined;
      expect(analysisStartTime).to.not.be.undefined;
      expect(analysisStartTime).to.be.greaterThan(1000);
      expect(schema).not.to.be.null;
      expect(resultId).not.to.equal(oldResultId);
    });

    it('analysis can be aborted', async function () {
      const analysisPromise = store.dispatch(startAnalysis());
      expect(store.getState().schemaAnalysis.analysisState).to.equal(
        'analyzing'
      );
      sampleCursorStub.returns({
        async *[Symbol.asyncIterator]() {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          yield {
            a: 123,
          };
          yield {
            b: 123,
          };
        },
      });
      store.dispatch(stopAnalysis());
      await analysisPromise;
      expect(store.getState().schemaAnalysis.analysisState).to.equal('initial');
    });

    describe('schema export', function () {
      describe('with an analyzed schema', function () {
        beforeEach(async function () {
          sampleCursorStub.returns(
            createMockCursor([{ name: 'Hans' }, { name: 'Greta' }])
          );
          await store.dispatch(startAnalysis());
        });

        it('runs schema export formatting with the analyzed schema when opened', async function () {
          sampleCursorStub.returns(
            createMockCursor([{ name: 'Hans' }, { name: 'Greta' }])
          );
          expect(sampleCursorStub).to.have.been.called;
          expect(store.getState().schemaExport.exportStatus).to.equal(
            'inprogress'
          );
          store.dispatch(openExportSchema());
          await waitFor(() => {
            expect(store.getState().schemaExport.exportStatus).to.equal(
              'complete'
            );
          });
          const { exportStatus, errorMessage, exportedSchema, filename } =
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
          expect(filename).to.equal('schema-db-coll-standardJSON.json');
        });

        it('runs schema export formatting with a new format', async function () {
          sampleCursorStub.returns(
            createMockCursor([{ name: 'Hans' }, { name: 'Greta' }])
          );
          await store.dispatch(changeExportSchemaFormat('mongoDBJSON'));
          expect(sampleCursorStub).to.have.been.called;
          const { exportStatus, errorMessage, exportedSchema, filename } =
            store.getState().schemaExport;
          expect(exportStatus).to.equal('complete');
          expect(!!errorMessage).to.be.false;
          expect(exportedSchema).not.to.be.undefined;
          const parsedSchema = JSON.parse(exportedSchema!).$jsonSchema;
          expect(parsedSchema.type).to.equal(undefined);
          expect(parsedSchema.bsonType).to.equal('object');
          expect(parsedSchema['$schema']).to.equal(undefined);
          expect(parsedSchema.required).to.deep.equal(['name']);
          expect(parsedSchema.properties).to.deep.equal({
            name: { bsonType: 'string' },
          });
          expect(filename).to.equal('schema-db-coll-mongoDBJSON.json');
        });
      });
    });

    it('runs the analysis with fallback read pref secondaryPreferred', async function () {
      sampleCursorStub.returns(
        createMockCursor([{ name: 'Hans' }, { name: 'Greta' }])
      );
      await store.dispatch(startAnalysis());
      expect(sampleCursorStub.getCall(0).args[3])
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
      expect(sampleCursorStub.getCall(0).args[2]).not.to.have.property(
        'readPreference'
      );
    });
  });
});
