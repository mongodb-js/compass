import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { type RegularIndex } from '../../modules/regular-indexes';
import type {
  IndexesDataService,
  IndexesPluginOptions,
} from '../../stores/store';
import Indexes from './indexes';
import { setupStore } from '../../../test/setup-store';
import { searchIndexes } from '../../../test/fixtures/search-indexes';
import type { RootState } from '../../modules';

const renderIndexes = async (
  options: Partial<IndexesPluginOptions> = {},
  dataProvider: Partial<IndexesDataService> = {},
  props?: Partial<RootState>
) => {
  const store = setupStore(
    { ...options, isSearchIndexesSupported: true },
    dataProvider
  );

  // activating the store dispatches refreshRegular/Search indexes, but doesn't
  // wait for it
  await waitFor(() => {
    expect(store.getState().regularIndexes.status).to.be.oneOf([
      'READY',
      'ERROR',
    ]);
    expect(store.getState().searchIndexes.status).to.be.oneOf([
      'READY',
      'ERROR',
    ]);
  });

  if (props) {
    const state = store.getState();

    const allProps: Partial<RootState> = {
      indexView: props.indexView ?? 'regular-indexes',
      regularIndexes: {
        ...state.regularIndexes,
        ...props.regularIndexes,
      },
      searchIndexes: {
        ...state.searchIndexes,
        ...props.searchIndexes,
      },
    };

    Object.assign(store.getState(), allProps);
  }

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

  it('renders indexes', async function () {
    await renderIndexes();
    expect(screen.getByTestId('indexes-list')).to.exist;
  });

  it('renders indexes toolbar', async function () {
    await renderIndexes();
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('renders indexes toolbar when there is a regular indexes error', async function () {
    await renderIndexes(undefined, undefined, {
      indexView: 'regular-indexes',
      regularIndexes: {
        indexes: [],
        error: 'Some random error',
        status: 'ERROR',
        inProgressIndexes: [],
      },
    });
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
    expect(screen.getByTestId('indexes-error').textContent).to.equal(
      'Some random error'
    );
  });

  it('renders indexes toolbar when there is a search indexes error', async function () {
    // the component will load the search indexes the moment we switch to them
    const getSearchIndexesStub = sinon
      .stub()
      .rejects(new Error('This is an error.'));
    const dataProvider = {
      getSearchIndexes: getSearchIndexesStub,
    };
    await renderIndexes(undefined, dataProvider, {
      indexView: 'search-indexes',
    });

    expect(getSearchIndexesStub.callCount).to.equal(1);

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

  it('does not render the indexes list if isReadonlyView is true', async function () {
    await renderIndexes(undefined, undefined, {
      indexView: 'regular-indexes',
      regularIndexes: {
        status: 'NOT_READY',
        inProgressIndexes: [],
        indexes: [],
      },
      isReadonlyView: true,
    });

    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });

  context('regular indexes', function () {
    it('renders indexes list', async function () {
      await renderIndexes(undefined, undefined, {
        indexView: 'regular-indexes',
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
          error: undefined,
          status: 'READY',
          inProgressIndexes: [],
        },
      });

      const indexesList = screen.getByTestId('indexes-list');
      expect(indexesList).to.exist;
      expect(within(indexesList).getByText('_id_')).to.exist;
    });

    it('renders indexes list with in progress index', async function () {
      await renderIndexes(undefined, undefined, {
        indexView: 'regular-indexes',
        regularIndexes: {
          indexes: [
            {
              key: {},
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
          ],
          inProgressIndexes: [
            {
              id: 'test-inprogress-index',
              name: 'item',
              fields: [
                {
                  field: 'item',
                  value: 1,
                },
              ],
              status: 'inprogress',
            },
          ],
          error: undefined,
          status: 'READY',
        },
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

    it('renders indexes list with failed index', async function () {
      await renderIndexes(undefined, undefined, {
        indexView: 'regular-indexes',
        regularIndexes: {
          indexes: [
            {
              key: {},
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
          ],
          inProgressIndexes: [
            {
              id: 'test-inprogress-index',
              name: 'item',
              fields: [
                {
                  field: 'item',
                  value: 1,
                },
              ],
              status: 'failed',
              error: 'Error message',
            },
          ],
          error: undefined,
          status: 'READY',
        },
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
      await renderIndexes(undefined, dataProvider);

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
      await renderIndexes(undefined, dataProvider, {
        indexView: 'search-indexes',
      });

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
  });
});
