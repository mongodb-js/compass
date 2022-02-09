import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import proxyquire from 'proxyquire';

import type { RootState } from '../stores/index';
import { queries, pipelines } from '../../test/fixtures';
import { createProxyquireMockForQueriesAndAggregationsPlugins } from '../../test/mock';

const { default: AggregationsQueriesList }: any = proxyquire.load(
  './aggregations-queries-list',
  {
    ...(createProxyquireMockForQueriesAndAggregationsPlugins([], []) as any),
    react: Object.assign(React, {
      '@global': true,
      '@noCallThru': true,
    }),
  }
);

const items = [...queries, ...pipelines];
const mockStore = configureStore<RootState>([thunk]);

const initialState = {
  savedItems: { items, loading: false },
  dataService: {},
  instance: {},
  openItem: {},
} as RootState;

describe('aggregations-queries-list', function () {
  beforeEach(function () {
    const store = mockStore(initialState);
    render(
      <Provider store={store}>
        <AggregationsQueriesList />
      </Provider>
    );
  });

  it('should render list items', function () {
    items.forEach((item) => {
      expect(screen.getByText(item.name)).to.exist;
    });
  });

  it('should filter items by database/collection', function () {
    const { database, collection } = items[0];
    // select database
    userEvent.click(screen.getByText('All databases'), undefined, {
      skipPointerEventsCheck: true,
    });
    userEvent.click(
      screen.getByRole('option', {
        name: database,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );
    // select collection
    userEvent.click(screen.getByText('All collections'), undefined, {
      skipPointerEventsCheck: true,
    });
    userEvent.click(
      screen.getByRole('option', {
        name: collection,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    const expectedItems = [...items].filter(
      (item) => item.database === database && item.collection === collection
    );

    expectedItems.forEach((item) => {
      expect(screen.getByText(item.name)).to.exist;
    });
  });
});
