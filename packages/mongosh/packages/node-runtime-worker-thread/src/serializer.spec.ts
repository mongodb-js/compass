import { expect } from 'chai';
import {
  serializeError,
  deserializeError,
  serializeEvaluationResult,
  deserializeEvaluationResult,
  SerializedResultTypes
} from './serializer';

describe('serializer', () => {
  describe('serializeError', () => {
    it('serializer Errot to plain object', () => {
      const serialized = serializeError(new TypeError('Uh-oh'));

      expect(serialized).to.have.own.property('name', 'TypeError');
      expect(serialized).to.have.own.property('message', 'Uh-oh');
      expect(serialized).to.have.own.property('stack');
    });
  });

  describe('deserializeError', () => {
    it('creates an instance of an error from plain object', () => {
      const err = deserializeError({ name: 'CustomError', message: 'Error!' });

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.own.property('name', 'CustomError');
      expect(err).to.have.own.property('message', 'Error!');
    });
  });

  describe('serializeEvaluationResult', () => {
    it('should return primitive values as-is', () => {
      const serialized = serializeEvaluationResult({
        type: 'primitive',
        printable: 123
      });

      expect(serialized).to.have.property('type', 'primitive');
      expect(serialized).to.have.property('printable', 123);
    });

    it('should serialize error values', () => {
      const serialized = serializeEvaluationResult({
        type: 'error',
        printable: new SyntaxError('Ooops!')
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

    it('should return inspect result for non shell-api result types (type === null)', () => {
      const serialized = serializeEvaluationResult({
        type: null,
        printable: function abc() {}
      });

      expect(serialized).to.have.property(
        'type',
        SerializedResultTypes.InspectResult
      );
      expect(serialized).to.have.property('printable', '[Function: abc]');
    });

    it('should serialize shell-api result type', () => {
      const serialized = serializeEvaluationResult({
        type: 'TotallyRealShellApiType',
        printable: { foo: 'bar' }
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
          foo: 'bar'
        });
    });
  });

  describe('deserializeEvaluationResult', () => {
    it('should deserialize SerializedErrorResult', () => {
      const deserialized = deserializeEvaluationResult({
        type: SerializedResultTypes.SerializedErrorResult,
        printable: { name: 'TypeError', message: 'Uh-oh' }
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

    it('should deserialize SerializedShellApiResult', () => {
      const deserialized = deserializeEvaluationResult({
        type: SerializedResultTypes.SerializedShellApiResult,
        printable: {
          origType: 'ShellApiResult',
          serializedValue: { foo: 'bar' }
        }
      });

      expect(deserialized).to.have.property('type', 'ShellApiResult');
      expect(deserialized)
        .to.have.property('printable')
        .deep.equal({ foo: 'bar' });
    });

    it('should return unknown types as-is', () => {
      const deserialized = deserializeEvaluationResult({
        type: 'SomethingSomethingResultType',
        printable: 'Hello'
      });

      expect(deserialized).to.have.property('type', 'SomethingSomethingResultType');
      expect(deserialized).to.have.property('printable', 'Hello');
    });
  });
});
