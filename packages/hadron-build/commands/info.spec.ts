import { expect } from 'chai';
import { serialize, toTable } from './info';

describe('commands/info', function () {
  describe('serialize', function () {
    it('omits function values', function () {
      const result = serialize({ a: 1, b: () => {}, c: 'hello' });
      expect(result).to.deep.equal({ a: 1, c: 'hello' });
    });

    it('omits undefined values', function () {
      const result = serialize({ a: 1, b: undefined });
      expect(result).to.deep.equal({ a: 1 });
    });

    it('omits regexp values', function () {
      const result = serialize({ a: 1, b: /regex/ });
      expect(result).to.deep.equal({ a: 1 });
    });

    it('keeps non-function, non-undefined values', function () {
      const result = serialize({ a: 1, b: 'str', c: true, d: [1, 2] });
      expect(result).to.deep.equal({ a: 1, b: 'str', c: true, d: [1, 2] });
    });
  });

  describe('toTable', function () {
    it('returns a string', function () {
      const result = toTable({ key: 'value' });
      expect(result).to.be.a('string');
    });

    it('includes keys and values from input', function () {
      const result = toTable({ myKey: 'myValue' });
      expect(result).to.include('myKey');
    });
  });
});
