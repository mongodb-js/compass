import { expect } from 'chai';
import { useFilteredItems } from './use-grid-filters';

import { queries, aggregations } from '../../tests/fixtures';

const items = [...queries, ...aggregations];

describe('use-grid-filters', function () {
  it('it should not filter items when no filter is used', function () {
    expect(useFilteredItems(items, {}, ''), '').to.have.length(items.length);
  });

  it('should filter items by conditions', function () {
    expect(
      useFilteredItems(items, { database: 'airbnb' }, ''),
      'it should filter items by database'
    ).to.have.length(items.filter((x) => x.database === 'airbnb').length);

    expect(
      useFilteredItems(items, { collection: 'hosts' }, ''),
      'it should filter items by collection'
    ).to.have.length(items.filter((x) => x.collection === 'hosts').length);

    expect(
      useFilteredItems(
        items,
        { database: 'airbnb', collection: 'listings' },
        ''
      ),
      'it should filter items by database and collection'
    ).to.have.length(
      items.filter(
        (x) => x.database === 'airbnb' && x.collection === 'listings'
      ).length
    );
  });

  it('should filter items by search text', function () {
    expect(
      useFilteredItems(items, {}, 'airbnb'),
      'it should filter items by search text - database name'
    ).to.have.length(4);

    expect(
      useFilteredItems(items, {}, 'listings'),
      'it should filter items by search text - collection name'
    ).to.have.length(3);

    expect(
      useFilteredItems(items, {}, 'host_location'),
      'it should filter items by search text - filter key'
    ).to.have.length(4);

    expect(
      useFilteredItems(items, {}, 'reviews'),
      'it should filter items by search text - sort key (reviews)'
    ).to.have.length(3);

    expect(
      useFilteredItems(items, {}, 'beds'),
      'it should filter items by search text - sort & project key (beds)'
    ).to.have.length(3); // matches beds + berlin
  });

  it('should filter items by conditions and search text', function () {
    expect(
      useFilteredItems(
        items,
        { database: 'airbnb', collection: 'listings' },
        'berlin'
      ),
      'it should filter items by database and collection'
    ).to.have.length(2);
  });
});
