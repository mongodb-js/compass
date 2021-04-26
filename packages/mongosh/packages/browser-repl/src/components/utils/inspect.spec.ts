import { bson } from '@mongosh/service-provider-core';
import { expect } from 'chai';
import { inspect } from './inspect';

describe('inspect', () => {
  context('with simple types', () => {
    it('inspects numbers', () => {
      expect(
        inspect(1)
      ).to.equal('1');
    });

    it('inspects strings', () => {
      expect(
        inspect('123')
      ).to.equal('\'123\'');
    });

    it('inspects booleans', () => {
      expect(
        inspect(true)
      ).to.equal('true');

      expect(
        inspect(false)
      ).to.equal('false');
    });

    it('inspects null', () => {
      expect(
        inspect(null)
      ).to.equal('null');
    });

    it('inspects undefined', () => {
      expect(
        inspect(undefined)
      ).to.equal('undefined');
    });

    it('inspects Dates', () => {
      expect(
        inspect(new Date('2020-11-06T14:26:29.131Z'))
      ).to.equal('2020-11-06T14:26:29.131Z');
    });
  });

  context('with BSON types', () => {
    it('inspects ObjectId', () => {
      expect(
        inspect(new bson.ObjectId('0000007b3db627730e26fd0b'))
      ).to.equal('ObjectId("0000007b3db627730e26fd0b")');
    });

    it('inspects UUID', () => {
      expect(
        inspect(new bson.Binary('abcdefghiklmnopq', 4))
      ).to.equal('UUID("61626364-6566-6768-696b-6c6d6e6f7071")');
    });

    it('inspects nested ObjectId', () => {
      expect(
        inspect({ p: new bson.ObjectId('0000007b3db627730e26fd0b') })
      ).to.equal('{ p: ObjectId("0000007b3db627730e26fd0b") }');
    });

    it('inspects nested UUID', () => {
      expect(
        inspect({ p: new bson.Binary('abcdefghiklmnopq', 4) })
      ).to.equal('{ p: UUID("61626364-6566-6768-696b-6c6d6e6f7071") }');
    });

    it('does not require BSON types to be instances of the current bson library', () => {
      expect(
        inspect({
          _bsontype: 'ObjectID',
          toHexString() { return '0000007b3db627730e26fd0b'; }
        })
      ).to.equal('ObjectId("0000007b3db627730e26fd0b")');
    });
  });

  context('with objects', () => {
    context('when collapsed', () => {
      it('formats objects on one line', () => {
        expect(
          inspect({ x: 1, y: 2 })
        ).to.equal('{ x: 1, y: 2 }');
      });
    });
  });

  context('with frozen objects with _bsontype properties', () => {
    expect(
      () => inspect(Object.freeze({
        _bsontype: 'ObjectID',
        toHexString() { return '0000007b3db627730e26fd0b'; }
      }))
    ).not.to.throw;
  });
});
