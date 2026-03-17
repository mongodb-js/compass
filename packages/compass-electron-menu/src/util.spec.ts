import { expect } from 'chai';
import { uuid, getObjectId } from './util';

describe('util.ts', function () {
  describe('uuid()', function () {
    it('returns a string matching UUID v4 format', function () {
      const value = uuid();
      expect(value).to.be.a('string');
      expect(value).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('getObjectId()', function () {
    it('returns stable id for the same object', function () {
      const obj = {};
      const first = getObjectId(obj);
      const second = getObjectId(obj);
      expect(first).to.equal(second);
    });

    it('returns incremental ids for different objects', function () {
      const obj1 = {};
      const obj2 = {};
      const id1 = getObjectId(obj1);
      const id2 = getObjectId(obj2);
      expect(id2).to.equal(id1 + 1);
    });
  });
});
