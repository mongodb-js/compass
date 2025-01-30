import { activateSchemaPlugin, type SchemaStore } from './store';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { expect } from 'chai';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { startAnalysis, stopAnalysis } from './reducer';
import Sinon from 'sinon';

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
    let sandbox: Sinon.SinonSandbox;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const namespace = 'db.coll';
    const connectionInfoRef = {
      current: {},
    } as ConnectionInfoRef;
    let sampleStub: Sinon.SinonStub;
    let isCancelErrorStub: Sinon.SinonStub;

    beforeEach(async function () {
      sandbox = Sinon.createSandbox();
      sampleStub = sandbox.stub();
      isCancelErrorStub = sandbox.stub();
      const dataService = {
        sample: sampleStub,
        isCancelError: isCancelErrorStub,
      };
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
      sandbox.reset();
    });

    it('defaults analysis state to initial', function () {
      expect(store.getState().analysisState).to.equal(ANALYSIS_STATE_INITIAL);
    });

    it('defaults the error to empty', function () {
      expect(store.getState().errorMessage).to.equal('');
    });

    it('defaults the schema to null', function () {
      expect(store.getState().schema).to.equal(null);
    });

    it('runs analysis', async function () {
      const oldResultId = store.getState().resultId;
      sampleStub.resolves([{ name: 'Hans' }, { name: 'Greta' }]);
      await store.dispatch(startAnalysis());
      expect(sampleStub).to.have.been.called;
      const { analysisState, errorMessage, schema, resultId } =
        store.getState();
      expect(analysisState).to.equal('complete');
      expect(!!errorMessage).to.be.false;
      expect(schema).not.to.be.null;
      expect(resultId).not.to.equal(oldResultId);
    });

    it('analysis can be aborted', async function () {
      const analysisPromise = store.dispatch(startAnalysis());
      expect(store.getState().analysisState).to.equal('analyzing');
      sampleStub.rejects(new Error('abort'));
      store.dispatch(stopAnalysis());
      isCancelErrorStub.returns(true);
      await analysisPromise;
      expect(store.getState().analysisState).to.equal('initial');
    });
  });
});
