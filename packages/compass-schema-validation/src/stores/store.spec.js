import AppRegistry from 'hadron-app-registry';
import FieldStore, { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import {
  validatorChanged,
  validationFetched,
  validationSaved,
  validationActionChanged,
  validationLevelChanged
} from 'modules/validation';
import { reset, INITIAL_STATE } from '../modules/index';
import javascriptStringify from 'javascript-stringify';

describe('Schema Validation Store', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();

    beforeEach(() => {
      activate(appRegistry);
      store.onActivated(appRegistry);
    });

    context('when the validation changes', () => {
      const docs = [{ _id: 1, name: 'Test' }];

      it('updates the namespace in the store', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
            { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
          ]);
          done();
        });

        FieldStore.processDocuments(docs);
      });
    });

    context('when the data service is connected', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', 'error', 'ds');
      });

      it('sets the data servicein the state', () => {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', () => {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });
  });

  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validator).to.equal('');
          done();
        });
        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when the action is VALIDATOR_CHANGED', () => {
      const validator = '{ name: { $type: 4 } }';

      it('updates the validator in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validator).to.equal(validator);
          done();
        });
        store.dispatch(validatorChanged(validator));
      });
    });

    context('when the action is VALIDATION_CANCELED', () => {
      const validator = '{ name: { $type: 4 } }';

      it('updates the stage in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.prevValidation).to.be.undefined;
          done();
        });
        store.dispatch(validatorChanged(validator));
      });
    });

    context('when the action is VALIDATION_FETCHED', () => {
      const validation = {
        validator: { name: { $type: 4 } },
        validationAction: 'warn',
        validationLevel: 'moderate'
      };

      it('updates the validation in state', (done) => {
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
              validationLevel: 'moderate'
            }
          };

          unsubscribe();
          expect(store.getState().validation).to.deep.equal(createdValidation);
          done();
        });
        store.dispatch(validationFetched(validation));
      });
    });

    context('when the action is VALIDATION_SAVED', () => {
      const validation = '{ validator: { name: { $type: 4 } } }';

      it('updates the validation in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.error).to.equal(null);
          done();
        });
        store.dispatch(validationSaved(validation));
      });
    });

    context('when the action is VALIDATION_ACTION_CHANGED', () => {
      const validationAction = 'error';

      it('updates the validationAction in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validationAction).to.equal(validationAction);
          done();
        });
        store.dispatch(validationActionChanged(validationAction));
      });
    });

    context('when the action is VALIDATION_LEVEL_CHANGED', () => {
      const validationLevel = 'moderate';

      it('updates the validationAction in state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.validationLevel).to.equal(validationLevel);
          done();
        });
        store.dispatch(validationLevelChanged(validationLevel));
      });
    });

    context('when the collection changes', () => {
      context('when there is no collection', () => {
        const appRegistry = new AppRegistry();

        beforeEach(() => {
          store.onActivated(appRegistry);
          appRegistry.emit('collection-changed', 'db');
        });

        it('does not update the namespace in the store', () => {
          expect(store.getState().namespace).to.equal('');
        });

        it('resets the rest of the state to initial state', () => {
          expect(store.getState()).to.deep.equal({
            namespace: '',
            appRegistry: appRegistry,
            dataService: INITIAL_STATE.dataService,
            fields: INITIAL_STATE.fields,
            serverVersion: INITIAL_STATE.serverVersion,
            validation: INITIAL_STATE.validation
          });
        });
      });
    });
  });
});
