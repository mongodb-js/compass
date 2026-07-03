import { expect } from 'chai';
import { prettify } from './prettify';

describe('prettify', function () {
  context('json parser', function () {
    it('preserves quoted keys', function () {
      expect(prettify('{ "foo": "bar" }', 'json')).to.equal('{ "foo": "bar" }');
    });

    it('preserves quoted keys with mongodb operators', function () {
      expect(prettify('{ "price": { "$gt": 20 } }', 'json')).to.equal(
        '{ "price": { "$gt": 20 } }'
      );
    });

    it('adds quotes to unquoted keys', function () {
      expect(prettify('{ foo: "bar" }', 'json')).to.equal('{ "foo": "bar" }');
    });
  });

  context('javascript-expression parser', function () {
    it('strips quotes from keys', function () {
      expect(prettify('{ "foo": "bar" }', 'javascript-expression')).to.equal(
        '{ foo: "bar" }'
      );
    });

    it('strips quotes from keys including mongodb operators', function () {
      expect(
        prettify('{ "price": { "$gt": 20 } }', 'javascript-expression')
      ).to.equal('{ price: { $gt: 20 } }');
    });
  });
});
