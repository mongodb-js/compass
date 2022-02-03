import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import { useGridHeader } from './use-grid-header';

import type { Item } from '../stores/aggregations-queries-items';
import { queries, aggregations } from '../../tests/fixtures';

const items = [...queries, ...aggregations];

let gridItems: Item[];

const GridHeader = () => {
  const grid = useGridHeader(items);
  gridItems = grid[1];
  return React.createElement(grid[0]);
};

describe('use-grid-header', function () {
  describe('renders view correctly', function () {
    beforeEach(function () {
      render(<GridHeader />);
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
    it('should render sort select', function () {
      expect(screen.getByLabelText('Sort by')).to.exist;

      expect(screen.getByText('Name'), 'Name is the default sort').to.exist;

      // Open the sort dropdown
      fireEvent.click(
        screen.getByText('Name', {
          selector: 'div',
        })
      );
      ['Name', 'Last Modified'].forEach((item) => {
        expect(
          screen.getByText(item, {
            selector: 'span',
          }),
          `it shows ${item} sort option`
        ).to.exist;
      });
    });
  });

  describe('filters/sorts items correctly', function () {
    beforeEach(function () {
      render(<GridHeader />);
    });

    it('should sort items - name', function () {
      // asc order
      let sortedItems = [...items].sort(
        (a, b) => a.name.localeCompare(b.name) * 1
      );
      gridItems.forEach((gridItem, index) => {
        expect(sortedItems[index].id).to.equal(gridItem.id);
      });

      fireEvent.click(
        screen.getByRole('img', {
          name: /sort ascending icon/i,
        })
      );

      // desc order
      sortedItems = [...items].sort(
        (a, b) => a.name.localeCompare(b.name) * -1
      );
      gridItems.forEach((gridItem, index) => {
        expect(sortedItems[index].id).to.equal(gridItem.id);
      });

      expect(
        screen.getByRole('img', {
          name: /sort descending icon/i,
        })
      ).to.exist;
    });

    it('should sort items - last modified', function () {
      // Open the sort dropdown
      fireEvent.click(
        screen.getByText('Name', {
          selector: 'div',
        })
      );
      fireEvent.click(
        screen.getByText('Last Modified', {
          selector: 'span',
        })
      );

      // asc order
      let sortedItems = [...items].sort(
        (a, b) => a.lastModified - b.lastModified
      );
      gridItems.forEach((gridItem, index) => {
        expect(sortedItems[index].id).to.equal(gridItem.id);
      });

      fireEvent.click(
        screen.getByRole('img', {
          name: /sort ascending icon/i,
        })
      );

      // desc order
      sortedItems = [...items].sort((a, b) => b.lastModified - a.lastModified);
      gridItems.forEach((gridItem, index) => {
        expect(sortedItems[index].id).to.equal(gridItem.id);
      });

      expect(
        screen.getByRole('img', {
          name: /sort descending icon/i,
        })
      ).to.exist;
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

    it('should filter items by text search');
    it('should filter items by database/collection and text search');
  });
});
