import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import type { RegularIndex } from '../../modules/regular-indexes';
import type Store from '../../stores';
import Indexes from './indexes';
import { setupStore } from '../../../test/setup-store';

const renderIndexes = (props: Partial<typeof Store> = {}) => {
  const store = setupStore();

  const allProps: Partial<typeof Store> = {
    regularIndexes: { indexes: [], error: null, isRefreshing: false },
    searchIndexes: { indexes: [], error: null, status: 'PENDING' },
    refreshRegularIndexes: () => {},
    refreshSearchIndexes: () => {},
    ...props,
  };

  Object.assign(store.getState(), allProps);

  render(
    <Provider store={store}>
      <Indexes />
    </Provider>
  );
};

describe('Indexes Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders indexes card', function () {
    renderIndexes();
    expect(screen.getByTestId('indexes')).to.exist;
  });

  it('renders indexes toolbar', function () {
    renderIndexes();
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('renders indexes toolbar when there is a regular indexes error', function () {
    renderIndexes({
      regularIndexes: {
        indexes: [],
        error: 'Some random error',
        isRefreshing: false,
      },
    });
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('renders indexes toolbar when there is a search indexes error', function () {
    renderIndexes({
      searchIndexes: {
        indexes: [],
        error: 'Some random error',
        status: 'ERROR',
      },
    });
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('renders indexes list', function () {
    renderIndexes({
      regularIndexes: {
        indexes: [
          {
            ns: 'db.coll',
            cardinality: 'single',
            name: '_id_',
            size: 12,
            relativeSize: 20,
            type: 'hashed',
            extra: {},
            properties: ['unique'],
            fields: [
              {
                field: '_id',
                value: 1,
              },
            ],
            usageCount: 20,
          },
        ] as RegularIndex[],
        error: null,
        isRefreshing: false,
      },
    });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    expect(within(indexesList).getByTestId('index-row-_id_')).to.exist;
  });

  it('renders indexes list with in progress index', function () {
    renderIndexes({
      regularIndexes: {
        indexes: [
          {
            ns: 'db.coll',
            cardinality: 'single',
            name: '_id_',
            size: 12,
            relativeSize: 20,
            type: 'hashed',
            extra: {},
            properties: ['unique'],
            fields: [
              {
                field: '_id',
                value: 1,
              },
            ],
            usageCount: 20,
          },
          {
            ns: 'db.coll',
            cardinality: 'single',
            name: 'item',
            size: 0,
            relativeSize: 0,
            type: 'hashed',
            extra: {
              status: 'inprogress',
            },
            properties: [],
            fields: [
              {
                field: 'item',
                value: 1,
              },
            ],
            usageCount: 0,
          },
        ] as RegularIndex[],
        error: null,
        isRefreshing: false,
      },
    });

    const indexesList = screen.getByTestId('indexes-list');
    const inProgressIndex = within(indexesList).getByTestId('index-row-item');
    const indexPropertyField = within(inProgressIndex).getByTestId(
      'index-property-field'
    );

    expect(indexPropertyField).to.contain.text('In Progress ...');

    const dropIndexButton = within(inProgressIndex).queryByTestId(
      'index-actions-delete-action'
    );
    expect(dropIndexButton).to.not.exist;
  });

  it('renders indexes list with failed index', function () {
    renderIndexes({
      regularIndexes: {
        indexes: [
          {
            ns: 'db.coll',
            cardinality: 'single',
            name: '_id_',
            size: 12,
            relativeSize: 20,
            type: 'hashed',
            extra: {},
            properties: ['unique'],
            fields: [
              {
                field: '_id',
                value: 1,
              },
            ],
            usageCount: 20,
          },
          {
            ns: 'db.coll',
            cardinality: 'single',
            name: 'item',
            size: 0,
            relativeSize: 0,
            type: 'hashed',
            extra: {
              status: 'failed',
              regularError: 'regularError message',
            },
            properties: [],
            fields: [
              {
                field: 'item',
                value: 1,
              },
            ],
            usageCount: 0,
          },
        ] as RegularIndex[],
        error: null,
        isRefreshing: false,
      },
    });

    const indexesList = screen.getByTestId('indexes-list');
    const failedIndex = within(indexesList).getByTestId('index-row-item');
    const indexPropertyField = within(failedIndex).getByTestId(
      'index-property-field'
    );

    expect(indexPropertyField).to.contain.text('Failed');

    const dropIndexButton = within(failedIndex).getByTestId(
      'index-actions-delete-action'
    );
    expect(dropIndexButton).to.exist;
  });
});
