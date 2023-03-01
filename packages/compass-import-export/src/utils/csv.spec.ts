/* eslint-disable mocha/max-top-level-suites */
import { expect } from 'chai';

import {
  Double,
  Int32,
  Long,
  Binary,
  BSONRegExp,
  ObjectId,
  Timestamp,
  Decimal128,
  UUID,
} from 'bson';
import { BSONError } from 'bson';

import {
  detectFieldType,
  placeValue,
  makeDoc,
  parseValue,
  parseHeaderName,
} from './csv';
import type { IncludedFields } from './csv';
import type { PathPart } from './csv';

describe('detectFieldType', function () {
  it('returns undefined for empty string with ignoreEmptyStrings=true', function () {
    expect(detectFieldType('', true)).to.equal('undefined');
  });

  it('returns string for empty string with ignoreEmptyStrings=false', function () {
    expect(detectFieldType('', false)).to.equal('string');
  });

  it('returns null for known null values', function () {
    expect(detectFieldType('Null')).to.equal('null');
    expect(detectFieldType('NULL')).to.equal('null');
    expect(detectFieldType('null')).to.equal('null');
  });

  it('returns boolean for known truthy values', function () {
    expect(detectFieldType('true')).to.equal('boolean');
    expect(detectFieldType('TRUE')).to.equal('boolean');
    expect(detectFieldType('True')).to.equal('boolean');
  });

  it('returns boolean for known falsy values', function () {
    expect(detectFieldType('false')).to.equal('boolean');
    expect(detectFieldType('FALSE')).to.equal('boolean');
    expect(detectFieldType('False')).to.equal('boolean');
  });

  it('returns double when there is a . or exponent', function () {
    expect(detectFieldType('1.0')).to.equal('double');
    expect(detectFieldType('1.0000000000000002')).to.equal('double');
    expect(detectFieldType('1.7976931348623157e+308')).to.equal('double');
  });

  it('returns int for small integers', function () {
    expect(detectFieldType('1')).to.equal('int');
  });

  it('returns long for large integers', function () {
    expect(detectFieldType('9223372036854775807')).to.equal('long');
  });

  it('returns date if the value matches the iso date regex', function () {
    expect(detectFieldType('2023-01-04T16:22:59.453Z')).to.equal('date');
  });

  it('defaults to string for everything else', function () {
    expect(detectFieldType('what even is this?')).to.equal('string');
  });
});

describe('placeValue', function () {
  it('places a simple value', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo'), 1);
    expect(doc).to.deep.equal({ foo: 1 });

    placeValue(doc, parseHeaderName('bar'), 2);
    expect(doc).to.deep.equal({ foo: 1, bar: 2 });
  });

  it('places an object field', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo.bar'), 1);
    expect(doc).to.deep.equal({ foo: { bar: 1 } });

    placeValue(doc, parseHeaderName('foo.baz'), 2);
    expect(doc).to.deep.equal({ foo: { bar: 1, baz: 2 } });
  });

  it('places a nested object field', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo.bar.baz'), 1);
    expect(doc).to.deep.equal({ foo: { bar: { baz: 1 } } });

    placeValue(doc, parseHeaderName('foo.bar.qux'), 2);
    expect(doc).to.deep.equal({ foo: { bar: { baz: 1, qux: 2 } } });
  });

  it('places an array value', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo[0]'), 1);
    expect(doc).to.deep.equal({ foo: [1] });

    placeValue(doc, parseHeaderName('foo[1]'), 2);
    expect(doc).to.deep.equal({ foo: [1, 2] });
  });

  it('places a nested array value', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo[0].bar[0]'), 1);
    expect(doc).to.deep.equal({ foo: [{ bar: [1] }] });

    placeValue(doc, parseHeaderName('foo[0].bar[1]'), 2);
    expect(doc).to.deep.equal({ foo: [{ bar: [1, 2] }] });
  });

  it('places a multi-dimensional array value', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo[0][0]'), 1);
    expect(doc).to.deep.equal({ foo: [[1]] });

    placeValue(doc, parseHeaderName('foo[0][1]'), 2);
    expect(doc).to.deep.equal({ foo: [[1, 2]] });
  });

  it('places a complex nested value', function () {
    const doc = {};
    placeValue(doc, parseHeaderName('foo[0].bar.baz[0].qux'), 1);
    expect(doc).to.deep.equal({
      foo: [
        {
          bar: {
            baz: [
              {
                qux: 1,
              },
            ],
          },
        },
      ],
    });

    placeValue(doc, parseHeaderName('foo[1].bar.baz[0].quux'), 2);
    expect(doc).to.deep.equal({
      foo: [
        {
          bar: {
            baz: [
              {
                qux: 1,
              },
            ],
          },
        },
        {
          bar: {
            baz: [
              {
                quux: 2,
              },
            ],
          },
        },
      ],
    });
  });

  it('throws when trying to place an object on top of a simple value', function () {
    expect(() =>
      placeValue({ foo: 1 }, parseHeaderName('foo.bar'), 1)
    ).to.throw('parent must be an object');
  });

  it('throws when trying to place an object on top of an array', function () {
    expect(() =>
      placeValue({ foo: [1] }, parseHeaderName('foo.bar'), 1)
    ).to.throw('parent must be an object');
  });

  it('throws when trying to place an array on top of a simple value', function () {
    expect(() => placeValue({ foo: 1 }, parseHeaderName('foo[0]'), 1)).to.throw(
      'parent must be an array'
    );
  });

  it('throws when trying to place an array on top of an object', function () {
    expect(() =>
      placeValue({ foo: { bar: 1 } }, parseHeaderName('foo[0]'), 1)
    ).to.throw('parent must be an array');
  });
});

function parseHeader(header: string[]): Record<string, PathPart[]> {
  const parsed: Record<string, PathPart[]> = {};
  for (const name of header) {
    parsed[name] = parseHeaderName(name);
  }
  return parsed;
}

describe('makeDoc', function () {
  it('ignores empty strings if ignoreEmptyStrings is true', function () {
    const chunk = {
      a: '',
      b: '',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'string', b: 'string' } as IncludedFields;

    const doc = makeDoc(chunk, header, parsedHeader, included, {
      ignoreEmptyStrings: true,
    });
    expect(doc).to.deep.equal({});
  });

  it('inserts empty strings if ignoreEmptyStrings is false', function () {
    const chunk = {
      a: '',
      b: '',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'string', b: 'string' } as IncludedFields;

    const doc = makeDoc(chunk, header, parsedHeader, included, {
      ignoreEmptyStrings: false,
    });
    expect(doc).to.deep.equal({
      a: '',
      b: '',
    });
  });

  it('ignores fields that are not included', function () {
    const chunk = {
      a: '1',
      b: '2',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'int' } as IncludedFields;

    const doc = makeDoc(chunk, header, parsedHeader, included, {
      ignoreEmptyStrings: true,
    });
    expect(doc).to.deep.equal({ a: new Int32(1) });
  });

  it('throws if a field should be made a number but it is not a number', function () {
    const chunk = {
      a: 'a',
      b: 'b',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'number' } as IncludedFields;

    expect(() =>
      makeDoc(chunk, header, parsedHeader, included, {
        ignoreEmptyStrings: true,
      })
    ).to.throw(Error, '"a" is not a number (found "string") [Col 0]');
  });

  it('guesses the correct number type when it should make a field a number', function () {
    const chunk = {
      int: '1',
      long: '9223372036854775807',
      double: '1.0',
    };
    const header = ['int', 'long', 'double'];
    const parsedHeader = parseHeader(header);
    const included = {
      int: 'number',
      long: 'number',
      double: 'number',
    } as IncludedFields;

    const doc = makeDoc(chunk, header, parsedHeader, included, {
      ignoreEmptyStrings: true,
    });
    expect(doc).to.deep.equal({
      int: new Int32('1'),
      long: new Long('9223372036854775807'),
      double: new Double(1.0),
    });
  });

  it('appends the column number to errors', function () {
    const chunk = {
      a: 'a',
      b: 'b',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'double' } as IncludedFields;

    expect(() =>
      makeDoc(chunk, header, parsedHeader, included, {
        ignoreEmptyStrings: true,
      })
    ).to.throw(Error, '"a" is not a number [Col 0]');
  });
});

describe('parseValue', function () {
  it('parses int', function () {
    expect(parseValue('123', 'int')).to.deep.equal(new Int32('123'));

    expect(() => parseValue('abc', 'long')).to.throw('"abc" is not a number');
  });

  it('parses long', function () {
    expect(parseValue('123', 'long')).to.deep.equal(new Long('123'));

    expect(() => parseValue('abc', 'long')).to.throw('"abc" is not a number');
  });

  it('parses double', function () {
    expect(parseValue('12.3', 'double')).to.deep.equal(
      new Double(parseFloat('12.3'))
    );

    expect(() => parseValue('abc', 'double')).to.throw(
      Error,
      '"abc" is not a number'
    );
  });

  it('parses boolean', function () {
    expect(parseValue('1', 'boolean')).to.deep.equal(true);
    expect(parseValue('true', 'boolean')).to.deep.equal(true);
    expect(parseValue('TRUE', 'boolean')).to.deep.equal(true);
    expect(parseValue('True', 'boolean')).to.deep.equal(true);
    expect(parseValue('t', 'boolean')).to.deep.equal(true);

    expect(parseValue('0', 'boolean')).to.deep.equal(false);
    expect(parseValue('false', 'boolean')).to.deep.equal(false);
    expect(parseValue('FALSE', 'boolean')).to.deep.equal(false);
    expect(parseValue('False', 'boolean')).to.deep.equal(false);
    expect(parseValue('f', 'boolean')).to.deep.equal(false);

    // anything else is true due to the fallback of Boolean(value)
    expect(parseValue('yes', 'boolean')).to.deep.equal(true);
    expect(parseValue('no', 'boolean')).to.deep.equal(true);
  });

  it('parses date', function () {
    expect(
      parseValue('2023-01-04T16:22:59.453Z', 'date')?.toString()
    ).to.deep.equal(new Date('2023-01-04T16:22:59.453Z').toString());
    expect(parseValue('1648425600000', 'date')?.toString()).to.deep.equal(
      new Date(+'1648425600000').toString()
    );
    expect(parseValue('2023-01-04', 'date')?.toString()).to.deep.equal(
      new Date('2023-01-04').toString()
    );

    expect(() => parseValue('abc', 'date')).to.throw('"abc" is not a date');
  });

  it('parses null', function () {
    // How compass/mongoexport exports null
    expect(parseValue('null', 'null')).to.deep.equal(null);
    expect(parseValue('Null', 'null')).to.deep.equal(null);
    expect(parseValue('NULL', 'null')).to.deep.equal(null);

    // But really it will make anything null if the user says the column is null
    // (We don't currently allow users to select null, so you can only get here
    // by selecting Mixed and it detecting null)
    expect(parseValue('dsfsd', 'null')).to.deep.equal(null);
    expect(parseValue('1234', 'null')).to.deep.equal(null);
  });

  it('parses string', function () {
    expect(parseValue('123', 'string')).to.deep.equal('123');
  });

  it('parses binData', function () {
    expect(parseValue('123', 'binData')).to.deep.equal(
      new Binary(Buffer.from('123'), Binary.SUBTYPE_DEFAULT)
    );
  });

  it('parses uuid', function () {
    expect(
      parseValue('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA', 'uuid')
    ).to.deep.equal(new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'));
  });

  it('parses md5', function () {
    expect(parseValue('1', 'md5')).to.deep.equal(
      new Binary(Buffer.from('1'), Binary.SUBTYPE_MD5)
    );
  });

  it('parses objectId', function () {
    expect(() => parseValue('1', 'objectId')).to.throw(BSONError);
    expect(parseValue('63dbc32d12a39d2a72941813', 'objectId')).to.deep.equal(
      new ObjectId('63dbc32d12a39d2a72941813')
    );
  });

  it('parses regex', function () {
    expect(parseValue('123', 'regex')).to.deep.equal(new BSONRegExp('123'));
  });

  it('parses timestamp', function () {
    expect(parseValue('18446744073709551615', 'timestamp')).to.deep.equal(
      Timestamp.fromString('18446744073709551615', 10)
    );

    // internally Long will turn NaN into 0
    expect(() => parseValue('abc', 'timestamp')).throw('"abc" is not a number');
  });

  it('parses decimal', function () {
    expect(() => parseValue('e+02', 'decimal')).to.throw(BSONError);
    expect(
      parseValue('9.999999999999999999999999999999999E+6144', 'decimal')
    ).to.deep.equal(
      Decimal128.fromString('9.999999999999999999999999999999999E+6144')
    );
  });

  it('leaves all other bson types as strings', function () {
    expect(parseValue('foo', 'string')).to.deep.equal('foo');
  });
});

describe('parseHeaderName', function () {
  it('parses a simple path', function () {
    expect(parseHeaderName('foo')).to.deep.equal([
      { type: 'field', name: 'foo' },
    ]);
  });

  it('parses an object path', function () {
    expect(parseHeaderName('foo.bar')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: 'bar' },
    ]);
  });

  it('parses a nested object path', function () {
    expect(parseHeaderName('foo.bar.baz')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: 'bar' },
      { type: 'field', name: 'baz' },
    ]);
  });

  it('parses an array path', function () {
    expect(parseHeaderName('foo[99]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 99 },
    ]);
  });

  it('parses a nested array path', function () {
    expect(parseHeaderName('foo[99].bar[3]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 99 },
      { type: 'field', name: 'bar' },
      { type: 'index', index: 3 },
    ]);
  });

  it('parses a multidimensional array path', function () {
    expect(parseHeaderName('foo[3][4]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 3 },
      { type: 'index', index: 4 },
    ]);
  });

  it('parses a complex path', function () {
    expect(parseHeaderName('foo[3].bar[4].baz')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 3 },
      { type: 'field', name: 'bar' },
      { type: 'index', index: 4 },
      { type: 'field', name: 'baz' },
    ]);
  });

  it('deals with empty field names', function () {
    expect(parseHeaderName('')).to.deep.equal([{ type: 'field', name: '' }]);

    expect(parseHeaderName('[3]')).to.deep.equal([
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
    ]);

    expect(parseHeaderName('[3].')).to.deep.equal([
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
      { type: 'field', name: '' },
    ]);

    expect(parseHeaderName('foo..')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: '' },
      { type: 'field', name: '' },
    ]);

    expect(parseHeaderName('foo.[3].')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
      { type: 'field', name: '' },
    ]);
  });

  it('throws if an array index is not a number', function () {
    expect(() => parseHeaderName('[foo]')).to.throw('"foo" is not a number');
    expect(() => parseHeaderName('[foo')).to.throw('"foo" is not a number');
    expect(() => parseHeaderName('["foo"]')).to.throw(
      '""foo"" is not a number'
    );
    expect(() => parseHeaderName("['foo']")).to.throw(
      '"\'foo\'" is not a number'
    );
  });
});
