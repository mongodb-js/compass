import { expect } from 'chai';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { MongoDBInstance } from 'mongodb-instance-model';

import {
  validatorChanged,
  validationFetched,
  validationFetchErrored,
  validationSaveFailed,
  validationActionChanged,
  validationLevelChanged,
  type ValidationServerAction,
  type ValidationLevel,
} from '../modules/validation';
import { fetchSampleDocuments } from '../modules/sample-documents';
import { stringify as javascriptStringify } from 'javascript-stringify';
import type { Store } from 'redux';
import type { RootAction, RootState } from '../modules';
import { onActivated } from './store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import Sinon from 'sinon';
import {
  generateValidationRules,
  stopRulesGeneration,
} from '../modules/rules-generation';
import { waitFor } from '@mongodb-js/testing-library-compass';

const topologyDescription = {
  type: 'Unknown',
  servers: [{ type: 'Unknown' }],
};

const fakeInstance = new MongoDBInstance({
  _id: '123',
  topologyDescription,
  build: {
    version: '6.0.0',
  },
} as any);

const fakeDataService = {
  collectionInfo: () =>
    new Promise(() => {
      /* never resolves */
    }),
  isCancelError: () => false,
  sample: () => [{ prop1: 'abc' }],
} as any;

const fakeWorkspaces = {
  onTabReplace: () => {},
  onTabClose: () => {},
} as unknown as WorkspacesService;

const getMockedStore = async (analyzeSchema: any) => {
  const globalAppRegistry = new AppRegistry();
  const connectionInfoRef = {
    current: {},
  } as ConnectionInfoRef;
  const activateResult = onActivated(
    { namespace: 'test.test' } as any,
    {
      globalAppRegistry: globalAppRegistry,
      dataService: fakeDataService,
      instance: fakeInstance,
      workspaces: fakeWorkspaces,
      preferences: await createSandboxFromDefaultPreferences(),
      logger: createNoopLogger(),
      track: createNoopTrack(),
      connectionInfoRef,
    },
    createActivateHelpers(),
    analyzeSchema
  );
  return activateResult;
};

const schemaAccessor = {
  getMongoDBJsonSchema: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ required: ['prop1'] }), 100); // waiting to give abort a chance
    });
  },
  getInternalSchema: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ required: ['prop1'] }), 100); // waiting to give abort a chance
    });
  },
};

describe('Schema Validation Store', function () {
  let store: Store<RootState, RootAction>;
  let deactivate: null | (() => void) = null;
  let sandbox: Sinon.SinonSandbox;

  beforeEach(async function () {
    sandbox = Sinon.createSandbox();
    fakeWorkspaces.onTabClose = sandbox.stub();
    fakeWorkspaces.onTabReplace = sandbox.stub();
    const fakeAnalyzeSchema = sandbox.fake.resolves(schemaAccessor);
    const activateResult = await getMockedStore(fakeAnalyzeSchema);
    store = activateResult.store;
    deactivate = activateResult.deactivate;
  });

  afterEach(function () {
    sandbox.reset();
    deactivate?.();
    deactivate = null;
  });

  describe('#onActivated', function () {
    it('uses instance.build.version', function () {
      expect(store.getState().serverVersion).to.equal('6.0.0');
    });

    context('when instance.isWritable changes', function () {
      it('updates editMode', function () {
        expect(store.getState().editMode).to.deep.equal({
          collectionReadOnly: false,
          collectionTimeSeries: false,
          isEditingEnabledByUser: false,
          oldServerReadOnly: false,
          writeStateStoreReadOnly: true,
        });

        (fakeInstance as any).set({
          topologyDescription: {
            type: 'Single',
            servers: [{ type: 'Standalone' }],
          },
        });

        expect(store.getState().editMode).to.deep.equal({
          collectionReadOnly: false,
          collectionTimeSeries: false,
          isEditingEnabledByUser: false,
          oldServerReadOnly: false,
          writeStateStoreReadOnly: false,
        });
      });
    });
  });

  describe('#dispatch', function () {
    context('when the action is unknown', function () {
      it('returns the initial state', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validator).to.equal('');
          done();
        });
        store.dispatch({ type: 'UNKNOWN' } as any);
      });
    });

    context('when the action is VALIDATOR_CHANGED', function () {
      const validator = '{ name: { $type: 4 } }';

      it('updates the validator in state', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validator).to.equal(validator);
          done();
        });
        store.dispatch(validatorChanged(validator));
      });

      it('prevents closing the tab', function () {
        store.dispatch(validatorChanged(validator));
        expect(store.getState().validation.isChanged).to.be.true;
        deactivate?.();
        const fnProvidedToOnTabClose = (
          fakeWorkspaces.onTabClose as Sinon.SinonStub
        ).args[0][0];
        expect(fnProvidedToOnTabClose()).to.be.false;
      });
    });

    context('when the action is fetch sample documents', function () {
      it('updates the sample document loading in state', function (done) {
        expect(store.getState().sampleDocuments.validDocumentState).to.equal(
          'initial'
        );
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().sampleDocuments.validDocumentState).to.equal(
            'loading'
          );
          expect(
            store.getState().sampleDocuments.invalidDocumentState
          ).to.equal('loading');
          done();
        });
        store.dispatch(fetchSampleDocuments() as any);
      });
    });

    context('when the action is VALIDATION_FETCHED', function () {
      const validation = {
        validator: { name: { $type: 4 } },
        validationAction: 'warn' as ValidationServerAction,
        validationLevel: 'moderate' as ValidationLevel,
      };

      it('updates the validation in state if succeed', function (done) {
        const unsubscribe = store.subscribe(() => {
          const validator = javascriptStringify(validation.validator, null, 2);
          const createdValidation = {
            validator,
            validationAction: 'warn',
            validationLevel: 'moderate',
            error: null,
            syntaxError: null,
            isChanged: false,
            prevValidation: {
              validator,
              validationAction: 'warn',
              validationLevel: 'moderate',
            },
          };

          unsubscribe();
          expect(store.getState().validation).to.deep.equal(createdValidation);
          done();
        });
        store.dispatch(validationFetched(validation));
      });
    });

    context('when the action is VALIDATION_FETCH_ERRORED', function () {
      it('updates the error in state', function (done) {
        const unsubscribe = store.subscribe(() => {
          const expectedValidation = {
            validator: '{}',
            validationAction: 'error',
            validationLevel: 'strict',
            error: { message: 'Validation fetch failed!' },
            syntaxError: null,
            isChanged: true,
            prevValidation: {
              validator: '{}',
              validationAction: 'error',
              validationLevel: 'strict',
            },
          };

          unsubscribe();
          expect(store.getState().validation).to.deep.equal(expectedValidation);
          done();
        });
        store.dispatch(
          validationFetchErrored({ message: 'Validation fetch failed!' })
        );
      });
    });

    context('when the action is VALIDATION_SAVE_FAILED', function () {
      it('updates the error', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.error).to.deep.equal({
            message: 'Validation save failed!',
          });
          done();
        });
        store.dispatch(
          validationSaveFailed({
            message: 'Validation save failed!',
          })
        );
      });
    });

    context('when the action is VALIDATION_ACTION_CHANGED', function () {
      const validationAction = 'error';

      it('updates the validationAction in state', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validationAction).to.equal(
            validationAction
          );
          done();
        });
        store.dispatch(validationActionChanged(validationAction));
      });
    });

    context('when the action is VALIDATION_LEVEL_CHANGED', function () {
      const validationLevel = 'moderate';

      it('updates the validationAction in state', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validationLevel).to.equal(
            validationLevel
          );
          done();
        });
        store.dispatch(validationLevelChanged(validationLevel));
      });
    });

    context('when the action is generateValidationRules', function () {
      it('executes rules generation', async function () {
        store.dispatch(generateValidationRules() as any);

        await waitFor(() => {
          expect(store.getState().rulesGeneration.isInProgress).to.equal(true);
        });
        await waitFor(() => {
          expect(
            JSON.parse(store.getState().validation.validator)
          ).to.deep.equal({
            $jsonSchema: {
              required: ['prop1'],
            },
          });
          expect(store.getState().rulesGeneration.isInProgress).to.equal(false);
          expect(store.getState().rulesGeneration.error).to.be.undefined;
        });
      });

      it('rules generation can be aborted', async function () {
        store.dispatch(generateValidationRules() as any);

        await waitFor(() => {
          expect(store.getState().rulesGeneration.isInProgress).to.equal(true);
        });

        store.dispatch(stopRulesGeneration() as any);
        await waitFor(() => {
          expect(store.getState().validation.validator).to.equal('');
          expect(store.getState().rulesGeneration.isInProgress).to.equal(false);
          expect(store.getState().rulesGeneration.error).to.be.undefined;
        });
      });

      context('rules generation failure', function () {
        it('handles general error', async function () {
          const fakeAnalyzeSchema = sandbox.fake.rejects(
            new Error('Such a failure')
          );
          const activateResult = await getMockedStore(fakeAnalyzeSchema);
          store = activateResult.store;
          deactivate = activateResult.deactivate;
          store.dispatch(generateValidationRules() as any);

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              true
            );
          });

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              false
            );
            expect(store.getState().rulesGeneration.error).to.deep.equal({
              errorMessage: 'Such a failure',
              errorType: 'general',
            });
          });
        });

        it('handles complexity error', async function () {
          const fakeAnalyzeSchema = sandbox.fake.rejects(
            new Error('Schema analysis aborted: Fields count above 1000')
          );
          const activateResult = await getMockedStore(fakeAnalyzeSchema);
          store = activateResult.store;
          deactivate = activateResult.deactivate;
          store.dispatch(generateValidationRules() as any);

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              true
            );
          });

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              false
            );
            expect(store.getState().rulesGeneration.error).to.deep.equal({
              errorMessage: 'Schema analysis aborted: Fields count above 1000',
              errorType: 'highComplexity',
            });
          });
        });

        it('handles timeout error', async function () {
          const timeoutError: any = new Error('Too long, didnt execute');
          timeoutError.code = 50;
          const fakeAnalyzeSchema = sandbox.fake.rejects(timeoutError);
          const activateResult = await getMockedStore(fakeAnalyzeSchema);
          store = activateResult.store;
          deactivate = activateResult.deactivate;
          store.dispatch(generateValidationRules() as any);

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              true
            );
          });

          await waitFor(() => {
            expect(store.getState().rulesGeneration.isInProgress).to.equal(
              false
            );
            expect(store.getState().rulesGeneration.error).to.deep.equal({
              errorMessage: 'Too long, didnt execute',
              errorType: 'timeout',
            });
          });
        });
      });
    });
  });
});
