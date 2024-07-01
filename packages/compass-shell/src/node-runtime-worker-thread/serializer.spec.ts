import type { DevtoolsConnectOptions } from '@mongosh/service-provider-server/lib/cli-service-provider';
import { expect } from 'chai';
import { UUID, Long } from 'bson';
import {
  serializeError,
  deserializeError,
  serializeEvaluationResult,
  deserializeEvaluationResult,
  SerializedResultTypes,
  serializeConnectOptions,
  deserializeConnectOptions,
} from './serializer';
import { dummyOptions } from './index.spec';

describe('serializer', function () {
  describe('serializeError', function () {
    it('serializer Error to plain object', function () {
      const serialized = serializeError(new TypeError('Uh-oh'));

      expect(serialized).to.have.own.property('name', 'TypeError');
      expect(serialized).to.have.own.property('message', 'Uh-oh');
      expect(serialized).to.have.own.property('stack');
    });
  });

  describe('deserializeError', function () {
    it('creates an instance of an error from plain object', function () {
      const err = deserializeError({ name: 'CustomError', message: 'Error!' });

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.own.property('name', 'CustomError');
      expect(err).to.have.own.property('message', 'Error!');
    });
  });

  describe('serializeEvaluationResult', function () {
    it('should return primitive values as-is', function () {
      const serialized = serializeEvaluationResult({
        type: 'primitive',
        printable: 123,
      });

      expect(serialized).to.have.property('type', 'primitive');
      expect(serialized).to.have.property('printable', 123);
    });

    it('should serialize error values', function () {
      const serialized = serializeEvaluationResult({
        type: 'error',
        printable: new SyntaxError('Ooops!'),
      });

      expect(serialized).to.have.property(
        'type',
        SerializedResultTypes.SerializedErrorResult
      );
      expect(serialized).to.have.property('printable').not.instanceof(Error);
      expect(serialized).to.have.nested.property(
        'printable.name',
        'SyntaxError'
      );
      expect(serialized).to.have.nested.property('printable.message', 'Ooops!');
    });

    it('should return inspect result for non shell-api result types (type === null)', function () {
      const serialized = serializeEvaluationResult({
        type: null,
        printable: function abc() {},
      });

      expect(serialized).to.have.property(
        'type',
        SerializedResultTypes.InspectResult
      );
      expect(serialized).to.have.property('printable', '[Function: abc]');
    });

    it('should serialize shell-api result type', function () {
      const serialized = serializeEvaluationResult({
        type: 'TotallyRealShellApiType',
        printable: { foo: 'bar' },
      });

      expect(serialized).to.have.property(
        'type',
        SerializedResultTypes.SerializedShellApiResult
      );
      expect(serialized).to.have.nested.property(
        'printable.origType',
        'TotallyRealShellApiType'
      );
      expect(serialized)
        .to.have.nested.property('printable.serializedValue')
        .deep.equal({
          foo: 'bar',
        });
    });
  });

  describe('deserializeEvaluationResult', function () {
    it('should deserialize SerializedErrorResult', function () {
      const deserialized = deserializeEvaluationResult({
        type: SerializedResultTypes.SerializedErrorResult,
        printable: { name: 'TypeError', message: 'Uh-oh' },
      });

      expect(deserialized).to.have.property('printable').be.instanceof(Error);
      expect(deserialized).to.have.nested.property(
        'printable.name',
        'TypeError'
      );
      expect(deserialized).to.have.nested.property(
        'printable.message',
        'Uh-oh'
      );
    });

    it('should deserialize SerializedShellApiResult', function () {
      const deserialized = deserializeEvaluationResult({
        type: SerializedResultTypes.SerializedShellApiResult,
        printable: {
          origType: 'ShellApiResult',
          serializedValue: { foo: 'bar' },
        },
      });

      expect(deserialized).to.have.property('type', 'ShellApiResult');
      expect(deserialized)
        .to.have.property('printable')
        .deep.equal({ foo: 'bar' });
    });

    it('should return unknown types as-is', function () {
      const deserialized = deserializeEvaluationResult({
        type: 'SomethingSomethingResultType',
        printable: 'Hello',
      });

      expect(deserialized).to.have.property(
        'type',
        'SomethingSomethingResultType'
      );
      expect(deserialized).to.have.property('printable', 'Hello');
    });
  });

  describe('connection options', function () {
    it('should serialize and deserialize FLE1 connection options', function () {
      const options: DevtoolsConnectOptions = {
        ...dummyOptions,
        autoEncryption: {
          schemaMap: {
            'hr.employees': {
              bsonType: 'object',
              properties: {
                taxid: {
                  encrypt: {
                    keyId: [new UUID('a21ddc6a-8806-4384-9fdf-8ba02a767b5f')],
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
                  },
                },
              },
            },
          },
        },
      };

      const serialized = serializeConnectOptions(options);

      expect(serialized).to.deep.equal({
        ...dummyOptions,
        autoEncryption: {
          schemaMap: {
            'hr.employees': {
              bsonType: 'object',
              properties: {
                taxid: {
                  encrypt: {
                    keyId: [
                      {
                        $binary: {
                          base64: 'oh3caogGQ4Sf34ugKnZ7Xw==',
                          subType: '04',
                        },
                      },
                    ],
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
                  },
                },
              },
            },
          },
        },
      });

      expect(deserializeConnectOptions(serialized)).to.deep.equal(options);
    });

    it('should serialize and deserialize FLE2 connection options', function () {
      const options: DevtoolsConnectOptions = {
        ...dummyOptions,
        autoEncryption: {
          encryptedFieldsMap: {
            'hr.employees': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: new UUID('fd6275d7-9260-4e6c-a86b-68ec5240814a'),
                  bsonType: 'string',
                  queries: { queryType: 'equality', contention: new Long(0) },
                },
              ],
            },
          },
        },
      };

      const serialized = serializeConnectOptions(options);

      expect(serialized).to.deep.equal({
        ...dummyOptions,
        autoEncryption: {
          encryptedFieldsMap: {
            'hr.employees': {
              fields: [
                {
                  path: 'phoneNumber',
                  keyId: {
                    $binary: {
                      base64: '/WJ115JgTmyoa2jsUkCBSg==',
                      subType: '04',
                    },
                  },
                  bsonType: 'string',
                  queries: {
                    queryType: 'equality',
                    contention: { $numberLong: '0' },
                  },
                },
              ],
            },
          },
        },
      });

      expect(deserializeConnectOptions(serialized)).to.deep.equal(options);
    });
  });
});
