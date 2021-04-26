/* eslint camelcase: 0, new-cap: 0 */
import { CommonErrors, MongoshInvalidInputError } from '@mongosh/errors';
import { bson } from '@mongosh/service-provider-core';
import { expect } from 'chai';
import sinon from 'ts-sinon';
import { ALL_SERVER_VERSIONS } from './enums';
import { toShellResult } from './index';
import constructShellBson from './shell-bson';

const hex_1234 = '31323334';
const b64_1234 = 'MTIzNA==';
const utf_1234 = '1234';

describe('Shell BSON', () => {
  let shellBson: any;
  let printWarning: (msg: string) => void;

  before(() => {
    printWarning = sinon.stub();
    shellBson = constructShellBson(bson, printWarning);
  });

  describe('DBRef', () => {
    it('without new', () => {
      const s = shellBson.DBRef('namespace', 'oid');
      expect(s._bsontype).to.equal('DBRef');
    });
    it('with new', () => {
      const s = new (shellBson.DBRef as any)('namespace', 'oid');
      expect(s._bsontype).to.equal('DBRef');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.DBRef('namespace', 'oid');
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for missing arg 1', () => {
      try {
        (shellBson.DBRef as any)();
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for missing arg 2', () => {
      try {
        (shellBson.DBRef as any)('ns');
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.DBRef as any)(1, 'oid');
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 3', () => {
      try {
        (shellBson.DBRef as any)('ns', 'oid', 1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('MaxKey', () => {
    it('without new', () => {
      const s = shellBson.MaxKey();
      expect(s._bsontype).to.equal('MaxKey');
    });
    it('with new', () => {
      const s = new (shellBson.MaxKey as any)();
      expect(s._bsontype).to.equal('MaxKey');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.MaxKey();
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
  });
  describe('MinKey', () => {
    it('without new', () => {
      const s = shellBson.MinKey();
      expect(s._bsontype).to.equal('MinKey');
    });
    it('with new', () => {
      const s = new (shellBson.MinKey as any)();
      expect(s._bsontype).to.equal('MinKey');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.MinKey();
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
  });
  describe('ObjectId', () => {
    it('without new', () => {
      const s = shellBson.ObjectId('5ebbe8e2905bb493d6981b6b');
      expect(s._bsontype).to.equal('ObjectID');
      expect(s.toHexString()).to.equal('5ebbe8e2905bb493d6981b6b');
    });
    it('with new', () => {
      const s = new (shellBson.ObjectId as any)('5ebbe8e2905bb493d6981b6b');
      expect(s._bsontype).to.equal('ObjectID');
      expect(s.toHexString()).to.equal('5ebbe8e2905bb493d6981b6b');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.ObjectId();
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.ObjectId as any)(1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('Symbol', () => {
    it('without new', () => {
      const s = shellBson.Symbol('5ebbe8e2905bb493d6981b6b');
      expect(s._bsontype).to.equal('Symbol');
      expect(s.toString()).to.equal('5ebbe8e2905bb493d6981b6b');
    });
    it('with new', () => {
      const s = new (shellBson.Symbol as any)('5ebbe8e2905bb493d6981b6b');
      expect(s._bsontype).to.equal('Symbol');
      expect(s.toString()).to.equal('5ebbe8e2905bb493d6981b6b');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.Symbol('5ebbe8e2905bb493d6981b6b');
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
    });
    it('constructs with default args 1', () => {
      const s = shellBson.Symbol();
      expect(s.toString()).to.equal('');
    });
  });
  describe('Timestamp', () => {
    it('without new', () => {
      const s = shellBson.Timestamp(0, 100);
      expect(s._bsontype).to.equal('Timestamp');
    });
    it('with new', () => {
      const s = new (shellBson.Timestamp as any)(0, 100);
      expect(s._bsontype).to.equal('Timestamp');
    });
    it('has help and other metadata', async() => {
      const s = shellBson.Timestamp(0, 100);
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.Timestamp as any)('1');
      } catch (e) {
        return expect(e.message).to.contain('number, got string');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 2', () => {
      try {
        (shellBson.Timestamp as any)(1, '2');
      } catch (e) {
        return expect(e.message).to.contain('number, got string');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('constructs with default args', () => {
      const s = shellBson.Timestamp();
      expect(s.low).to.equal(0);
      expect(s.high).to.equal(0);
    });
    it('constructs with default args 1', () => {
      const s = shellBson.Timestamp(1);
      expect(s.low).to.equal(1);
      expect(s.high).to.equal(0);
    });
  });
  describe('Code', () => {
    it('expects arguments in order', () => {
      const code = shellBson.Code('code', { k: 'v' });
      expect(code.code).to.equal('code');
      expect(code.scope).to.deep.equal({ k: 'v' });
    });
    it('has help and other metadata', async() => {
      const s = shellBson.Code('code', { k: 'v' });
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.Code as any)(1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.Code as any)('code', 1);
      } catch (e) {
        return expect(e.message).to.contain('object, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('constructs with default args 1', () => {
      const s = shellBson.Code();
      expect(s.code).to.equal('');
    });
  });
  describe('ISODate', () => {
    it('ISODate is always object', () => {
      const date = new (shellBson.ISODate as any)();
      expect(typeof date).to.equal('object');
      const date2 = shellBson.ISODate();
      expect(typeof date2).to.equal('object');
    });
    it('accepts ISO args', () => {
      expect((shellBson.ISODate('2020-10-02')).getTime()).to.equal(1601596800000);
      expect((shellBson.ISODate('2020-10-02T10:29:50+00:00')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('2020-10-02T10:29:50+02:00')).getTime()).to.equal(1601627390000);
      expect((shellBson.ISODate('2020-10-02T10:29:50-02:00')).getTime()).to.equal(1601641790000);
      expect((shellBson.ISODate('2020-10-02T10:29:50Z')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('2020-10-02T10:29:50')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('2020-10-02T10:29:50.124Z')).getTime()).to.equal(1601634590124);
      expect((shellBson.ISODate('20201002T102950Z')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002T102950')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002T102950+0000')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002T102950-0000')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002T102950+0200')).getTime()).to.equal(1601627390000);
      expect((shellBson.ISODate('20201002T102950-0200')).getTime()).to.equal(1601641790000);
      expect((shellBson.ISODate('20201002 102950Z')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002 102950+0000')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002 102950+0200')).getTime()).to.equal(1601627390000);
      expect((shellBson.ISODate('20201002 102950-0200')).getTime()).to.equal(1601641790000);
      expect((shellBson.ISODate('20201002 102950')).getTime()).to.equal(1601634590000);
      expect((shellBson.ISODate('20201002 102950.842')).getTime()).to.equal(1601634590842);
    });
    it('rejects non-ISO args', () => {
      expect(() => shellBson.ISODate('1/4/1977')).to.throw('"1/4/1977" is not a valid ISODate');
      expect(() => shellBson.ISODate('1-4-1977')).to.throw('"1-4-1977" is not a valid ISODate');
      expect(() => shellBson.ISODate('9999-12-31T23:99:59.999Z')).to.throw('"9999-12-31T23:99:59.999Z" is not a valid ISODate');
      expect(() => shellBson.ISODate('bah')).to.throw('"bah" is not a valid ISODate');

      try {
        shellBson.ISODate('"');
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.message).to.contain('"\\"" is not a valid ISODate');
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
        return;
      }
      expect.fail('expected error');
    });
  });
  describe('BinData', () => {
    it('expects strings as base 64', () => {
      const b = shellBson.BinData(128, b64_1234);
      expect(b.value()).to.equal(utf_1234);
    });
    it('has help and other metadata', async() => {
      const s = shellBson.BinData(128, b64_1234);
      expect((await toShellResult(s.help)).type).to.equal('Help');
      expect((await toShellResult(s.help())).type).to.equal('Help');
      expect(s.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for missing arg 1', () => {
      try {
        (shellBson.BinData as any)();
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for missing arg 2', () => {
      try {
        (shellBson.BinData as any)(0);
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.BinData as any)('1', 'abc');
      } catch (e) {
        return expect(e.message).to.contain('number, got string');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 2', () => {
      try {
        (shellBson.BinData as any)(0, 1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('HexData', () => {
    let b: any;
    let h: any;
    before(() => {
      b = shellBson.BinData(128, b64_1234);
      h = shellBson.HexData(128, hex_1234);
    });

    it('equals BinData', () => {
      expect(b.value()).to.equal(h.value());
      expect(b.sub_type).to.equal(h.sub_type);
    });
    it('equals 1234', () => {
      expect(h.value()).to.equal(utf_1234);
    });
    it('has subtype', () => {
      expect(h.sub_type).to.equal(128);
    });
    it('has help and other metadata', async() => {
      expect((await toShellResult(h.help)).type).to.equal('Help');
      expect((await toShellResult(h.help())).type).to.equal('Help');
      expect(h.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for missing arg 1', () => {
      try {
        (shellBson.HexData as any)();
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for missing arg 2', () => {
      try {
        (shellBson.HexData as any)(0);
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.HexData as any)('1', 'abc');
      } catch (e) {
        return expect(e.message).to.contain('number, got string');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 2', () => {
      try {
        (shellBson.HexData as any)(0, 1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('UUID', () => {
    let b: any;
    let h: any;
    before(() => {
      b = shellBson.BinData(4, b64_1234);
      h = shellBson.UUID(hex_1234);
    });
    it('equals BinData', () => {
      expect(b.value()).to.equal(h.value());
      expect(b.sub_type).to.equal(h.sub_type);
    });
    it('equals 1234', () => {
      expect(h.value()).to.equal(utf_1234);
    });
    it('has subtype', () => {
      expect(h.sub_type).to.equal(4);
    });
    it('has help and other metadata', async() => {
      expect((await toShellResult(h.help)).type).to.equal('Help');
      expect((await toShellResult(h.help())).type).to.equal('Help');
      expect(h.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('strips dashes from input', () => {
      expect(shellBson.UUID('01234567-89ab-cdef-0123-456789abcdef').value())
        .to.equal(shellBson.UUID('0123456789abcdef0123456789abcdef').value());
    });
    it('generates a random UUID when no arguments are passed', () => {
      // https://en.wikipedia.org/wiki/Universally_unique_identifier#Format
      expect(shellBson.UUID().value(true).toString('hex')).to.match(
        /^[a-z0-9]{12}4[a-z0-9]{3}[89ab][a-z0-9]{15}$/);
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.UUID as any)(1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('MD5', () => {
    let b: any;
    let h: any;
    before(() => {
      b = shellBson.BinData(5, b64_1234);
      h = shellBson.MD5(hex_1234);
    });
    it('equals BinData', () => {
      expect(b.value()).to.equal(h.value());
      expect(b.sub_type).to.equal(h.sub_type);
    });
    it('equals 1234', () => {
      expect(h.value()).to.equal(utf_1234);
    });
    it('has subtype', () => {
      expect(h.sub_type).to.equal(5);
    });
    it('has help and other metadata', async() => {
      expect((await toShellResult(h.help)).type).to.equal('Help');
      expect((await toShellResult(h.help())).type).to.equal('Help');
      expect(h.serverVersions).to.deep.equal(ALL_SERVER_VERSIONS);
    });
    it('errors for missing arg 1', () => {
      try {
        (shellBson.MD5 as any)();
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.MD5 as any)(1);
      } catch (e) {
        return expect(e.message).to.contain('string, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });
  describe('bsonsize', () => {
    it('calculates empty doc size', () => {
      expect(shellBson.bsonsize({})).to.equal(5);
    });
    it('errors for missing arg', () => {
      try {
        (shellBson.bsonsize as any)();
      } catch (e) {
        return expect(e.message).to.contain('Missing required argument');
      }
      expect.fail('Expecting error, nothing thrown');
    });
    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.bsonsize as any)(1);
      } catch (e) {
        return expect(e.message).to.contain('object, got number');
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });

  describe('NumberLong', () => {
    it('creates a bson.Long', () => {
      const n = shellBson.NumberLong('123');
      expect(n).to.be.instanceOf(bson.Long);
      expect(bson.Long.fromString('123').eq(n)).to.be.true;
    });

    it('constructs 0 if the argument is not provided', () => {
      expect(bson.Long.fromString('0').eq(shellBson.NumberLong())).to.be.true;
    });

    it('correctly constructs numbers > MAX_SAFE_INTEGER', () => {
      expect(shellBson.NumberLong('345678654321234552').toString()).to.equal('345678654321234552');
    });

    it('creates a bson.Long for unrecommended integer and prints warning', () => {
      const n = shellBson.NumberLong(123.5);
      expect(n).to.be.instanceOf(bson.Long);
      expect(bson.Long.fromString('123').eq(n)).to.be.true;
      expect(printWarning).to.have.been.calledWith('NumberLong: specifying a number as argument is deprecated and may lead to loss of precision');
    });

    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.NumberLong as any)({});
      } catch (e) {
        return expect(e.message).to.match(/string or number, got object.+\(NumberLong\)/);
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });

  describe('NumberDecimal', () => {
    it('creates a bson.Decimal128', () => {
      const n = shellBson.NumberDecimal('123.1');
      expect(n).to.be.instanceOf(bson.Decimal128);
      expect(n.toString()).to.equal('123.1');
    });

    it('constructs 0 if the argument is not provided', () => {
      expect(shellBson.NumberDecimal().toString()).to.equal('0');
    });

    it('correctly constructs numbers > MAX_SAFE_INTEGER', () => {
      expect(shellBson.NumberDecimal('345678654321234552.0').toString()).to.equal('345678654321234552.0');
    });

    it('creates a bson.Decimal128 for unrecommended integer and prints warning', () => {
      const n = shellBson.NumberDecimal(123);
      expect(n).to.be.instanceOf(bson.Decimal128);
      expect(bson.Decimal128.fromString('123').toString()).to.equal(n.toString());
      expect(printWarning).to.have.been.calledWith('NumberDecimal: specifying a number as argument is deprecated and may lead to loss of precision');
    });

    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.NumberDecimal as any)({});
      } catch (e) {
        return expect(e.message).to.match(/string or number, got object.+\(NumberDecimal\)/);
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });

  describe('NumberInt', () => {
    it('creates a bson.Int32 from string', () => {
      const n = shellBson.NumberInt('1');
      expect(n).to.be.instanceOf(bson.Int32);
      expect(n.value).to.equal(1);
    });

    it('creates a bson.Int32 from number', () => {
      const n = shellBson.NumberInt(123);
      expect(n).to.be.instanceOf(bson.Int32);
      expect(new bson.Int32(123).value).to.equal(n.value);
    });

    it('creates a bson.Int32 from non-integer number', () => {
      const n = shellBson.NumberInt(123.5);
      expect(n).to.be.instanceOf(bson.Int32);
      expect(new bson.Int32(123).value).to.equal(n.value);
    });

    it('constructs 0 if the argument is not provided', () => {
      expect(shellBson.NumberInt().value).to.equal(0);
    });

    it('errors for wrong type of arg 1', () => {
      try {
        (shellBson.NumberInt as any)({});
      } catch (e) {
        return expect(e.message).to.match(/string or number, got object.+\(NumberInt\)/);
      }
      expect.fail('Expecting error, nothing thrown');
    });
  });

  describe('EJSON', () => {
    it('serializes and de-serializes data', () => {
      const input = { a: new Date() };
      const output = shellBson.EJSON.parse(shellBson.EJSON.stringify(input));
      expect(input).to.deep.equal(output);
    });
  });
});
