import { expect } from 'chai';
import { stringify as javascriptStringify } from 'javascript-stringify';

import reducer, {
  checkValidator,
  validationActionChanged,
  validationLevelChanged,
  validatorChanged,
  validationFetched,
  validationSaveFailed,
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
            validator: { name: { $exists: true } },
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
          error: {
            message: 'Validation save failed!',
          },
        });
      });
    });
  });
});
