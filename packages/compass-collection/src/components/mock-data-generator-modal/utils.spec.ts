import { expect } from 'chai';
import { areFakerArgsValid, isValidFakerMethod } from './utils';

describe('Mock Data Generator Utils', function () {
  describe('areFakerArgsValid', () => {
    it('returns true for empty array', () => {
      expect(areFakerArgsValid([])).to.be.true;
    });

    it('returns false if array length exceeds max faker args length', () => {
      const arr = Array(11).fill(1);
      expect(areFakerArgsValid(arr)).to.be.false;
    });

    it('returns true for valid numbers, strings, booleans', () => {
      expect(areFakerArgsValid([1, 'foo', true, false, 0])).to.be.true;
    });

    it('returns false for non-finite numbers', () => {
      expect(areFakerArgsValid([Infinity])).to.be.false;
      expect(areFakerArgsValid([NaN])).to.be.false;
    });

    it('returns false for strings exceeding max faker string length', () => {
      const longStr = 'a'.repeat(1001);
      expect(areFakerArgsValid([longStr])).to.be.false;
    });

    it('returns true for nested valid arrays', () => {
      expect(
        areFakerArgsValid([
          [1, 'foo', true],
          [2, false],
        ])
      ).to.be.true;
    });

    it('returns false for nested arrays exceeding max faker args length', () => {
      const nested = [Array(11).fill(1)];
      expect(areFakerArgsValid(nested)).to.be.false;
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

    describe('isValidFakerMethod', () => {
      it('returns false for invalid method format', () => {
        expect(isValidFakerMethod('invalidMethod', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
        expect(isValidFakerMethod('internet.email.extra', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
      });

      it('returns false for non-existent faker module', () => {
        expect(isValidFakerMethod('notamodule.email', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
      });

      it('returns false for non-existent faker method', () => {
        expect(isValidFakerMethod('internet.notamethod', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
      });

      it('returns true for valid method without arguments', () => {
        const result = isValidFakerMethod('internet.email', []);
        expect(result.isValid).to.be.true;
        expect(result.fakerArgs).to.deep.equal([]);
      });

      it('returns true for valid method with valid arguments', () => {
        // name.firstName takes optional gender argument
        const result = isValidFakerMethod('name.firstName', ['female']);
        expect(result.isValid).to.be.true;
        expect(result.fakerArgs).to.deep.equal(['female']);
      });

      it('returns true for valid method with no args if args are invalid but fallback works', () => {
        // internet.email does not take arguments, so passing one should fallback to []
        const result = isValidFakerMethod('internet.email', []);
        expect(result.isValid).to.be.true;
        expect(result.fakerArgs).to.deep.equal([]);
      });

      it('returns false for valid method with invalid arguments and fallback fails', () => {
        // date.month expects at most one argument, passing an object will fail both attempts
        const result = isValidFakerMethod('date.month', [
          { foo: 'bar' } as any,
        ]);
        expect(result.isValid).to.be.false;
        expect(result.fakerArgs).to.deep.equal([]);
      });

      it('returns false for helpers methods except arrayElement', () => {
        expect(isValidFakerMethod('helpers.fake', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
        expect(isValidFakerMethod('helpers.slugify', [])).to.deep.equal({
          isValid: false,
          fakerArgs: [],
        });
      });

      it('returns true for helpers.arrayElement with valid arguments', () => {
        const arr = ['a', 'b', 'c'];
        const result = isValidFakerMethod('helpers.arrayElement', [arr]);
        expect(result.isValid).to.be.true;
        expect(result.fakerArgs).to.deep.equal([arr]);
      });

      it('returns false for helpers.arrayElement with invalid arguments', () => {
        // Exceeding max args length
        const arr = Array(11).fill('x');
        const result = isValidFakerMethod('helpers.arrayElement', [arr]);
        expect(result.isValid).to.be.false;
        expect(result.fakerArgs).to.deep.equal([]);
      });

      it('returns false for method with invalid fakerArgs', () => {
        // Passing Infinity as argument
        const result = isValidFakerMethod('name.firstName', [Infinity]);
        expect(result.isValid).to.be.false;
        expect(result.fakerArgs).to.deep.equal([]);
      });
    });
  });
});
