import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGridFilters, useFilteredItems } from './use-grid-filters';

import type { Item } from '../stores/aggregations-queries-items';
import { queries, aggregations } from '../../tests/fixtures';

const items = [...queries, ...aggregations];

let gridItems: Item[];

const GridFilter = () => {
  const [filterControls, selectConditions, search] = useGridFilters(items);
  gridItems = useFilteredItems(items, selectConditions, search)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.item);
  return <>{filterControls}</>;
};

describe('use-grid-header', function () {
  describe('renders view correctly', function () {
    beforeEach(function () {
      render(<GridFilter />);
    });
    it('should render search input', function () {
      expect(async () => {
        await screen.findByText('search');
      }).to.not.throw;
    });
    it('should render database and collection selects', function () {
      expect(screen.getByText('All databases')).to.exist;
      expect(screen.getByText('All collections')).to.exist;

      // Open the database dropdown
      fireEvent.click(screen.getByText('All databases'));
      items.forEach((item) => {
        expect(
          screen.getByText(item.database),
          `it shows ${item.database} - database`
        ).to.exist;
      });

      // Select the database
      fireEvent.click(screen.getByText('airbnb'));
      // Open the collection dropdown
      fireEvent.click(screen.getByText('All collections'));
      items
        .filter((x) => x.database === 'airbnb')
        .forEach((item) => {
          expect(
            screen.getByText(item.collection),
            `it shows ${item.collection} - collection`
          ).to.exist;
        });
    });
  });

  describe('filters items by text search', function () {
    let searchInput;
    beforeEach(function () {
      render(<GridFilter />);
      searchInput = screen.getByPlaceholderText(/search/i);
    });

    it('should not filter when input is empty', function () {
      const expectedItems = [...gridItems];
      expect(expectedItems).to.deep.equal(items);
    });

    it('should filter items by search text - database name', function () {
      fireEvent.change(searchInput, { target: { value: 'airbnb' } });
      expect(gridItems).to.have.length(4);
    });

    it('should filter items by search text - collection name', function () {
      fireEvent.change(searchInput, { target: { value: 'listings' } });
      expect(gridItems).to.have.length(3);
    });

    it('should filter items by search text - filter key', function () {
      fireEvent.change(searchInput, { target: { value: 'host_location' } });
      expect(gridItems).to.have.length(4);
    });

    it('should not filter items by search text - sort key (num_of_host_spaces)', function () {
      fireEvent.change(searchInput, {
        target: { value: 'num_of_host_spaces' },
      });
      expect(gridItems).to.have.length(0);
    });

    it('should filter items by search text', function () {
      fireEvent.change(searchInput, { target: { value: 'beds' } });
      expect(gridItems).to.have.length(2); // matches best (in name)
    });
  });

  describe('filters items by database/collection selects', function () {
    beforeEach(function () {
      render(<GridFilter />);
    });

    it('should filter items by database/collection', function () {
      const { database, collection } = items[0];
      // select database
      fireEvent.click(screen.getByText('All databases'));
      fireEvent.click(screen.getByText(database));
      // select collection
      fireEvent.click(screen.getByText('All collections'));
      fireEvent.click(screen.getByText(collection));

      const filteredItems = [...items]
        .filter(
          (item) => item.database === database && item.collection === collection
        )
        .sort((a, b) => a.lastModified - b.lastModified);
      const expectedItems = [...gridItems].sort(
        (a, b) => a.lastModified - b.lastModified
      );

      expect(filteredItems).to.deep.equal(expectedItems);
    });
  });

  describe('filters items by text and dropdown/collection selects', function () {
    beforeEach(function () {
      render(<GridFilter />);
    });

    it('should filter items by database/collection and text search', function () {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'berlin' } });

      // select database
      fireEvent.click(screen.getByText('All databases'));
      fireEvent.click(screen.getByText('airbnb'));
      // select collection
      fireEvent.click(screen.getByText('All collections'));
      fireEvent.click(screen.getByText('listings'));

      expect(
        gridItems,
        'it should filter items by database and collection'
      ).to.have.length(2);
    });
  });
});
