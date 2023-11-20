import { expect } from 'chai';
import { getQueryAttributes } from './get-query-attributes';

describe('get-query-attributes', function () {
  it('removes falsy values', function () {
    expect(getQueryAttributes({})).to.deep.equal({});
    expect(getQueryAttributes({ filter: {} })).to.deep.equal({});
    expect(
      getQueryAttributes({ filter: {}, project: {}, limit: 0 })
    ).to.deep.equal({});
    expect(
      getQueryAttributes({ filter: undefined, skip: 0, limit: 0 })
    ).to.deep.equal({});
  });

  it('keeps valid values', function () {
    expect(getQueryAttributes({ filter: { name: /berlin/ } })).to.deep.equal({
      filter: {
        name: /berlin/,
      },
    });

    expect(
      getQueryAttributes({
        filter: { name: /berlin/ },
        sort: { name: 1 },
        skip: 1,
        limit: 20,
        update: { $set: { a: 1 } },
      })
    ).to.deep.equal({
      filter: {
        name: /berlin/,
      },
      sort: { name: 1 },
      skip: 1,
      limit: 20,
      update: { $set: { a: 1 } },
    });
  });
});
