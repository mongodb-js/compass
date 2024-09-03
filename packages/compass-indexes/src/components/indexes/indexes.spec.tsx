import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { RegularIndex } from '../../modules/regular-indexes';
import type { IndexesDataService } from '../../stores/store';
import Indexes from './indexes';
import { setupStore } from '../../../test/setup-store';
import { searchIndexes } from '../../../test/fixtures/search-indexes';
import type { RootState } from '../../modules';

const DEFAULT_PROPS: Partial<RootState> = {
  regularIndexes: { indexes: [], error: null, isRefreshing: false },
  searchIndexes: {
    indexes: [],
    error: null,
    status: 'PENDING',
    createIndex: {
      isModalOpen: false,
    },
    updateIndex: {
      isModalOpen: false,
    },
  },
} as any;

const renderIndexes = (
  props: Partial<RootState> = {},
  dataProvider: Partial<IndexesDataService> = {}
) => {
  const store = setupStore(undefined, dataProvider);

  const allProps: Partial<RootState> = {
    ...DEFAULT_PROPS,
    ...props,
  };

  Object.assign(store.getState(), allProps);

  render(
    <Provider store={store}>
      <Indexes />
    </Provider>
  );

  return store;
};

describe('Indexes Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders indexes', function () {
    renderIndexes();
    expect(screen.getByTestId('indexes-list')).to.exist;
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
      } as any,
    });
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
    // TODO: actually check for the error
  });

  it('renders indexes toolbar when there is a search indexes error', async function () {
    // the component will load the search indexes the moment we switch to them
    const getSearchIndexesStub = sinon
      .stub()
      .rejects(new Error('This is an error.'));
    const dataProvider = {
      getSearchIndexes: getSearchIndexesStub,
    };
    renderIndexes({}, dataProvider);

    const toolbar = screen.getByTestId('indexes-toolbar');
    expect(toolbar).to.exist;

    // switch to the Search Indexes tab
    const button = within(toolbar).getByText('Search Indexes');
    fireEvent.click(button);

    // the error message should show up next to the toolbar
    const container = screen.getByTestId('indexes-toolbar-container');
    await waitFor(() => {
      expect(within(container).getByText('This is an error.')).to.exist;
    });
  });

  it('does not render the indexes list if isReadonlyView is true', function () {
    renderIndexes({
      regularIndexes: {
        indexes: [],
      } as any,
      isReadonlyView: true,
    });

    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });

  context('regular indexes', function () {
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
        } as any,
      });

      const indexesList = screen.getByTestId('indexes-list');
      expect(indexesList).to.exist;
      expect(within(indexesList).getByText('_id_')).to.exist;
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
        } as any,
      });

      const indexesList = screen.getByTestId('indexes-list');
      const indexPropertyField = within(indexesList).getAllByTestId(
        'indexes-properties-field'
      )[1];

      expect(indexPropertyField).to.contain.text('In Progress ...');

      const dropIndexButton = within(indexesList).queryByTestId(
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
        } as any,
      });

      const indexesList = screen.getByTestId('indexes-list');
      const indexPropertyField = within(indexesList).getAllByTestId(
        'indexes-properties-field'
      )[1];

      expect(indexPropertyField).to.contain.text('Failed');

      const dropIndexButton = within(indexesList).getByTestId(
        'index-actions-delete-action'
      );
      expect(dropIndexButton).to.exist;
    });
  });

  context('search indexes', function () {
    it('renders the search indexes table if the current view changes to search indexes', async function () {
      const getSearchIndexesStub = sinon.stub().resolves(searchIndexes);
      const dataProvider = {
        getSearchIndexes: getSearchIndexesStub,
      };
      renderIndexes({}, dataProvider);

      // switch to the Search Indexes tab
      const toolbar = screen.getByTestId('indexes-toolbar');
      const button = within(toolbar).getByText('Search Indexes');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('search-indexes-list')).to.exist;
      });
    });

    it('refreshes the search indexes if the search indexes view is active', async function () {
      const getSearchIndexesStub = sinon.stub().resolves(searchIndexes);
      const dataProvider = {
        getSearchIndexes: getSearchIndexesStub,
      };
      renderIndexes({}, dataProvider);

      // switch to the Search Indexes tab
      const toolbar = screen.getByTestId('indexes-toolbar');
      fireEvent.click(within(toolbar).getByText('Search Indexes'));

      expect(getSearchIndexesStub.callCount).to.equal(1);

      // click the refresh button
      const refreshButton = within(toolbar).getByText('Refresh');
      await waitFor(
        () => expect(refreshButton.getAttribute('aria-disabled')).to.be.null
      );
      fireEvent.click(refreshButton);

      expect(getSearchIndexesStub.callCount).to.equal(2);
    });

    it('switches to the search indexes table when a search index is created', async function () {
      renderIndexes({
        // render with the create search index modal open
        ...DEFAULT_PROPS,
        searchIndexes: {
          ...DEFAULT_PROPS.searchIndexes,
          createIndex: {
            ...DEFAULT_PROPS.searchIndexes!.createIndex,
            isModalOpen: true,
          },
        } as any,
      });

      // check that the search indexes table is not visible
      expect(screen.queryByTestId('search-indexes')).is.null;
      // click the create index button
      (await screen.findByTestId('search-index-submit-button')).click();
      // we are not creating the index (due to the test)
      // but we are switch, so we will see the zero-graphic
      expect(await screen.findByText('No search indexes yet')).is.visible;
    });
  });
});
