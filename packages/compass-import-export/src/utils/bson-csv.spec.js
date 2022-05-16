import bsonCSV, {
  serialize,
  detectType,
  getTypeDescriptorForValue,
} from './bson-csv';
import { EJSON, ObjectID, Long, BSONRegExp } from 'bson';
import { expect } from 'chai';

// TODO: lucas: probably dumb but think about that later.

describe('bson-csv', function () {
  describe('Native', function () {
    describe('String', function () {
      it('should stringify value:<Number>', function () {
        expect(bsonCSV.String.fromString(1)).to.equal('1');
      });
      it('should stringify value:<String>', function () {
        expect(bsonCSV.String.fromString('1')).to.equal('1');
      });
    });
    describe('Boolean', function () {
      it('should deserialize falsy values', function () {
        expect(bsonCSV.Boolean.fromString('')).to.equal(false);
        expect(bsonCSV.Boolean.fromString('false')).to.equal(false);
        expect(bsonCSV.Boolean.fromString('FALSE')).to.equal(false);
        // expect(bsonCSV.Boolean.fromString('0')).to.equal(false);
      });
      it('should deserialize non-falsy values', function () {
        // expect(bsonCSV.Boolean.fromString('1')).to.equal(true);
        expect(bsonCSV.Boolean.fromString('true')).to.equal(true);
        expect(bsonCSV.Boolean.fromString('TRUE')).to.equal(true);
      });
      it('should serialize as a string', function () {
        expect(serialize({ value: false })).to.deep.equal({
          value: 'false',
        });

        expect(serialize({ value: true })).to.deep.equal({
          value: 'true',
        });
      });
      it('should not auto-convert other values', function () {
        expect(serialize({ value: 'false' })).to.deep.equal({
          value: 'false',
        });
        expect(serialize({ value: 'FALSE' })).to.deep.equal({
          value: 'FALSE',
        });
        expect(serialize({ value: 'true' })).to.deep.equal({
          value: 'true',
        });
        expect(serialize({ value: 'TRUE' })).to.deep.equal({
          value: 'TRUE',
        });
        expect(serialize({ value: '0' })).to.deep.equal({
          value: '0',
        });
        expect(serialize({ value: '1' })).to.deep.equal({
          value: '1',
        });
      });
    });
    describe('Number', function () {
      it('should serialize numbers as strings', function () {
        expect(serialize({ value: 0 })).to.deep.equal({
          value: '0',
        });
        expect(serialize({ value: 1 })).to.deep.equal({
          value: '1',
        });
        expect(serialize({ value: -1.35 })).to.deep.equal({
          value: '-1.35',
        });
      });
      it('should deserialize numbers from strings', function () {
        expect(bsonCSV.Number.fromString('1')).to.equal(1);
      });
    });
    describe('Date', function () {
      /**
       * Regression test for https://jira.mongodb.org/browse/COMPASS-4164
       */
      it('should serialize dates as ISO strings', function () {
        const doc = EJSON.deserialize({
          _id: '{47844C7F-544C-8986-E050-A8C063056488}',
          Price: 925000,
          'Date of Transfer': '2017-01-13T00:00:00Z',
        });
        expect(serialize(doc)).to.deep.equal({
          _id: '{47844C7F-544C-8986-E050-A8C063056488}',
          Price: '925000',
          'Date of Transfer': '2017-01-13T00:00:00Z',
        });
      });
      it('should detect value:<Date> as Date', function () {
        expect(detectType(new Date('2020-03-19T20:02:48.406Z'))).to.be.equal(
          'Date'
        );
      });
      it('should not lose precision', function () {
        expect(
          bsonCSV.Date.fromString(new Date('2020-03-19T20:02:48.406Z'))
        ).to.deep.equal(new Date('2020-03-19T20:02:48.406Z'));
      });
      it('should serialize as a string', function () {
        expect(serialize({ value: new BSONRegExp('^mongodb') })).to.deep.equal({
          value: '/^mongodb/',
        });

        expect(
          serialize({ value: new BSONRegExp('^mongodb', 'm') })
        ).to.deep.equal({
          value: '/^mongodb/m',
        });
      });
    });
    describe('Undefined', function () {
      it('should serialize as a string', function () {
        expect(serialize({ value: undefined })).to.deep.equal({
          value: 'undefined',
        });
      });
    });
    describe('Null', function () {
      it('should serialize as a string', function () {
        expect(serialize({ value: null })).to.deep.equal({
          value: 'null',
        });
      });
    });
    describe('RegExp', function () {
      it('should serialize as a string', function () {
        expect(serialize({ value: /^mongodb/ })).to.deep.equal({
          value: '/^mongodb/',
        });
      });
    });
    describe('Array', function () {
      it('should serialize as a string of extended JSON', function () {
        expect(
          serialize({
            value: [
              new ObjectID('5e6652f22c09c775463d70f1'),
              new ObjectID('5e6652f62c09c775463d70f2'),
            ],
          })
        ).to.deep.equal({
          value:
            '[{"$oid":"5e6652f22c09c775463d70f1"},{"$oid":"5e6652f62c09c775463d70f2"}]',
        });
      });
    });
    describe('Object', function () {
      it('should serialize plain objects in dot notation', function () {
        const doc = {
          _id: 'arlo',
          name: 'Arlo',
          location: {
            activity: {
              sleeping: 'true',
              is: 'on the couch',
            },
          },
        };
        expect(serialize(doc)).to.deep.equal({
          _id: 'arlo',
          name: 'Arlo',
          'location.activity.sleeping': 'true',
          'location.activity.is': 'on the couch',
        });
      });
    });
  });
  describe('bson', function () {
    describe('ObjectID', function () {
      it('should detect value:<bson.ObjectID> as ObjectID', function () {
        expect(
          detectType(new ObjectID('5dd080acc15c0d5ee3ab6ad2'))
        ).to.be.equal('ObjectID');

        expect(
          getTypeDescriptorForValue(new ObjectID('5dd080acc15c0d5ee3ab6ad2'))
        ).to.be.deep.equal({ type: 'ObjectID', isBSON: true });
      });
      it('should serialize ObjectID as the hex string value', function () {
        const oid = '5dd080acc15c0d5ee3ab6ad2';
        const deserialized = bsonCSV.ObjectID.fromString(oid);
        expect(deserialized._bsontype).to.equal('ObjectID');
        expect(deserialized.toString()).to.equal('5dd080acc15c0d5ee3ab6ad2');
      });
    });
    describe('Long', function () {
      it('should serialize as a string', function () {
        expect(serialize({ value: Long.fromNumber(245) })).to.deep.equal({
          value: '245',
        });
      });
    });
    describe('BSONRegExp', function () {
      it('should detect value:<BSONRegExp>', function () {
        expect(detectType(new BSONRegExp('^mongodb'))).to.be.equal(
          'BSONRegExp'
        );
      });
      it('should serialize as a string', function () {
        expect(serialize({ value: new BSONRegExp('^mongodb') })).to.deep.equal({
          value: '/^mongodb/',
        });
      });
      it('should serialize value:<BSONRegExp> as a String with flags', function () {
        expect(
          serialize({ value: new BSONRegExp('^mongodb', 'm') })
        ).to.deep.equal({
          value: '/^mongodb/m',
        });
      });
    });
  });
});
