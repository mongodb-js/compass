import { expect } from 'chai';
import { Binary, UUID } from 'bson';
import { toJSString } from 'mongodb-query-parser';

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
            isSaving: false,
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
        expect(validation.isChanged).to.equal(true);
      });
    });

    context('when the action is validationLevelChanged', function () {
      it('returns the new state', function () {
        const validation = reducer(
          undefined,
          validationLevelChanged('moderate')
        );

        expect(validation.validationLevel).to.equal('moderate');
        expect(validation.isChanged).to.equal(true);
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
        const validator = toJSString({ name: { $exists: true } }, 2);

        expect(validation).to.deep.equal({
          isChanged: false,
          isSaving: false,
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

      it('preserves BSON types so that the validator stays queryable (COMPASS-4989)', function () {
        const keyId = new UUID(
          '48b481f0-31c7-4b2d-81d4-987ac69262a9'
        ).toBinary();
        const encrypt = {
          encrypt: {
            keyId: [keyId],
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          },
        };
        const validation = reducer(
          undefined,
          validationFetched({
            validator: {
              $jsonSchema: {
                bsonType: 'object',
                properties: {
                  some_item_needing_encryption: encrypt,
                  anArrayNeedingEncyrptionInside: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'object',
                      properties: { encryptId: encrypt },
                    },
                  },
                },
              },
            },
            validationAction: 'error',
            validationLevel: 'strict',
          })
        );

        expect(validation.validator).to.include(
          "UUID('48b481f0-31c7-4b2d-81d4-987ac69262a9')"
        );
        expect(validation.validator).to.not.include('$binary');

        const { syntaxError, validator } = checkValidator(validation.validator);
        expect(syntaxError).to.equal(null);

        const properties = (validator as any).$jsonSchema.properties;
        for (const parsedKeyId of [
          properties.some_item_needing_encryption.encrypt.keyId[0],
          properties.anArrayNeedingEncyrptionInside.items.properties.encryptId
            .encrypt.keyId[0],
        ]) {
          expect(parsedKeyId).to.be.instanceOf(Binary);
          expect(parsedKeyId.sub_type).to.equal(Binary.SUBTYPE_UUID);
          expect(parsedKeyId.toString('base64')).to.equal(
            keyId.toString('base64')
          );
        }
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
          isSaving: false,
          syntaxError: null,
          error: {
            message: 'Validation save failed!',
          },
        });
      });
    });
  });
});
