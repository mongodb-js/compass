import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import {
  validatorChanged,
  validationFetched,
  validationSaveFailed,
  validationActionChanged,
  validationLevelChanged,
} from '../modules/validation';
import { fetchSampleDocuments } from '../modules/sample-documents';
import { stringify as javascriptStringify } from 'javascript-stringify';
import configureStore from './';

describe('Schema Validation Store', function () {
  let store;
  const globalAppRegistry = new AppRegistry();
  const localAppRegistry = new AppRegistry();
  const writeStateStore = { state: { isWritable: true } };

  before(function () {
    globalAppRegistry.registerStore(
      'DeploymentAwareness.WriteStateStore',
      writeStateStore
    );
  });

  beforeEach(function () {
    store = configureStore({
      localAppRegistry: localAppRegistry,
      globalAppRegistry: globalAppRegistry,
      dataProvider: {
        error: 'error',
        dataProvider: 'ds',
      },
    });
  });

  describe('#onActivated', function () {
    context('when the validation changes', function () {
      it('updates the namespace in the store', function (done) {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
          ]);
          done();
        });

        localAppRegistry.emit('fields-changed', {
          fields: {
            harry: {
              name: 'harry',
              path: 'harry',
              count: 1,
              type: 'Number',
            },
            potter: {
              name: 'potter',
              path: 'potter',
              count: 1,
              type: 'Boolean',
            },
          },
          topLevelFields: ['harry', 'potter'],
          aceFields: [
            {
              name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
            {
              name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0',
            },
          ],
        });
      });
    });

    context('when the data service is connected', function () {
      it('sets the data servicein the state', function () {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', function () {
        expect(store.getState().dataService.error).to.equal('error');
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
        store.dispatch({ type: 'UNKNOWN' });
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

    context('when the action is fetch sample documents', function () {
      it('updates the sample document loading in state', function (done) {
        expect(store.getState().sampleDocuments.isLoading).to.equal(false);
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().sampleDocuments.isLoading).to.equal(true);
          done();
        });
        store.dispatch(fetchSampleDocuments({ matching: {}, notmatching: {} }));
      });
    });

    context('when the action is VALIDATION_FETCHED', function () {
      const validation = {
        validator: { name: { $type: 4 } },
        validationAction: 'warn',
        validationLevel: 'moderate',
      };

      it('updates the sample document loading in state', function (done) {
        expect(store.getState().sampleDocuments.isLoading).to.equal(false);
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().sampleDocuments.isLoading).to.equal(true);
          done();
        });
        store.dispatch(fetchSampleDocuments({ matching: {}, notmatching: {} }));
      });

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
        validation.error = { message: 'Validation fetch failed!' };
        store.dispatch(validationFetched(validation));
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

    context('when running in a readonly context', function () {
      beforeEach(function () {
        process.env.HADRON_READONLY = 'true';
        store = configureStore({
          namespace: 'db.coll',
          globalAppRegistry: globalAppRegistry,
        });
      });

      afterEach(function () {
        process.env.HADRON_READONLY = 'false';
      });

      it('sets hadronReadOnly property as true', function () {
        expect(store.getState().editMode).to.have.property(
          'hadronReadOnly',
          true
        );
      });
    });
  });
});
