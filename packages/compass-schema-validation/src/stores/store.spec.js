import AppRegistry from 'hadron-app-registry';
import {
  validatorChanged,
  validationFetched,
  validationSaveFailed,
  validationActionChanged,
  validationLevelChanged,
  fetchSampleDocuments
} from 'modules/validation';
import javascriptStringify from 'javascript-stringify';
import configureStore from 'stores';

describe('Schema Validation Store', () => {
  let store;
  const globalAppRegistry = new AppRegistry();
  const localAppRegistry = new AppRegistry();
  const writeStateStore = { state: { isWritable: true } };

  before(() => {
    globalAppRegistry.registerStore('DeploymentAwareness.WriteStateStore', writeStateStore);
  });

  beforeEach(() => {
    store = configureStore({
      localAppRegistry: localAppRegistry,
      globalAppRegistry: globalAppRegistry,
      dataProvider: {
        error: 'error',
        dataProvider: 'ds'
      }
    });
  });

  describe('#onActivated', () => {
    context('when the validation changes', () => {
      it('updates the namespace in the store', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().fields).to.deep.equal([
            { name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0' },
            { name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0' }
          ]);
          done();
        });

        localAppRegistry.emit('fields-changed', {
          fields: {
            harry: {
              name: 'harry', path: 'harry', count: 1, type: 'Number'
            },
            potter: {
              name: 'potter', path: 'potter', count: 1, type: 'Boolean'
            }
          },
          topLevelFields: [ 'harry', 'potter' ],
          aceFields: [
            { name: 'harry',
              value: 'harry',
              score: 1,
              meta: 'field',
              version: '0.0.0' },
            { name: 'potter',
              value: 'potter',
              score: 1,
              meta: 'field',
              version: '0.0.0' }
          ]
        });
      });
    });

    context('when the data service is connected', () => {
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

    context('when the action is VALIDATION_FETCHED', () => {
      const validation = {
        validator: { name: { $type: 4 } },
        validationAction: 'warn',
        validationLevel: 'moderate'
      };

      it('updates the isLoading in state', () => {
        const isLoading = true;

        it('updates the validationAction in state', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().sampleDocuments.isLoading).to.equal(isLoading);
            done();
          });
          store.dispatch(fetchSampleDocuments({ matching: {}, notmatching: {}}));
        });
      });

      it('updates the validation in state if succeed', (done) => {
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

      it('updates the error in state if failed', (done) => {
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
              validationLevel: 'moderate'
            }
          };

          unsubscribe();
          expect(store.getState().validation).to.deep.equal(createdValidation);
          done();
        });
        validation.error = { message: 'Validation fetch failed!' };
        store.dispatch(validationFetched(validation));
      });
    });

    context('when the action is VALIDATION_SAVE_FAILED', () => {
      it('updates the error', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().validation.error).to.deep.equal({
            message: 'Validation save failed!'
          });
          done();
        });
        store.dispatch(validationSaveFailed({
          message: 'Validation save failed!'
        }));
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

    context('when running in a readonly context', () => {
      beforeEach(() => {
        process.env.HADRON_READONLY = 'true';
        store = configureStore({
          namespace: 'db.coll',
          globalAppRegistry: globalAppRegistry
        });
      });

      afterEach(() => {
        process.env.HADRON_READONLY = 'false';
      });

      it('sets hardonReadOnly property as true', () => {
        expect(store.getState().editMode).to.deep.equal({
          collectionReadOnly: false,
          hardonReadOnly: true,
          writeStateStoreReadOnly: false,
          oldServerReadOnly: false
        });
      });
    });
  });
});
