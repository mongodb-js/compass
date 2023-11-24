import { expect } from 'chai';
import { stringify as javascriptStringify } from 'javascript-stringify';

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
  SYNTAX_ERROR_OCCURRED,
} from './validation';

describe('validation module', function () {
  describe('#checkValidator', function () {
    it('returns parsed JS validation query and error information', function () {
      expect(
        checkValidator("{ $jsonSchema: { bsonType: 'object' } }")
      ).to.deep.equal({
        syntaxError: null,
        validator: { $jsonSchema: { bsonType: 'object' } },
      });
    });
  });

  describe('#validationActionChanged', function () {
    it('returns the VALIDATION_ACTION_CHANGED action', function () {
      expect(validationActionChanged('warn')).to.deep.equal({
        type: VALIDATION_ACTION_CHANGED,
        validationAction: 'warn',
      });
    });
  });

  describe('#validationLevelChanged', function () {
    it('returns the VALIDATION_LEVEL_CHANGED action', function () {
      expect(validationLevelChanged('moderate')).to.deep.equal({
        type: VALIDATION_LEVEL_CHANGED,
        validationLevel: 'moderate',
      });
    });
  });

  describe('#validatorChanged', function () {
    it('returns the VALIDATOR_CHANGED action', function () {
      expect(
        validatorChanged(
          "{ $jsonSchema: { bsonType: 'object', required: [ 'name' ] } }"
        )
      ).to.deep.equal({
        type: VALIDATOR_CHANGED,
        validator:
          "{ $jsonSchema: { bsonType: 'object', required: [ 'name' ] } }",
      });
    });
  });

  describe('#validationFetched', function () {
    it('returns the VALIDATION_FETCHED action', function () {
      expect(
        validationFetched({
          validator: '{ name: { $exists: true } }',
          validationAction: 'warn',
          validationLevel: 'off',
        })
      ).to.deep.equal({
        type: VALIDATION_FETCHED,
        validation: {
          validator: '{ name: { $exists: true } }',
          validationAction: 'warn',
          validationLevel: 'off',
        },
      });
    });
  });

  describe('#validationCanceled', function () {
    it('returns the VALIDATION_CANCELED action', function () {
      expect(
        validationCanceled({
          isChanged: false,
          validator: '{ name: { $exists: true } }',
          validationAction: 'warn',
          validationLevel: 'off',
          error: null,
        })
      ).to.deep.equal({
        type: VALIDATION_CANCELED,
        validation: {
          isChanged: false,
          validator: '{ name: { $exists: true } }',
          validationAction: 'warn',
          validationLevel: 'off',
          error: null,
        },
      });
    });
  });

  describe('#validationSaveFailed', function () {
    it('returns the VALIDATION_SAVE_FAILED action', function () {
      expect(
        validationSaveFailed({
          message: 'Validation save failed!',
        })
      ).to.deep.equal({
        type: VALIDATION_SAVE_FAILED,
        error: { message: 'Validation save failed!' },
      });
    });
  });

  describe('#syntaxErrorOccurred', function () {
    it('returns the SYNTAX_ERROR_OCCURRED action', function () {
      expect(syntaxErrorOccurred({ message: 'Syntax Error!' })).to.deep.equal({
        type: SYNTAX_ERROR_OCCURRED,
        syntaxError: { message: 'Syntax Error!' },
      });
    });
  });

  describe('validationFromCollection', function () {
    context('when an error occurs listing the collection', function () {
      it('includes the error', function () {
        const error = new Error('Fake error');
        expect(validationFromCollection(error)).to.deep.equal({
          validationAction: 'error',
          validationLevel: 'strict',
          error,
        });
      });
    });

    context('when the options contains no options', function () {
      it('returns defaults', function () {
        const data = {};
        expect(validationFromCollection(null, data)).to.deep.equal({
          validationAction: 'error',
          validationLevel: 'strict',
        });
      });
    });

    context(
      'when the options contains no validation-related options',
      function () {
        it('returns defaults', function () {
          const data = { validation: {} };
          expect(validationFromCollection(null, data)).to.deep.equal({
            validationAction: 'error',
            validationLevel: 'strict',
          });
        });
      }
    );

    context(
      'when the options contains validation-related options',
      function () {
        it('overrides the defaults', function () {
          const data = {
            validation: {
              validationAction: 'new-validationAction',
              validationLevel: 'new-validationLevel',
              validator: { foo: 'bar' },
            },
          };
          expect(validationFromCollection(null, data)).to.deep.equal({
            validationAction: 'new-validationAction',
            validationLevel: 'new-validationLevel',
            validator: { foo: 'bar' },
          });
        });
      }
    );
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in validation module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.deep.equal({
            validator: '',
            validationAction: 'error',
            validationLevel: 'strict',
            isChanged: false,
            syntaxError: null,
            error: null,
          });
        });
      }
    );

    context('when the action is validationActionChanged', function () {
      it('returns the new state', function () {
        const validation = reducer(undefined, validationActionChanged('warn'));

        expect(validation.validationAction).to.equal('warn');
      });
    });

    context('when the action is validationLevelChanged', function () {
      it('returns the new state', function () {
        const validation = reducer(
          undefined,
          validationLevelChanged('moderate')
        );

        expect(validation.validationLevel).to.equal('moderate');
      });
    });

    context('when the action is validatorChanged', function () {
      it('returns the new state for the simple object', function () {
        const validation = reducer(
          undefined,
          validatorChanged(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`)
        );

        expect(validation.validator).to.equal(`{
          $jsonSchema: { bsonType: 'object', required: [ 'name' ] }
        }`);
      });

      it('returns the new state for the object with regex', function () {
        const validation = reducer(
          undefined,
          validatorChanged(`{
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
        }`)
        );

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

    context('when the action is validationFetched', function () {
      it('returns the new state', function () {
        const validation = reducer(
          undefined,
          validationFetched({
            validator: '{ name: { $exists: true } }',
            validationAction: 'warn',
            validationLevel: 'off',
          })
        );
        const checkedValidator = checkValidator('{ name: { $exists: true } }');
        const validator = javascriptStringify(
          checkedValidator.validator,
          null,
          2
        );

        expect(validation).to.deep.equal({
          isChanged: false,
          prevValidation: {
            validator,
            validationAction: 'warn',
            validationLevel: 'off',
          },
          validator,
          validationAction: 'warn',
          validationLevel: 'off',
          syntaxError: null,
          error: null,
        });
      });
    });

    context('when the action is validationSaveFailed', function () {
      it('returns the new state', function () {
        const validation = reducer(
          undefined,
          validationSaveFailed({
            message: 'Validation save failed!',
          })
        );

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: false,
          syntaxError: null,
          error: { message: 'Validation save failed!' },
        });
      });
    });

    context('when the action is syntaxErrorOccurred', function () {
      it('returns the new state', function () {
        const validation = reducer(
          undefined,
          syntaxErrorOccurred({ message: 'Syntax Error!' })
        );

        expect(validation).to.deep.equal({
          validator: '',
          validationAction: 'error',
          validationLevel: 'strict',
          isChanged: true,
          syntaxError: { message: 'Syntax Error!' },
          error: null,
        });
      });
    });
  });
});
