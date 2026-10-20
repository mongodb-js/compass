import { expect } from 'chai';

import { formatQuery } from './';

describe('formatQuery [Utils]', function () {
  it('combines the query strings into a single query', function () {
    expect(formatQuery({ filter: '{ a: 1 }', limit: 10 })).to.equal(
      '{\n  filter: { a: 1 },\n  limit: 10\n}'
    );
  });

  it('keeps BSON values and comments', function () {
    expect(
      formatQuery({
        filter: `{
  // a comment
  _id: ObjectId('507f1f77bcf86cd799439011'),
  count: NumberLong('9007199254740993'),
  date: ISODate('2020-01-01T00:00:00.000Z'),
  bin: BinData(0, 'AAEC'),
  min: MinKey(),
  decimal: NumberDecimal('0.00'),
  ts: Timestamp({ t: 1000, i: 0 }),
  name: /test/i
}`,
        sort: "[['count', -1]]",
      })
    ).to.equal(`{
  filter: {
    // a comment
    _id: ObjectId("507f1f77bcf86cd799439011"),
    count: NumberLong("9007199254740993"),
    date: ISODate("2020-01-01T00:00:00.000Z"),
    bin: BinData(0, "AAEC"),
    min: MinKey(),
    decimal: NumberDecimal("0.00"),
    ts: Timestamp({ t: 1000, i: 0 }),
    name: /test/i
  },
  sort: [["count", -1]]
}`);
  });

  it('handles values that end with a line comment', function () {
    expect(formatQuery({ filter: '{ a: 1 } // comment', limit: 10 })).to.equal(
      '{\n  filter: { a: 1 }, // comment\n  limit: 10\n}'
    );
  });

  it('returns the unformatted query if it can not be parsed', function () {
    expect(formatQuery({ filter: '{ a: ', limit: 10 })).to.equal(
      '{\nfilter: { a: \n,limit: 10\n}'
    );
  });
});
