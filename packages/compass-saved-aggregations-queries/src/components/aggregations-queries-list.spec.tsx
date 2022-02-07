import React from 'react';
import { expect } from 'chai';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import type { RootState } from '../stores/index';

import AggregationsQueriesList from './aggregations-queries-list';
import { queries, aggregations } from '../../tests/fixtures';

const items = [...queries, ...aggregations];
const mockStore = configureStore<RootState>([thunk]);

const initialState = {
  savedItems: { items, loading: false },
  dataService: {},
  instance: {},
  openItem: {},
} as RootState;

describe('aggregations-queries-list', function () {
  describe('renders view correctly', function () {
    beforeEach(function () {
      const store = mockStore(initialState);
      render(
        <Provider store={store}>
          <AggregationsQueriesList />
        </Provider>
      );
    });
    it('should render search input', function () {
      expect(async () => {
        await screen.findByText('search');
      }).to.not.throw;
    });
    it('should render database select', function () {
      const databaseSelect = screen.getByText('All databases');
      expect(databaseSelect).to.exist;
      // Open the database dropdown
      fireEvent.click(databaseSelect);
      items.forEach((item) => {
        expect(
          screen.getByRole('option', {
            name: item.database,
          }),
          `it shows ${item.database} - database`
        ).to.exist;
      });
    });
    it('should render collection select', function () {
      const collectionSelect = screen.getByText('All collections');
      expect(collectionSelect).to.exist;
      fireEvent.click(screen.getByText('All databases'));
      fireEvent.click(
        screen.getByRole('option', {
          name: 'airbnb',
        })
      );
      // Open the collection dropdown
      fireEvent.click(collectionSelect);
      items
        .filter((x) => x.database === 'airbnb')
        .forEach((item) => {
          expect(
            screen.getByRole('option', {
              name: item.collection,
            }),
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
    it('should render list items', function () {
      items.forEach((item) => {
        expect(screen.getByText(item.name)).to.exist;
      });
    });
  });
  describe('filters items by database/collection selects', function () {
    beforeEach(function () {
      const store = mockStore(initialState);
      render(
        <Provider store={store}>
          <AggregationsQueriesList />
        </Provider>
      );
    });

    it('should filter items by database/collection', function () {
      const { database, collection } = items[0];
      // select database
      fireEvent.click(screen.getByText('All databases'));
      fireEvent.click(
        screen.getByRole('option', {
          name: database,
        })
      );
      // select collection
      fireEvent.click(screen.getByText('All collections'));
      fireEvent.click(
        screen.getByRole('option', {
          name: collection,
        })
      );

      const expectedItems = [...items].filter(
        (item) => item.database === database && item.collection === collection
      );

      expectedItems.forEach((item) => {
        expect(screen.getByText(item.name)).to.exist;
      });
    });
  });
});
