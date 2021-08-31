import {stringify as javascriptStringify } from 'javascript-stringify';
import reducer, {
  checkValidator,
  validationActionChanged,
  validationLevelChanged,
  validatorChanged,
  validationFetched,
  validationCanceled,
  validationSaveFailed,
  syntaxErrorOccurred,
  validationFromCollection,
  VALIDATOR_CHANGED,
  VALIDATION_CANCELED,
  VALIDATION_SAVE_FAILED,
  VALIDATION_FETCHED,
  VALIDATION_ACTION_CHANGED,
  VALIDATION_LEVEL_CHANGED,
  SYNTAX_ERROR_OCCURRED
} from './validation';

describe('validation module', () => {
  describe('#checkValidator', () => {
    it('returns parsed JS validation query and error information', () => {
      expect(checkValidator('{ $jsonSchema: { bsonType: \'object\' } }')).to.deep.equal({
        syntaxError: null,
        validator: { $jsonSchema: { bsonType: 'object' } }
      });
    });
  });

  describe('#validationActionChanged', () => {
    it('returns the VALIDATION_ACTION_CHANGED action', () => {
      expect(validationActionChanged('warn')).to.deep.equal({
        type: VALIDATION_ACTION_CHANGED,
        validationAction: 'warn'
      });
    });
  });

  describe('#validationLevelChanged', () => {
    it('returns the VALIDATION_LEVEL_CHANGED action', () => {
      expect(validationLevelChanged('moderate')).to.deep.equal({
        type: VALIDATION_LEVEL_CHANGED,
        validationLevel: 'moderate'
      });
    });
  });

  describe('#validatorChanged', () => {
    it('returns the VALIDATOR_CHANGED action', () => {
      expect(
        validatorChanged('{ $jsonSchema: { bsonType: \'object\', required: [ \'name\' ] } }')
      ).to.deep.equal({
        type: VALIDATOR_CHANGED,
        validator: '{ $jsonSchema: { bsonType: \'object\', required: [ \'name\' ] } }'
      });
    });
  });

  describe('#validationFetched', () => {
    it('returns the VALIDATION_FETCHED action', () => {
      expect(validationFetched({
        validator: { name: { $exists: true } },
        validationAction: 'warning',
        validationLevel: 'off'
      })).to.deep.equal({
        type: VALIDATION_FETCHED,
        validation: {
          validator: { name: { $exists: true } },
          validationAction: 'warning',
          validationLevel: 'off'
        }
      });
    });
  });

  describe('#validationCanceled', () => {
    it('returns the VALIDATION_CANCELED action', () => {
      expect(validationCanceled({
        isChanged: false,
        validator: { name: { $exists: true } },
        validationAction: 'warning',
        validationLevel: 'off',
        syntaxError: null,
        error: null
      })).to.deep.equal({
        type: VALIDATION_CANCELED,
        validation: {
          isChanged: false,
          validator: { name: { $exists: true } },
          validationAction: 'warning',
          validationLevel: 'off',
          syntaxError: null,
          error: null
        }
      });
    });
  });

  describe('#validationSaveFailed', () => {
    it('returns the VALIDATION_SAVE_FAILED action', () => {
      expect(validationSaveFailed({
        message: 'Validation save failed!'
      })).to.deep.equal({
        type: VALIDATION_SAVE_FAILED,
        error: { message: 'Validation save failed!' }
      });
    });
  });

  describe('#syntaxErrorOccurred', () => {
    it('returns the SYNTAX_ERROR_OCCURRED action', () => {
      expect(syntaxErrorOccurred({ message: 'Syntax Error!' })).to.deep.equal({
        type: SYNTAX_ERROR_OCCURRED,
        syntaxError: { message: 'Syntax Error!' }
      });
    });
  });

  describe('validationFromCollection', () => {
    context('when an error occurs listing the collection', () => {
      it('includes the error', () => {
        const error = new Error('Fake error');
        expect(validationFromCollection(error)).to.deep.equal({
          validationAction: 'error',
          validationLevel: 'strict',
          error
        });
      });
    });

    context('when the options contains no options', () => {
      it('returns defaults', () => {
        const data = [{}];
        expect(validationFromCollection(null, data)).to.deep.equal({
          validationAction: 'error',
          validationLevel: 'strict'
        });
      });
    });

    context('when the options contains no validation-related options', () => {
      it('returns defaults', () => {
        const data = [{ options: {} }];
        expect(validationFromCollection(null, data)).to.deep.equal({
          validationAction: 'error',
          validationLevel: 'strict'
        });
      });
    });

    context('when the options contains validation-related options', () => {
      it('overrides the defaults', () => {
        const data = [{
          options: {
            validationAction: 'new-validationAction',
            validationLevel: 'new-validationLevel',
            validator: { foo: 'bar' }
          }
        }];
        expect(validationFromCollection(null, data)).to.deep.equal({
          validationAction: 'new-validationAction',
          validationLevel: 'new-validationLevel',
          validator: { foo: 'bar' }
        });
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in validation module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: false,
          syntaxError: null,
          error: null
        });
      });
    });

    context('when the action is validationActionChanged', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationActionChanged('warn'));

        expect(validation.validationAction).to.equal('warn');
      });
    });

    context('when the action is validationLevelChanged', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationLevelChanged('moderate'));

        expect(validation.validationLevel).to.equal('moderate');
      });
    });

    context('when the action is validatorChanged', () => {
      it('returns the new state for the simple object', () => {
        const validation = reducer(undefined, validatorChanged(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`));

        expect(validation.validator).to.equal(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`);
      });

      it('returns the new state for the object with regex', () => {
        const validation = reducer(undefined, validatorChanged(`{
          'name': 'test',
          'options': {
            'validator': {
              'number': {
                '$exists': true
              },
              'last_name': {
                '$regex': '^foo'
              }
            },
            'validationLevel': 'strict',
            'validationAction': 'error'
          }
        }`));

        expect(validation.validator).to.equal(`{
          'name': 'test',
          'options': {
            'validator': {
              'number': {
                '$exists': true
              },
              'last_name': {
                '$regex': '^foo'
              }
            },
            'validationLevel': 'strict',
            'validationAction': 'error'
          }
        }`);
      });
    });

    context('when the action is validationFetched', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationFetched({
          validator: { name: { $exists: true } },
          validationAction: 'warning',
          validationLevel: 'off'
        }));
        const checkedValidator = checkValidator('{ name: { $exists: true } }');
        const validator = javascriptStringify(checkedValidator.validator, null, 2);

        expect(validation).to.deep.equal({
          isChanged: false,
          prevValidation: {
            validator,
            validationAction: 'warning',
            validationLevel: 'off'
          },
          validator,
          validationAction: 'warning',
          validationLevel: 'off',
          syntaxError: null,
          error: null
        });
      });
    });

    context('when the action is validationSaveFailed', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, validationSaveFailed({
          message: 'Validation save failed!'
        }));

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: false,
          syntaxError: null,
          error: { message: 'Validation save failed!' }
        });
      });
    });

    context('when the action is syntaxErrorOccurred', () => {
      it('returns the new state', () => {
        const validation = reducer(undefined, syntaxErrorOccurred({ message: 'Syntax Error!' }));

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: true,
          syntaxError: { message: 'Syntax Error!' },
          error: null
        });
      });
    });
  });
});
