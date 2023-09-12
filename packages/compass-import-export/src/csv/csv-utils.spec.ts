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
  Code,
  DBRef,
  MinKey,
  MaxKey,
  BSONSymbol,
} from 'bson';
import { BSONError } from 'bson';

import {
  detectCSVFieldType,
  placeValue,
  makeDocFromCSV,
  parseCSVValue,
  parseCSVHeaderName,
  formatCSVValue,
  formatCSVLine,
  stringifyCSVValue,
  csvHeaderNameToFieldName,
  formatCSVHeaderName,
  isCompatibleCSVFieldType,
  findBrokenCSVTypeExample,
} from './csv-utils';
import { detectableFieldTypes, parsableFieldTypes } from './csv-types';
import type {
  IncludedFields,
  PathPart,
  CSVDetectableFieldType,
  CSVParsableFieldType,
  CSVFieldTypeInfo,
} from './csv-types';

describe('formatCSVValue', function () {
  it('does not escape line breaks by default', function () {
    const options = { delimiter: ',' as const };
    expect(formatCSVValue('\n', options)).to.equal('\n');
    expect(formatCSVValue('\r\n', options)).to.equal('\r\n');
  });

  it('escapes line breaks if escapeLineBreaks is true', function () {
    const options = { delimiter: ',' as const, escapeLinebreaks: true };
    expect(formatCSVValue('\n', options)).to.equal('\\n');
    expect(formatCSVValue('\r\n', options)).to.equal('\\r\\n');
  });

  it('wraps lines with quotes if it contains the delimiter or a quote', function () {
    const options = { delimiter: ',' as const };
    expect(formatCSVValue('foo', options)).to.equal('foo'); // neither
    expect(formatCSVValue('hello, there', options)).to.equal('"hello, there"'); // delimiter
    expect(formatCSVValue('foo""bar', options)).to.equal('"foo""""bar"'); // quote
  });
});

describe('formatCSVLine', function () {
  it('joins values by the delimiter and adds a linebreak', function () {
    expect(
      formatCSVLine(['foo', 'bar', 'baz'], { delimiter: ',', linebreak: '\n' })
    ).to.equal('foo,bar,baz\n');
    expect(
      formatCSVLine(['foo', 'bar', 'baz'], {
        delimiter: ' ',
        linebreak: '\r\n',
      })
    ).to.equal('foo bar baz\r\n');
  });
});

describe('stringifyCSVValue', function () {
  const options = { delimiter: ',' as const };

  it('stringifies null', function () {
    expect(stringifyCSVValue(null, options)).to.equal('');
  });

  it('stringifies undefined', function () {
    expect(stringifyCSVValue(undefined, options)).to.equal('');
  });

  it('stringifies string', function () {
    expect(stringifyCSVValue('foo', options)).to.equal('foo');
    expect(stringifyCSVValue('foo, bar', options)).to.equal('"foo, bar"');
    expect(stringifyCSVValue('foo"bar', options)).to.equal('"foo""bar"');
    expect(stringifyCSVValue('foo\nbar', options)).to.equal('foo\\nbar');
    expect(stringifyCSVValue('foo\r\nbar', options)).to.equal('foo\\r\\nbar');
  });

  it('stringifies date', function () {
    expect(
      stringifyCSVValue(new Date('2019-02-08T10:21:49.176Z'), options)
    ).to.equal('2019-02-08T10:21:49.176Z');
  });

  it('stringifies number', function () {
    expect(stringifyCSVValue(1, options)).to.equal('1');
    expect(stringifyCSVValue(1.2, options)).to.equal('1.2');

    expect(stringifyCSVValue(new Int32('1'), options)).to.equal('1');
    expect(stringifyCSVValue(new Int32('1'), options)).to.equal('1');
    expect(stringifyCSVValue(new Double(1.2), options)).to.equal('1.2');

    expect(stringifyCSVValue(new Long('123456789123456784'), options)).to.equal(
      '123456789123456784'
    );
  });

  it('stringifies boolean', function () {
    expect(stringifyCSVValue(true, options)).to.equal('true');
    expect(stringifyCSVValue(false, options)).to.equal('false');
  });

  it('stringifies object', function () {
    expect(stringifyCSVValue({}, options)).to.equal('{}');
    expect(stringifyCSVValue({ foo: 1 }, options)).to.equal(
      '"{""foo"":{""$numberInt"":""1""}}"'
    );
  });

  it('stringifies array', function () {
    expect(stringifyCSVValue([], options)).to.equal('[]');
    expect(stringifyCSVValue([1, 2, 3], options)).to.equal(
      '"[{""$numberInt"":""1""},{""$numberInt"":""2""},{""$numberInt"":""3""}]"'
    );
  });

  it('stringifies objectId', function () {
    expect(
      stringifyCSVValue(new ObjectId('5ab901c29ee65f5c8550c5b9'), options)
    ).to.equal('5ab901c29ee65f5c8550c5b9');
  });

  it('stringifies uuid', function () {
    expect(
      stringifyCSVValue(
        new UUID('0908fcbe-ad5f-4aac-bcb7-1584288467ac'),
        options
      )
    ).to.equal('0908fcbe-ad5f-4aac-bcb7-1584288467ac');
  });

  it('stringifies binary', function () {
    expect(
      stringifyCSVValue(
        Binary.createFromBase64('Yy8vU1pFU3pUR21RNk9mUjM4QTExQT09'),
        options
      )
    ).to.equal('Yy8vU1pFU3pUR21RNk9mUjM4QTExQT09');

    expect(
      stringifyCSVValue(new Binary(Buffer.from('",\n')), options)
    ).to.equal('IiwK');
  });

  it('stringifies regexp', function () {
    expect(stringifyCSVValue(new BSONRegExp('pattern', 'i'), options)).to.equal(
      '/pattern/i'
    );
  });

  it('stringifies decimal128', function () {
    expect(
      stringifyCSVValue(
        new Decimal128(
          Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
        ),
        options
      )
    ).to.equal('5.477284286264328586719275128128001E-4088');
  });

  it('stringifies timestamp', function () {
    expect(
      stringifyCSVValue(new Timestamp(new Long('1680624461218')), options)
    ).to.equal('1680624461218');
  });

  it('stringifies code', function () {
    expect(stringifyCSVValue(new Code('function() {}'), options)).to.equal(
      '"{""$code"":""function() {}""}"'
    );
    expect(
      stringifyCSVValue(
        new Code('function() {}', { foo: 1, bar: 'a' }),
        options
      )
    ).to.equal(
      '"{""$code"":""function() {}"",""$scope"":{""foo"":{""$numberInt"":""1""},""bar"":""a""}}"'
    );
  });

  it('stringifies minkey', function () {
    expect(stringifyCSVValue(new MinKey(), options)).to.equal('$MinKey');
  });

  it('stringifies maxkey', function () {
    expect(stringifyCSVValue(new MaxKey(), options)).to.equal('$MaxKey');
  });

  it('stringifies dbref', function () {
    expect(
      stringifyCSVValue(
        new DBRef('namespace', new ObjectId('642c4ce5e013234c1d9dd9ad')),
        options
      )
    ).to.equal(
      '"{""$ref"":""namespace"",""$id"":{""$oid"":""642c4ce5e013234c1d9dd9ad""}}"'
    );
  });

  it('stringifies symbol', function () {
    expect(stringifyCSVValue(new BSONSymbol('symbol'), options)).to.equal(
      '"{""$symbol"":""symbol""}"'
    );
  });
});

describe('csvHeaderNameToFieldName', function () {
  it('strips array indexes', function () {
    expect(csvHeaderNameToFieldName('array[0]')).to.equal('array[]');
    expect(csvHeaderNameToFieldName('array')).to.equal('array');
    expect(csvHeaderNameToFieldName('foo[3].bar[1]')).to.equal('foo[].bar[]');
  });
});

describe('detectCSVFieldType', function () {
  const name = 'foo';

  it('returns objectId if the name is _id and the value looks like an objectId', function () {
    expect(
      detectCSVFieldType('642af891571e13e609f9069c', '_id', true)
    ).to.equal('objectId');
  });

  it('returns string if the name is not _id and the value looks like an objectId', function () {
    expect(detectCSVFieldType('642af891571e13e609f9069c', name, true)).to.equal(
      'string'
    );
  });

  it('returns undefined for empty string with ignoreEmptyStrings=true', function () {
    expect(detectCSVFieldType('', name, true)).to.equal('undefined');
  });

  it('returns string for empty string with ignoreEmptyStrings=false', function () {
    expect(detectCSVFieldType('', name, false)).to.equal('string');
  });

  it('returns null for known null values', function () {
    expect(detectCSVFieldType('Null', name)).to.equal('null');
    expect(detectCSVFieldType('NULL', name)).to.equal('null');
    expect(detectCSVFieldType('null', name)).to.equal('null');
  });

  it('returns boolean for known truthy values', function () {
    expect(detectCSVFieldType('true', name)).to.equal('boolean');
    expect(detectCSVFieldType('TRUE', name)).to.equal('boolean');
    expect(detectCSVFieldType('True', name)).to.equal('boolean');
  });

  it('returns boolean for known falsy values', function () {
    expect(detectCSVFieldType('false', name)).to.equal('boolean');
    expect(detectCSVFieldType('FALSE', name)).to.equal('boolean');
    expect(detectCSVFieldType('False', name)).to.equal('boolean');
  });

  it('returns double when there is a . or exponent', function () {
    expect(detectCSVFieldType('1.0', name)).to.equal('double');
    expect(detectCSVFieldType('1.0000000000000002', name)).to.equal('double');
    expect(detectCSVFieldType('1.7976931348623157e+308', name)).to.equal(
      'double'
    );
  });

  it('returns int for small integers', function () {
    expect(detectCSVFieldType('1', name)).to.equal('int');
  });

  it('returns long for large integers', function () {
    expect(detectCSVFieldType('9223372036854775807', name)).to.equal('long');
  });

  it('returns date if the value matches the iso date regex', function () {
    expect(detectCSVFieldType('2023-01-04T16:22:59.453Z', name)).to.equal(
      'date'
    );
    expect(detectCSVFieldType('2023-01-04 16:22:59.453Z', name)).to.equal(
      'date'
    );
  });

  it('returns date if the value matches the dateonly date regex', function () {
    expect(detectCSVFieldType('2023-01-04', name)).to.equal('date');
  });

  it('returns uuid if the value matches the uuid regex', function () {
    expect(
      detectCSVFieldType('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', name)
    ).to.equal('uuid');
  });

  it('returns regex if the value matches the regex regex', function () {
    expect(detectCSVFieldType('/^ack/', name)).to.equal('regex');
    expect(detectCSVFieldType('/^acme/i', name)).to.equal('regex');
    expect(detectCSVFieldType('/pattern/imxs', name)).to.equal('regex');
  });

  it('returns ejson if the value looks like an ejson array', function () {
    expect(detectCSVFieldType('[1, 2, 3]', name)).to.equal('ejson');
    expect(detectCSVFieldType('["a", "b", "c"]', name)).to.equal('ejson');
  });

  it('returns ejson if the value looks like an ejson object', function () {
    expect(detectCSVFieldType('{"foo":1}', name)).to.equal('ejson');

    // These are bson types we don't have a specific way to serialize at the moment, so they become ejson
    expect(detectCSVFieldType('{"$code":"function() {}"}', name)).to.equal(
      'ejson'
    );
    expect(
      detectCSVFieldType(
        '{"$code":"function() {}","$scope":{"foo":1,"bar":"a"}}',
        name
      )
    ).to.equal('ejson');
    expect(detectCSVFieldType('{"$minKey":1}', name)).to.equal('ejson');
    expect(detectCSVFieldType('{"$maxKey":1}', name)).to.equal('ejson');
    expect(
      detectCSVFieldType(
        '{"$ref":"namespace","$id":{"$oid":"642af890571e13e609f9069a"}}',
        name
      )
    ).to.equal('ejson');
    expect(detectCSVFieldType('{"$symbol":"symbol"}', name)).to.equal('ejson');
  });

  it('returns string if a value looks like EJSON at first but does not parse', function () {
    expect(detectCSVFieldType('{foo:1}', name)).to.equal('string');
    expect(detectCSVFieldType("['foo']", name)).to.equal('string');
  });

  it('defaults to string for everything else', function () {
    expect(detectCSVFieldType('what even is this?', name)).to.equal('string');
  });
});

describe('placeValue', function () {
  it('places a simple value', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo'), 1);
    expect(doc).to.deep.equal({ foo: 1 });

    placeValue(doc, parseCSVHeaderName('bar'), 2);
    expect(doc).to.deep.equal({ foo: 1, bar: 2 });
  });

  it('places an object field', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo.bar'), 1);
    expect(doc).to.deep.equal({ foo: { bar: 1 } });

    placeValue(doc, parseCSVHeaderName('foo.baz'), 2);
    expect(doc).to.deep.equal({ foo: { bar: 1, baz: 2 } });
  });

  it('places a nested object field', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo.bar.baz'), 1);
    expect(doc).to.deep.equal({ foo: { bar: { baz: 1 } } });

    placeValue(doc, parseCSVHeaderName('foo.bar.qux'), 2);
    expect(doc).to.deep.equal({ foo: { bar: { baz: 1, qux: 2 } } });
  });

  it('places an array value', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo[0]'), 1);
    expect(doc).to.deep.equal({ foo: [1] });

    placeValue(doc, parseCSVHeaderName('foo[1]'), 2);
    expect(doc).to.deep.equal({ foo: [1, 2] });
  });

  it('places a nested array value', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo[0].bar[0]'), 1);
    expect(doc).to.deep.equal({ foo: [{ bar: [1] }] });

    placeValue(doc, parseCSVHeaderName('foo[0].bar[1]'), 2);
    expect(doc).to.deep.equal({ foo: [{ bar: [1, 2] }] });
  });

  it('places a multi-dimensional array value', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo[0][0]'), 1);
    expect(doc).to.deep.equal({ foo: [[1]] });

    placeValue(doc, parseCSVHeaderName('foo[0][1]'), 2);
    expect(doc).to.deep.equal({ foo: [[1, 2]] });
  });

  it('places a complex nested value', function () {
    const doc = {};
    placeValue(doc, parseCSVHeaderName('foo[0].bar.baz[0].qux'), 1);
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

    placeValue(doc, parseCSVHeaderName('foo[1].bar.baz[0].quux'), 2);
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
      placeValue({ foo: 1 }, parseCSVHeaderName('foo.bar'), 1)
    ).to.throw('parent must be an object');
  });

  it('throws when trying to place an object on top of an array', function () {
    expect(() =>
      placeValue({ foo: [1] }, parseCSVHeaderName('foo.bar'), 1)
    ).to.throw('parent must be an object');
  });

  it('throws when trying to place an array on top of a simple value', function () {
    expect(() =>
      placeValue({ foo: 1 }, parseCSVHeaderName('foo[0]'), 1)
    ).to.throw('parent must be an array');
  });

  it('throws when trying to place an array on top of an object', function () {
    expect(() =>
      placeValue({ foo: { bar: 1 } }, parseCSVHeaderName('foo[0]'), 1)
    ).to.throw('parent must be an array');
  });
});

function parseHeader(header: string[]): Record<string, PathPart[]> {
  const parsed: Record<string, PathPart[]> = {};
  for (const name of header) {
    parsed[name] = parseCSVHeaderName(name);
  }
  return parsed;
}

describe('makeDocFromCSV', function () {
  it('ignores empty strings if ignoreEmptyStrings is true', function () {
    const chunk = {
      a: '',
      b: '',
    };
    const header = ['a', 'b'];
    const parsedHeader = parseHeader(header);
    const included = { a: 'string', b: 'string' } as IncludedFields;

    const doc = makeDocFromCSV(chunk, header, parsedHeader, included, {
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

    const doc = makeDocFromCSV(chunk, header, parsedHeader, included, {
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

    const doc = makeDocFromCSV(chunk, header, parsedHeader, included, {
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
      makeDocFromCSV(chunk, header, parsedHeader, included, {
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

    const doc = makeDocFromCSV(chunk, header, parsedHeader, included, {
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
      makeDocFromCSV(chunk, header, parsedHeader, included, {
        ignoreEmptyStrings: true,
      })
    ).to.throw(Error, '"a" is not a number [Col 0]');
  });
});

describe('parseCSVValue', function () {
  it('parses int', function () {
    expect(parseCSVValue('123', 'int')).to.deep.equal(new Int32('123'));

    expect(() => parseCSVValue('abc', 'long')).to.throw(
      '"abc" is not a number'
    );
  });

  it('parses long', function () {
    expect(parseCSVValue('123', 'long')).to.deep.equal(new Long('123'));

    expect(() => parseCSVValue('abc', 'long')).to.throw(
      '"abc" is not a number'
    );
  });

  it('parses double', function () {
    expect(parseCSVValue('12.3', 'double')).to.deep.equal(
      new Double(parseFloat('12.3'))
    );

    expect(() => parseCSVValue('abc', 'double')).to.throw(
      Error,
      '"abc" is not a number'
    );
  });

  it('parses boolean', function () {
    expect(parseCSVValue('1', 'boolean')).to.deep.equal(true);
    expect(parseCSVValue('true', 'boolean')).to.deep.equal(true);
    expect(parseCSVValue('TRUE', 'boolean')).to.deep.equal(true);
    expect(parseCSVValue('True', 'boolean')).to.deep.equal(true);
    expect(parseCSVValue('t', 'boolean')).to.deep.equal(true);

    expect(parseCSVValue('0', 'boolean')).to.deep.equal(false);
    expect(parseCSVValue('false', 'boolean')).to.deep.equal(false);
    expect(parseCSVValue('FALSE', 'boolean')).to.deep.equal(false);
    expect(parseCSVValue('False', 'boolean')).to.deep.equal(false);
    expect(parseCSVValue('f', 'boolean')).to.deep.equal(false);

    // anything else is true due to the fallback of Boolean(value)
    expect(parseCSVValue('yes', 'boolean')).to.deep.equal(true);
    expect(parseCSVValue('no', 'boolean')).to.deep.equal(true);
  });

  it('parses date', function () {
    expect(
      parseCSVValue('2023-01-04T16:22:59.453Z', 'date')?.toString()
    ).to.deep.equal(new Date('2023-01-04T16:22:59.453Z').toString());

    // same thing without the T
    expect(
      parseCSVValue('2023-01-04 16:22:59.453Z', 'date')?.toString()
    ).to.deep.equal(new Date('2023-01-04T16:22:59.453Z').toString());

    // number
    expect(parseCSVValue('1648425600000', 'date')?.toString()).to.deep.equal(
      new Date(+'1648425600000').toString()
    );

    // date only
    expect(parseCSVValue('2023-01-04', 'date')?.toString()).to.deep.equal(
      new Date('2023-01-04').toString()
    );

    expect(() => parseCSVValue('abc', 'date')).to.throw('"abc" is not a date');
  });

  it('parses null', function () {
    // How compass/mongoexport exports null
    expect(parseCSVValue('null', 'null')).to.deep.equal(null);
    expect(parseCSVValue('Null', 'null')).to.deep.equal(null);
    expect(parseCSVValue('NULL', 'null')).to.deep.equal(null);

    expect(() => parseCSVValue('dsfsd', 'null')).to.throw(
      '"dsfsd" is not null'
    );
  });

  it('parses string', function () {
    expect(parseCSVValue('123', 'string')).to.deep.equal('123');
  });

  it('parses binData', function () {
    expect(parseCSVValue('123', 'binData')).to.deep.equal(
      new Binary(Buffer.from('123', 'base64'), Binary.SUBTYPE_DEFAULT)
    );
  });

  it('parses uuid', function () {
    expect(
      parseCSVValue('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA', 'uuid')
    ).to.deep.equal(new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'));
  });

  it('parses md5', function () {
    expect(parseCSVValue('1', 'md5')).to.deep.equal(
      new Binary(Buffer.from('1', 'base64'), Binary.SUBTYPE_MD5)
    );
  });

  it('parses objectId', function () {
    expect(() => parseCSVValue('1', 'objectId')).to.throw(
      '"1" is not an ObjectId'
    );
    expect(parseCSVValue('63dbc32d12a39d2a72941813', 'objectId')).to.deep.equal(
      new ObjectId('63dbc32d12a39d2a72941813')
    );

    expect(
      parseCSVValue('ObjectId(63dbc32d12a39d2a72941813)', 'objectId')
    ).to.deep.equal(new ObjectId('63dbc32d12a39d2a72941813'));
  });

  it('parses regex', function () {
    expect(parseCSVValue('/^ack/', 'regex')).to.deep.equal(
      new BSONRegExp('^ack')
    );
    expect(parseCSVValue('/^acme/i', 'regex')).to.deep.equal(
      new BSONRegExp('^acme', 'i')
    );
    expect(parseCSVValue('/pattern/imxs', 'regex')).to.deep.equal(
      new BSONRegExp('pattern', 'imxs')
    );
  });

  it('parses timestamp', function () {
    expect(parseCSVValue('18446744073709551615', 'timestamp')).to.deep.equal(
      Timestamp.fromString('18446744073709551615', 10)
    );

    // internally Long will turn NaN into 0
    expect(() => parseCSVValue('abc', 'timestamp')).throw(
      '"abc" is not a number'
    );
  });

  it('parses decimal', function () {
    expect(() => parseCSVValue('e+02', 'decimal')).to.throw(BSONError);
    expect(
      parseCSVValue('9.999999999999999999999999999999999E+6144', 'decimal')
    ).to.deep.equal(
      Decimal128.fromString('9.999999999999999999999999999999999E+6144')
    );
  });

  it('parses ejson', function () {
    expect(parseCSVValue('{"foo":1}', 'ejson')).to.deep.equal({ foo: 1 });

    expect(parseCSVValue('{"$code":"function() {}"}', 'ejson')).to.deep.equal(
      new Code('function() {}')
    );
    expect(
      parseCSVValue(
        '{"$code":"function() {}","$scope":{"foo":1,"bar":"a"}}',
        'ejson'
      )
    ).to.deep.equal(new Code('function() {}', { foo: 1, bar: 'a' }));
    expect(parseCSVValue('{"$minKey":1}', 'ejson')).to.deep.equal(new MinKey());
    expect(parseCSVValue('{"$maxKey":1}', 'ejson')).to.deep.equal(new MaxKey());
    expect(
      parseCSVValue(
        '{"$ref":"namespace","$id":{"$oid":"642af890571e13e609f9069a"}}',
        'ejson'
      )
    ).to.deep.equal(new DBRef('namespace', new ObjectId()));

    expect(parseCSVValue('{"$symbol":"symbol"}', 'ejson')).to.deep.equal(
      new BSONSymbol('symbol')
    );
  });

  it('parses minkey', function () {
    expect(parseCSVValue('$MinKey', 'minKey')).to.deep.equal(new MinKey());
    expect(() => parseCSVValue('$MaxKey', 'minKey')).to.throw(
      '"$MaxKey" is not $MinKey'
    );
  });

  it('parses maxkey', function () {
    expect(parseCSVValue('$MaxKey', 'maxKey')).to.deep.equal(new MaxKey());
    expect(() => parseCSVValue('$MinKey', 'maxKey')).to.throw(
      '"$MinKey" is not $MaxKey'
    );
  });

  it('leaves all other bson types as strings', function () {
    expect(parseCSVValue('foo', 'string')).to.deep.equal('foo');
  });
});

describe('parseCSVHeaderName', function () {
  it('parses a simple path', function () {
    expect(parseCSVHeaderName('foo')).to.deep.equal([
      { type: 'field', name: 'foo' },
    ]);
  });

  it('parses an object path', function () {
    expect(parseCSVHeaderName('foo.bar')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: 'bar' },
    ]);
  });

  it('parses a nested object path', function () {
    expect(parseCSVHeaderName('foo.bar.baz')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: 'bar' },
      { type: 'field', name: 'baz' },
    ]);
  });

  it('parses an array path', function () {
    expect(parseCSVHeaderName('foo[99]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 99 },
    ]);
  });

  it('parses a nested array path', function () {
    expect(parseCSVHeaderName('foo[99].bar[3]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 99 },
      { type: 'field', name: 'bar' },
      { type: 'index', index: 3 },
    ]);
  });

  it('parses a multidimensional array path', function () {
    expect(parseCSVHeaderName('foo[3][4]')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 3 },
      { type: 'index', index: 4 },
    ]);
  });

  it('parses a complex path', function () {
    expect(parseCSVHeaderName('foo[3].bar[4].baz')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'index', index: 3 },
      { type: 'field', name: 'bar' },
      { type: 'index', index: 4 },
      { type: 'field', name: 'baz' },
    ]);
  });

  it('deals with empty field names', function () {
    expect(parseCSVHeaderName('')).to.deep.equal([{ type: 'field', name: '' }]);

    expect(parseCSVHeaderName('[3]')).to.deep.equal([
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
    ]);

    expect(parseCSVHeaderName('[3].')).to.deep.equal([
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
      { type: 'field', name: '' },
    ]);

    expect(parseCSVHeaderName('foo..')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: '' },
      { type: 'field', name: '' },
    ]);

    expect(parseCSVHeaderName('foo.[3].')).to.deep.equal([
      { type: 'field', name: 'foo' },
      { type: 'field', name: '' },
      { type: 'index', index: 3 },
      { type: 'field', name: '' },
    ]);

    expect(parseCSVHeaderName('....')).to.deep.equal([
      { type: 'field', name: '' },
      { type: 'field', name: '' },
      { type: 'field', name: '' },
      { type: 'field', name: '' },
      { type: 'field', name: '' },
    ]);
  });

  it('ignores array indexes that are not numbers', function () {
    expect(parseCSVHeaderName('[foo]')).to.deep.equal([
      { type: 'field', name: '[foo]' },
    ]);
    expect(parseCSVHeaderName('[foo')).to.deep.equal([
      { type: 'field', name: '[foo' },
    ]);
    expect(parseCSVHeaderName('["foo"]')).to.deep.equal([
      { type: 'field', name: '["foo"]' },
    ]);
    expect(parseCSVHeaderName("['foo']")).to.deep.equal([
      { type: 'field', name: "['foo']" },
    ]);

    expect(parseCSVHeaderName('Size [m]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
    ]);
    expect(parseCSVHeaderName('Size [m][0]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'index', index: 0 },
    ]);

    expect(parseCSVHeaderName('Size [m].foo')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'field', name: 'foo' },
    ]);

    expect(parseCSVHeaderName('Size [s][m][l].foo')).to.deep.equal([
      { type: 'field', name: 'Size [s][m][l]' },
      { type: 'field', name: 'foo' },
    ]);
    expect(parseCSVHeaderName('Size [m].[0]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'field', name: '' },
      { type: 'index', index: 0 },
    ]);
    expect(parseCSVHeaderName('Size [m].foo[0]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'field', name: 'foo' },
      { type: 'index', index: 0 },
    ]);
    expect(parseCSVHeaderName('Size [m].[0')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'field', name: '' },
      { type: 'index', index: 0 },
    ]);

    expect(parseCSVHeaderName('Size [m][1000]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'index', index: 1000 },
    ]);

    expect(parseCSVHeaderName('Size [m][0][1]')).to.deep.equal([
      { type: 'field', name: 'Size [m]' },
      { type: 'index', index: 0 },
      { type: 'index', index: 1 },
    ]);

    expect(parseCSVHeaderName('[][][][][]')).to.deep.equal([
      { type: 'field', name: '[][][][][]' },
    ]);

    expect(parseCSVHeaderName('Size [.foo')).to.deep.equal([
      { type: 'field', name: 'Size [.foo' },
    ]);
  });
});

describe('formatCSVHeaderName', function () {
  it('joins path parts together', function () {
    const pathParts: PathPart[] = [
      { type: 'field', name: 'foo' },
      { type: 'index', index: 0 },
      { type: 'field', name: 'bar' },
      { type: 'index', index: 1 },
      { type: 'index', index: 2 },
    ];

    expect(formatCSVHeaderName(pathParts)).to.equal('foo[0].bar[1][2]');
  });
});

function compareTypes(
  selectedType: CSVParsableFieldType,
  types: (CSVParsableFieldType | 'undefined')[],
  expected: (CSVParsableFieldType | 'undefined')[]
) {
  types.sort();
  expected.sort();
  try {
    expect(types, selectedType).to.deep.equal(expected);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.dir(types);
    throw err;
  }
}

describe('isCompatibleCSVFieldType', function () {
  for (const selectedType of parsableFieldTypes) {
    it(`works for ${selectedType}`, function () {
      const valid: (CSVParsableFieldType | 'undefined')[] = [];
      for (const type of [...detectableFieldTypes, 'undefined'] as (
        | CSVDetectableFieldType
        | 'undefined'
      )[]) {
        if (isCompatibleCSVFieldType(selectedType, type)) {
          valid.push(type);
        }
      }

      switch (selectedType) {
        case 'int':
          compareTypes(selectedType, valid, ['int', 'undefined']);
          break;

        case 'long':
          compareTypes(selectedType, valid, ['int', 'long', 'undefined']);
          break;

        case 'double':
          compareTypes(selectedType, valid, [
            'double',
            'int',
            'long',
            'undefined',
          ]);
          break;

        case 'boolean':
          compareTypes(selectedType, valid, ['boolean', 'undefined']);
          break;

        case 'date':
          compareTypes(selectedType, valid, [
            'date',
            'double',
            'int',
            'long',
            'string',
            'undefined',
          ]);
          break;

        case 'string':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        case 'null':
          compareTypes(selectedType, valid, ['null', 'undefined']);
          break;

        case 'objectId':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        case 'binData':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        case 'uuid':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        case 'md5':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        case 'timestamp':
          compareTypes(selectedType, valid, ['long', 'undefined']);
          break;

        case 'decimal':
          compareTypes(selectedType, valid, [
            'double',
            'int',
            'long',
            'undefined',
          ]);
          break;

        case 'regex':
          compareTypes(selectedType, valid, ['regex', 'undefined']);
          break;

        case 'minKey':
          compareTypes(selectedType, valid, ['minKey', 'undefined']);
          break;

        case 'maxKey':
          compareTypes(selectedType, valid, ['maxKey', 'undefined']);
          break;

        case 'ejson':
          compareTypes(selectedType, valid, ['ejson', 'undefined']);
          break;

        case 'number':
          compareTypes(selectedType, valid, [
            'double',
            'int',
            'long',
            'undefined',
          ]);
          break;

        case 'mixed':
          compareTypes(selectedType, valid, [
            'boolean',
            'date',
            'double',
            'ejson',
            'int',
            'long',
            'maxKey',
            'minKey',
            'null',
            'objectId',
            'regex',
            'string',
            'undefined',
            'uuid',
          ]);
          break;

        default:
          throw new Error(`Missing case for ${selectedType}`);
      }
    });
  }
});

describe('findBrokenCSVTypeExample', function () {
  it('returns the first detected field type that is not compatible', function () {
    const types = {
      string: {
        count: 1,
        firstRowIndex: 0,
        firstColumnIndex: 0,
        firstValue: 'foo',
      },
    } as Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>;

    expect(findBrokenCSVTypeExample(types, 'int')).to.deep.equal({
      count: 1,
      firstRowIndex: 0,
      firstColumnIndex: 0,
      firstValue: 'foo',
    });
  });

  it('returns null if all detected field types are compatible', function () {
    const types = {
      string: {
        count: 1,
        firstRowIndex: 0,
        firstColumnIndex: 0,
        firstValue: 'foo',
      },
    } as Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>;

    expect(findBrokenCSVTypeExample(types, 'string')).to.deep.equal(null);
  });
});
