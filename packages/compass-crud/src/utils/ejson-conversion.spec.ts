import { expect } from 'chai';
import {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  EJSON,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
} from 'bson';
import {
  convertEJSONToShellSyntax,
  getAccidentalEJSONKey,
} from './ejson-conversion';
import { parseShellBSON } from '../stores/crud-store';

const convert = (text: string) =>
  convertEJSONToShellSyntax(parseShellBSON(text)).replace(/\s+/g, ' ');

describe('ejson-conversion', function () {
  describe('#getAccidentalEJSONKey', function () {
    it('returns nothing for a document without Extended JSON', function () {
      expect(
        getAccidentalEJSONKey({ _id: new ObjectId(), nested: { a: [1, 2] } })
      ).to.equal(null);
    });

    it('returns nothing for text that could not be parsed', function () {
      expect(getAccidentalEJSONKey(null)).to.equal(null);
    });

    it('ignores dollar-prefixed keys that are not Extended JSON', function () {
      expect(getAccidentalEJSONKey({ $set: { a: 1 } })).to.equal(null);
    });

    it('finds a key nested in subdocuments and arrays', function () {
      expect(
        getAccidentalEJSONKey({ a: [{ b: { n: { $numberLong: '1' } } }] })
      ).to.deep.equal({ key: '$numberLong', shellEquivalent: 'NumberLong()' });
    });

    it('finds a key in an array of documents', function () {
      expect(
        getAccidentalEJSONKey([{ a: 1 }, { _id: { $oid: '1' } }])
      ).to.deep.equal({ key: '$oid', shellEquivalent: 'ObjectId()' });
    });
  });

  describe('#convertEJSONToShellSyntax', function () {
    it('keeps the BSON types of a document written in Extended JSON', function () {
      const allTypes = {
        double: new Double(1.2),
        primitiveDouble: 1.2,
        doubleThatIsAlsoAnInteger: new Double(1),
        string: 'Hello, world!',
        object: { key: 'value' },
        array: [1, 2, 3],
        binData: new Binary(Uint8Array.from([1, 2, 3])),
        objectId: new ObjectId('642d766c7300158b1f22e975'),
        boolean: true,
        date: new Date('2023-04-05T13:25:08.445Z'),
        null: null,
        regex: new BSONRegExp('pattern', 'i'),
        javascript: new Code('function() {}'),
        symbol: new BSONSymbol('symbol'),
        javascriptWithScope: new Code('function() {}', { foo: 1, bar: 'a' }),
        int: new Int32(12345),
        primitiveInt: 12345,
        timestamp: new Timestamp(new Long('7218556297505931265')),
        long: new Long('123456789123456789'),
        decimal: new Decimal128(
          Uint8Array.from([
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ])
        ),
        minKey: new MinKey(),
        maxKey: new MaxKey(),
        binaries: {
          generic: new Binary(Uint8Array.from([1, 2, 3]), 0),
          functionData: Binary.createFromBase64('//8=', 1),
          binaryOld: Binary.createFromBase64('//8=', 2),
          uuidOld: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 3),
          uuid: new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'),
          md5: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 5),
          encrypted: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 6),
          custom: Binary.createFromBase64('//8=', 128),
        },
        dbRef: new DBRef('collect', new ObjectId('642d76b4b7ebfab15d3c4a78')),
        dbRefWithFields: new DBRef(
          'col',
          new ObjectId('642d76b4b7ebfab15d3c4a78'),
          'datab',
          { a: 1, b: 2 }
        ),
        dbRefWithFieldsNoDB: new DBRef(
          'colNoDB',
          new ObjectId('642d76b4b7ebfab15d3c4a78'),
          undefined,
          { a: new ObjectId('642d76b4b7ebfab15d3c4a55'), b: 'test' }
        ),
      };

      const converted = convert(EJSON.stringify(allTypes, { relaxed: false }));

      // At the time of writing, there are discrepancies between the generated
      // shell syntax from mongodb-query-parser stringify and actual shell
      // syntax.
      const expectedFields = [
        `'double': Double('1.2')`,
        `primitiveDouble: Double('1.2')`,
        `doubleThatIsAlsoAnInteger: Double('1')`,
        `string: 'Hello, world!'`,
        `object: { key: 'value' }`,
        `array: [ NumberInt('1'), NumberInt('2'), NumberInt('3') ]`,
        // Binary.createFromBase64('AQID', 0) in shell.
        `binData: BinData(0, 'AQID')`,
        `objectId: ObjectId('642d766c7300158b1f22e975')`,
        `'boolean': true`,
        `date: ISODate('2023-04-05T13:25:08.445Z')`,
        `null: null`,
        // /pattern/i in shell
        `regex: RegExp("pattern", 'i')`,
        `javascript: Code("function() {}")`,
        // $symbol should convert to BSONSymbol('symbol'), it currently
        // degrades to a plain subdocument.
        `symbol: { value: 'symbol' }`,
        // The scope is written as JSON rather than shell syntax.
        `javascriptWithScope: Code("function() {}",{"foo":1,"bar":"a"})`,
        `'int': NumberInt('12345')`,
        `primitiveInt: NumberInt('12345')`,
        `timestamp: Timestamp({ t: 1680701109, i: 1 })`,
        // TODO(COMPASS-10968): NumberLong should be written as Long('...')
        `'long': NumberLong('123456789123456789')`,
        // Eventually NumberDecimal should be written as Decimal128('...')
        // to standardize on shell syntax.
        `decimal: NumberDecimal('5.477284286264328586719275128128001E-4088')`,
        `minKey: MinKey()`,
        `maxKey: MaxKey()`,
        `generic: BinData(0, 'AQID')`,
        `functionData: BinData(1, '//8=')`,
        `binaryOld: BinData(2, '//8=')`,
        `uuidOld: BinData(3, 'c//SZESzTGmQ6OfR38A11A==')`,
        `uuid: UUID('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')`,
        `md5: BinData(5, 'c//SZESzTGmQ6OfR38A11A==')`,
        `encrypted: BinData(6, 'c//SZESzTGmQ6OfR38A11A==')`,
        `custom: BinData(128, '//8=')`,
        `dbRef: DBRef("collect", ObjectId('642d76b4b7ebfab15d3c4a78'))`,
        `dbRefWithFields: DBRef("col", ObjectId('642d76b4b7ebfab15d3c4a78'), "datab", {a:NumberInt('1'),b:NumberInt('2')})`,
        `dbRefWithFieldsNoDB: DBRef("colNoDB", ObjectId('642d76b4b7ebfab15d3c4a78'), undefined, {a:ObjectId('642d76b4b7ebfab15d3c4a55'),b:'test'})`,
      ];
      for (const expectedField of expectedFields) {
        expect(converted).to.include(expectedField);
      }
    });

    it('keeps the types of the parts that are already shell syntax', function () {
      expect(
        convert(`{
          _id: ObjectId('642d766b7300158b1f22e972'),
          created: ISODate('2023-04-05T13:25:08.445Z'),
          data: BinData(0, 'AQID'),
          big: Long('123456789123456789'),
          ts: Timestamp(1, 2),
          re: /abc/i,
          count: { "$numberLong": "9007199254740993" }
        }`)
      ).to.equal(
        `{ _id: ObjectId('642d766b7300158b1f22e972'), ` +
          `created: ISODate('2023-04-05T13:25:08.445Z'), ` +
          `data: BinData(0, 'AQID'), ` +
          `big: NumberLong('123456789123456789'), ` +
          `ts: Timestamp({ t: 1, i: 2 }), ` +
          `re: RegExp("abc", 'i'), ` +
          `count: NumberLong('9007199254740993') }`
      );
    });

    it('converts every document of an array', function () {
      expect(
        convert('[{ a: { "$numberInt": "1" } }, { b: { "$numberInt": "2" } }]')
      ).to.equal(`[ { a: NumberInt('1') }, { b: NumberInt('2') } ]`);
    });

    it('leaves dollar-prefixed keys that are not Extended JSON alone', function () {
      expect(convert('{ a: { "$unknown": 1 } }')).to.equal(
        `{ a: { $unknown: NumberInt('1') } }`
      );
    });

    it('throws for Extended JSON that cannot be deserialized', function () {
      expect(() => convert('{ _id: { "$oid": "not-an-object-id" } }')).to.throw(
        /24 character hex string/
      );
    });
  });
});
