import { expect } from 'chai';
import { getQueryAttributes } from './get-query-attributes';

describe('get-query-attributes', function () {
  it('removes falsy values', function () {
    expect(getQueryAttributes({})).to.deep.equal({});
    expect(getQueryAttributes({ filter: '' })).to.deep.equal({});
    expect(
      getQueryAttributes({ filter: undefined, skip: 0, limit: 0 })
    ).to.deep.equal({});
  });

  it('keeps query strings and numbers', function () {
    expect(
      getQueryAttributes({
        filter: "{ name: /berlin/, _id: ObjectId('507f1f77bcf86cd799439011') }",
        sort: '{ name: 1 }',
        skip: 1,
        limit: 20,
        update: '{ $set: { a: 1 } }',
        hint: '{ $natural: 1 }',
      })
    ).to.deep.equal({
      filter: "{ name: /berlin/, _id: ObjectId('507f1f77bcf86cd799439011') }",
      sort: '{ name: 1 }',
      skip: 1,
      limit: 20,
      update: '{ $set: { a: 1 } }',
      hint: '{ $natural: 1 }',
    });
  });

  it('only keeps query attributes', function () {
    expect(
      getQueryAttributes({
        filter: '{ a: 1 }',
        _id: '0f92b5fa-19fe-4200-a4bb-d25765bce8a2',
        _ns: 'db.coll',
      } as Parameters<typeof getQueryAttributes>[0])
    ).to.deep.equal({ filter: '{ a: 1 }' });
  });
});
