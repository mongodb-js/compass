import { expect } from 'chai';
import { serialize } from './info';

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
});
