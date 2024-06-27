import { expect } from 'chai';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import { MongoDBInstance } from 'mongodb-instance-model';

import {
  validatorChanged,
  validationFetched,
  validationSaveFailed,
  validationActionChanged,
  validationLevelChanged,
} from '../modules/validation';
import {
  fetchValidDocument,
  fetchInvalidDocument,
} from '../modules/sample-documents';
import { stringify as javascriptStringify } from 'javascript-stringify';
import type { Store } from 'redux';
import type { RootAction, RootState } from '../modules';
import { onActivated } from './store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

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
} as any;

describe('Schema Validation Store', function () {
  let store: Store<RootState, RootAction>;
  let deactivate: null | (() => void) = null;
  const globalAppRegistry = new AppRegistry();
  const connectionInfoAccess = {
    getCurrentConnectionInfo: () => {},
  } as ConnectionInfoAccess;

  beforeEach(async function () {
    const activateResult = onActivated(
      { namespace: 'test.test' } as any,
      {
        globalAppRegistry: globalAppRegistry,
        dataService: fakeDataService,
        instance: fakeInstance,
        preferences: await createSandboxFromDefaultPreferences(),
        logger: createNoopLogger(),
        track: createNoopTrack(),
        connectionInfoAccess,
      },
      createActivateHelpers()
    );
    store = activateResult.store;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    deactivate = activateResult.deactivate;
  });

  afterEach(function () {
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
    });

    context('when the action is fetch valid sample documents', function () {
      it('updates the sample document loading in state', function (done) {
        expect(store.getState().sampleDocuments.validDocumentState).to.equal(
          'initial'
        );
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().sampleDocuments.validDocumentState).to.equal(
            'loading'
          );
          done();
        });
        store.dispatch(fetchValidDocument() as any);
      });
    });

    context('when the action is fetch invalid sample documents', function () {
      it('updates the sample document loading in state', function (done) {
        expect(store.getState().sampleDocuments.invalidDocumentState).to.equal(
          'initial'
        );
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(
            store.getState().sampleDocuments.invalidDocumentState
          ).to.equal('loading');
          done();
        });
        store.dispatch(fetchInvalidDocument() as any);
      });
    });

    context('when the action is VALIDATION_FETCHED', function () {
      const validation = {
        validator: { name: { $type: 4 } },
        validationAction: 'warn',
        validationLevel: 'moderate',
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
        store.dispatch(validationFetched(validation as any));
      });

      it('updates the error in state if failed', function (done) {
        const unsubscribe = store.subscribe(() => {
          const validator = javascriptStringify(validation.validator, null, 2);
          const createdValidation = {
            validator,
            validationAction: 'warn',
            validationLevel: 'moderate',
            error: { message: 'Validation fetch failed!' },
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
        (validation as any).error = { message: 'Validation fetch failed!' };
        store.dispatch(validationFetched(validation as any));
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
  });
});
