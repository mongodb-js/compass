import bsonCSV from './bson-csv';
// import bson from 'bson';

// TODO: lucas: probably dumb but think about that later.

describe('bson-csv', () => {
  describe('String', () => {
    it('should work', () => {
      expect(bsonCSV.String.fromString(1)).to.equal('1');
    });
  });
  describe('Boolean', () => {
    it('should deserialize falsy values', () => {
      expect(bsonCSV.Boolean.fromString('')).to.equal(false);
      expect(bsonCSV.Boolean.fromString('false')).to.equal(false);
      expect(bsonCSV.Boolean.fromString('FALSE')).to.equal(false);
      // expect(bsonCSV.Boolean.fromString('0')).to.equal(false);
    });
    it('should deserialize non-falsy values', () => {
      // expect(bsonCSV.Boolean.fromString('1')).to.equal(true);
      expect(bsonCSV.Boolean.fromString('true')).to.equal(true);
      expect(bsonCSV.Boolean.fromString('TRUE')).to.equal(true);
    });
  });
  describe('Number', () => {
    it('should work', () => {
      expect(bsonCSV.Number.fromString('1')).to.equal(1);
    });
  });
  describe('ObjectId', () => {
    it('should work', () => {
      const oid = '5dd080acc15c0d5ee3ab6ad2';
      const deserialized = bsonCSV.ObjectId.fromString(oid);
      expect(deserialized._bsontype).to.equal('ObjectID');
      expect(deserialized.toString()).to.equal('5dd080acc15c0d5ee3ab6ad2');
    });
  });
});
