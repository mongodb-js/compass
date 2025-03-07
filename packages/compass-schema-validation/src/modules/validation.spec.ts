import { expect } from 'chai';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { parseFilter } from 'mongodb-query-parser';

import reducer, {
  ValidationActions,
  validationFetched,
  validationCanceled,
  validationSaveFailed,
} from './validation';

describe('validation module', function () {
  describe('#validationFetched', function () {
    it('returns the VALIDATION_FETCHED action', function () {
      expect(
        validationFetched({
          validator: '{ name: { $exists: true } }',
          validationAction: 'warn',
          validationLevel: 'off',
        })
      ).to.deep.equal({
        type: ValidationActions.ValidationFetched,
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
        type: ValidationActions.CancelChangeValidator,
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
        validationSaveFailed(new Error('Validation save failed!'))
      ).to.deep.equal({
        type: ValidationActions.ValidationSaveFailed,
        error: { message: 'Validation save failed!' },
      });
    });
  });

  describe('#reducer', function () {
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
        const checkedValidator = parseFilter('{ name: { $exists: true } }');
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
          validationSaveFailed(new Error('Validation save failed!'))
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
  });
});
