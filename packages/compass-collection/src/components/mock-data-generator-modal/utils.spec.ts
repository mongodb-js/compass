import { expect } from 'chai';
import { areFakerArgsValid, isValidFakerMethod } from './utils';

import Sinon from 'sinon';
import { faker } from '@faker-js/faker/locale/en';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

describe('Mock Data Generator Utils', () => {
  const sandbox = Sinon.createSandbox();
  const logger = createNoopLogger();

  afterEach(() => {
    sandbox.restore();
  });

  describe('areFakerArgsValid', () => {
    it('returns true for empty array', () => {
      expect(areFakerArgsValid([])).to.be.true;
    });

    it('returns false if top-level args count exceeds max faker args count', () => {
      expect(areFakerArgsValid([1, 2, 3])).to.be.false;
    });

    it('returns true for valid numbers, strings, booleans', () => {
      expect(areFakerArgsValid([1, 'foo'])).to.be.true;
      expect(areFakerArgsValid([true, false])).to.be.true;
    });

    it('returns false for non-finite numbers', () => {
      expect(areFakerArgsValid([Infinity])).to.be.false;
      expect(areFakerArgsValid([NaN])).to.be.false;
    });

    it('returns false for strings exceeding max faker string length', () => {
      const longStr = 'a'.repeat(1001);
      expect(areFakerArgsValid([longStr])).to.be.false;
    });

    it('returns false for numbers that are too large', () => {
      expect(areFakerArgsValid([10001])).to.be.false;
      expect(areFakerArgsValid([-10001])).to.be.false;
      expect(areFakerArgsValid([{ json: { length: 10001 } } as any])).to.be
        .false;
      expect(areFakerArgsValid([{ json: { length: -10001 } } as any])).to.be
        .false;
      expect(
        areFakerArgsValid([{ json: { width: 10001, height: 10001 } } as any])
      ).to.be.false;
    });

    it('returns true for nested valid arrays', () => {
      expect(
        areFakerArgsValid([
          [1, 'foo', true],
          [2, false],
        ])
      ).to.be.true;
    });

    it('returns false for nested arrays exceeding max array length', () => {
      const nested = [Array(11).fill(1)]; // nested array has 11 elements > MAX_ARRAY_LENGTH (10)
      expect(areFakerArgsValid(nested)).to.be.false;
    });

    it('returns true for exactly 2 top-level arguments', () => {
      expect(areFakerArgsValid(['arg1', 'arg2'])).to.be.true;
    });

    it('returns true for nested arrays within the limit', () => {
      const nested = [Array(10).fill(1)];
      expect(areFakerArgsValid(nested)).to.be.true;
    });

    it('returns true for valid object with json property', () => {
      const obj = { json: JSON.stringify({ a: 1, b: 'foo', c: true }) };
      expect(areFakerArgsValid([obj])).to.be.true;
    });

    it('returns false for object with invalid json property', () => {
      const obj = { json: '{invalid json}' };
      expect(areFakerArgsValid([obj])).to.be.false;
    });

    it('returns false for object with json property containing invalid values', () => {
      const obj = { json: JSON.stringify({ a: Infinity }) };
      expect(areFakerArgsValid([obj])).to.be.false;
    });

    it('returns false for unrecognized argument types', () => {
      expect(areFakerArgsValid([undefined as any])).to.be.false;
      expect(areFakerArgsValid([null as any])).to.be.false;
      expect(areFakerArgsValid([(() => {}) as any])).to.be.false;
    });

    it('returns true for deeply nested valid structures', () => {
      const obj = {
        json: JSON.stringify({
          a: [1, { json: JSON.stringify({ b: 'foo' }) }],
        }),
      };
      expect(areFakerArgsValid([obj])).to.be.true;
    });

    it('returns false for deeply nested invalid structures', () => {
      const obj = {
        json: JSON.stringify({
          a: [1, { json: JSON.stringify({ b: Infinity }) }],
        }),
      };
      expect(areFakerArgsValid([obj])).to.be.false;
    });

    it('returns false for deeply nested invalid structures with max depth', () => {
      const obj = {
        json: JSON.stringify({
          a: [
            1,
            {
              json: JSON.stringify({
                b: 2,
                c: {
                  json: JSON.stringify({
                    d: 3,
                  }),
                },
              }),
            },
          ],
        }),
      };
      expect(areFakerArgsValid([obj])).to.be.false;
    });
  });

  describe('isValidFakerMethod', () => {
    it('returns false for invalid method format', () => {
      sandbox.stub(faker.internet, 'email');

      expect(isValidFakerMethod('invalidMethod', [], logger)).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
      expect(
        isValidFakerMethod('internet.email.extra', [], logger)
      ).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
    });

    it('returns false for non-existent faker module', () => {
      expect(isValidFakerMethod('notamodule.email', [], logger)).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
    });

    it('returns false for non-existent faker method', () => {
      expect(
        isValidFakerMethod('internet.notamethod', [], logger)
      ).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
    });

    it('returns true for valid method without arguments', () => {
      sandbox.stub(faker.internet, 'email').returns('test@test.com');

      const result = isValidFakerMethod('internet.email', [], logger);
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal([]);
    });

    it('returns true for valid method with valid arguments', () => {
      sandbox.stub(faker.person, 'firstName');

      const result = isValidFakerMethod('person.firstName', ['female'], logger);
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal(['female']);
    });

    it('returns true for valid method with no args if args are invalid but fallback works', () => {
      sandbox.stub(faker.internet, 'email').returns('test@test.com');

      const result = isValidFakerMethod('internet.email', [], logger);
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal([]);
    });

    it('returns true valid method with invalid arguments and strips args', () => {
      sandbox.stub(faker.date, 'month').returns('February');

      const result = isValidFakerMethod(
        'date.month',
        [{ foo: 'bar' } as any],
        logger
      );
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal([]);
    });

    it('returns false for helpers methods except arrayElement', () => {
      expect(isValidFakerMethod('helpers.fake', [], logger)).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
      expect(isValidFakerMethod('helpers.slugify', [], logger)).to.deep.equal({
        isValid: false,
        fakerArgs: [],
      });
    });

    it('returns true for helpers.arrayElement with valid arguments', () => {
      sandbox.stub(faker.helpers, 'arrayElement').returns('a');

      const arr = ['a', 'b', 'c'];
      const result = isValidFakerMethod('helpers.arrayElement', [arr], logger);
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal([arr]);
    });

    it('returns false for helpers.arrayElement with invalid arguments', () => {
      // Exceeding max args length
      const arr = Array(11).fill('x');
      const result = isValidFakerMethod('helpers.arrayElement', [arr], logger);
      expect(result.isValid).to.be.false;
      expect(result.fakerArgs).to.deep.equal([]);
    });

    it('returns true for valid method with invalid fakerArgs and strips args', () => {
      sandbox.stub(faker.person, 'firstName').returns('a');

      // Passing Infinity as argument
      const result = isValidFakerMethod('person.firstName', [Infinity], logger);
      expect(result.isValid).to.be.true;
      expect(result.fakerArgs).to.deep.equal([]);
    });

    it('returns false when calling a faker method fails', () => {
      sandbox
        .stub(faker.person, 'firstName')
        .throws(new Error('Invalid faker method'));

      const result = isValidFakerMethod('person.firstName', [], logger);
      expect(result.isValid).to.be.false;
      expect(result.fakerArgs).to.deep.equal([]);
    });
  });
});
