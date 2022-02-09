import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react-hooks';
import { useGridFilters, useFilteredItems } from './use-grid-filters';

import { queries, pipelines } from '../../test/fixtures';

const items = [...queries, ...pipelines];

describe('use-grid-header', function () {
  describe('renders view correctly', function () {
    it('should render search input', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      expect(async () => {
        await screen.findByText('search');
      }).to.not.throw;
    });
    it('should render database and collection selects', function () {
      const { result } = renderHook(() => useGridFilters(items));
      const { rerender } = render(result.current.controls);
      expect(screen.getByText('All databases')).to.exist;
      expect(screen.getByText('All collections')).to.exist;

      // Open the database dropdown
      userEvent.click(screen.getByRole('button', { name: /all databases/i }));
      items.forEach((item) => {
        expect(
          screen.getByText(item.database),
          `it shows ${item.database} - database`
        ).to.exist;
      });

      // Select the database
      userEvent.click(screen.getByRole('option', { name: /airbnb/i }));

      rerender(result.current.controls);

      userEvent.click(screen.getByRole('button', { name: /all collections/i }));

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
    it('should not filter when input is empty', function () {
      const { result } = renderHook(() => useGridFilters(items));

      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: '' } });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.deep.equal(items);
    });

    it('should filter items by search text - database name', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'airbnb' } });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.have.length(4);
    });

    it('should filter items by search text - collection name', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'listings' } });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.have.length(3);
    });

    it('should filter items by search text - filter key', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'host_location' } });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.have.length(4);
    });

    it('should not filter items by search text - sort key (num_of_host_spaces)', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, {
        target: { value: 'num_of_host_spaces' },
      });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.have.length(0);
    });

    it('should filter items by search text', function () {
      const { result } = renderHook(() => useGridFilters(items));
      render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'beds' } });
      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);
      expect(gridItems).to.have.length(2); // matches best (in name)
    });
  });

  describe('filters items by database/collection selects', function () {
    it('should filter items by database/collection', function () {
      const { result } = renderHook(() => useGridFilters(items));
      const { rerender } = render(result.current.controls);

      const { database, collection } = items[0];
      // select database
      userEvent.click(screen.getByRole('button', { name: /all databases/i }));
      userEvent.click(screen.getByRole('option', { name: database }));
      rerender(result.current.controls);
      // select collection
      userEvent.click(screen.getByRole('button', { name: /all collections/i }));
      userEvent.click(screen.getByRole('option', { name: collection }));

      const filteredItems = [...items]
        .filter(
          (item) => item.database === database && item.collection === collection
        )
        .sort((a, b) => a.lastModified - b.lastModified);

      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      )
        .result.current.map((x) => x.item)
        .sort((a, b) => a.lastModified - b.lastModified);

      expect(gridItems).to.deep.equal(filteredItems);
    });
  });

  describe('filters items by text and dropdown/collection selects', function () {
    it('should filter items by database/collection and text search', function () {
      const { result } = renderHook(() => useGridFilters(items));
      const { rerender } = render(result.current.controls);
      const searchInput = screen.getByPlaceholderText(/search/i);

      fireEvent.change(searchInput, { target: { value: 'berlin' } });

      // select database
      userEvent.click(screen.getByRole('button', { name: /all databases/i }));
      userEvent.click(screen.getByRole('option', { name: /airbnb/i }));
      rerender(result.current.controls);

      rerender(result.current.controls);

      // select collection
      userEvent.click(screen.getByRole('button', { name: /all collections/i }));
      userEvent.click(screen.getByRole('option', { name: /listings/i }));

      const gridItems = renderHook(() =>
        useFilteredItems(
          items,
          result.current.conditions,
          result.current.search
        )
      ).result.current.map((x) => x.item);

      expect(
        gridItems,
        'it should filter items by database and collection'
      ).to.have.length(2);
    });
  });
});
