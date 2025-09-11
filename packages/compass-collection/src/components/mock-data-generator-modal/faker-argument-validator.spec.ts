import { expect } from 'chai';
import {
  validateFakerArguments,
  validateFakerSchemaMapping,
  validateFakerSchemaMappings,
} from './faker-argument-validator';

describe('FakerArgumentValidator', () => {
  describe('validateFakerArguments', () => {
    it('validates valid arguments for string methods', () => {
      const result = validateFakerArguments('string.alpha', [10]);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.undefined;
      expect(result.sanitizedArgs).to.deep.equal([10]);
    });

    it('validates valid arguments for number methods', () => {
      const result = validateFakerArguments('number.int', [
        { min: 1, max: 100 },
      ]);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('validates valid arguments for date methods', () => {
      const result = validateFakerArguments('date.between', [
        { from: '2020-01-01', to: '2025-01-01' },
      ]);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('rejects invalid arguments that cause faker errors', () => {
      const result = validateFakerArguments('string.alpha', [
        Number.MAX_SAFE_INTEGER,
      ]);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('Invalid array length');
    });

    it('rejects invalid date ranges', () => {
      const result = validateFakerArguments('date.between', [
        { from: '2025-01-01', to: '2020-01-01' },
      ]);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('from` date must be before `to` date');
    });

    it('rejects invalid number ranges', () => {
      const result = validateFakerArguments('number.int', [
        { min: 10, max: 5 },
      ]);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('Max 5 should be greater than min 10');
    });

    it('handles non-existent faker methods', () => {
      const result = validateFakerArguments('nonexistent.method', []);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('does not exist');
    });

    it('handles invalid method format', () => {
      const result = validateFakerArguments('invalidformat', []);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('Invalid faker method format');
    });

    it('validates methods with no arguments', () => {
      const result = validateFakerArguments('person.firstName', []);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('validates complex object arguments', () => {
      const result = validateFakerArguments('location.nearbyGPSCoordinate', [
        { origin: [40.7128, -74.006], radius: 1000 },
      ]);
      expect(result.isValid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('handles type errors gracefully', () => {
      const result = validateFakerArguments('string.alpha', [null]);
      expect(result.isValid).to.be.false;
      expect(result.error).to.include('Cannot read properties of null');
    });

    it('respects custom timeout settings', () => {
      const result = validateFakerArguments('person.firstName', [], {
        timeoutMs: 50,
      });
      expect(result.isValid).to.be.true;
      expect(result.executionTimeMs).to.be.a('number');
      expect(result.executionTimeMs).to.be.lessThan(50);
    });

    it('includes execution time in results', () => {
      const result = validateFakerArguments('string.alpha', [10]);
      expect(result.executionTimeMs).to.be.a('number');
      expect(result.executionTimeMs).to.be.greaterThanOrEqual(0);
    });

    it('logs performance when requested', () => {
      const logs: string[] = [];
      const mockLogger = { debug: (msg: string) => logs.push(msg) };

      const result = validateFakerArguments('person.firstName', [], {
        logPerformance: true,
        logger: mockLogger,
      });

      expect(result.isValid).to.be.true;
      expect(logs).to.have.length(1);
      expect(logs[0]).to.include('Faker validation: person.firstName took');
    });
  });

  describe('validateFakerSchemaMapping', () => {
    it('validates a complete mapping with valid arguments', () => {
      const mapping = {
        fieldPath: 'name',
        fakerMethod: 'person.firstName',
        fakerArgs: [],
        mongoType: 'string',
        isArray: false,
        probability: 1.0,
      };

      const result = validateFakerSchemaMapping(mapping);
      expect(result.validationError).to.be.undefined;
      expect(result.fakerMethod).to.equal('person.firstName');
    });

    it('handles mappings with invalid arguments', () => {
      const mapping = {
        fieldPath: 'age',
        fakerMethod: 'number.int',
        fakerArgs: [{ min: 10, max: 5 }], // Invalid range
        mongoType: 'number',
        isArray: false,
        probability: 1.0,
      };

      const result = validateFakerSchemaMapping(mapping);
      expect(result.validationError).to.include(
        'Max 5 should be greater than min 10'
      );
      expect(result.fakerArgs).to.deep.equal([]); // Cleared invalid args
    });

    it('skips validation for unrecognized methods', () => {
      const mapping = {
        fieldPath: 'unknown',
        fakerMethod: 'Unrecognized',
        fakerArgs: ['any', 'args'],
        mongoType: 'string',
        isArray: false,
        probability: 1.0,
      };

      const result = validateFakerSchemaMapping(mapping);
      expect(result.validationError).to.be.undefined;
      expect(result.fakerArgs).to.deep.equal(['any', 'args']); // Preserved
    });
  });

  describe('validateFakerSchemaMappings', () => {
    it('validates multiple mappings', () => {
      const mappings = [
        {
          fieldPath: 'name',
          fakerMethod: 'person.firstName',
          fakerArgs: [],
          mongoType: 'string',
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'age',
          fakerMethod: 'number.int',
          fakerArgs: [{ min: 1, max: 100 }],
          mongoType: 'number',
          isArray: false,
          probability: 1.0,
        },
        {
          fieldPath: 'invalid',
          fakerMethod: 'string.alpha',
          fakerArgs: [Number.MAX_SAFE_INTEGER],
          mongoType: 'string',
          isArray: false,
          probability: 1.0,
        },
      ];

      const results = validateFakerSchemaMappings(mappings);

      expect(results).to.have.length(3);
      expect(results[0].validationError).to.be.undefined;
      expect(results[1].validationError).to.be.undefined;
      expect(results[2].validationError).to.include('Invalid array length');
    });
  });
});
