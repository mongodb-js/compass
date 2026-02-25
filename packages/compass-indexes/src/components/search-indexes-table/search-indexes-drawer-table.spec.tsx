import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { SearchIndexesDrawerTable } from './search-indexes-drawer-table';
import { FetchStatuses } from '../../utils/fetch-status';
import {
  searchIndexes as indexes,
  vectorSearchIndexes,
} from '../../../test/fixtures/search-indexes';
import { setupStore } from '../../../test/setup-store';
import type { RootState } from '../../modules';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesDrawerTable>> = {},
  state?: Partial<RootState>
) => {
  const noop = () => {};
  const store = setupStore({ ...props });

  if (state) {
    const newState = { ...store.getState(), ...state };
    Object.assign(store.getState(), newState);
  }

  render(
    <Provider store={store}>
      <SearchIndexesDrawerTable
        indexes={indexes}
        status="READY"
        onDropIndexClick={noop}
        onEditIndexClick={noop}
        onCreateSearchIndexClick={noop}
        {...props}
      />
    </Provider>
  );
};

describe('SearchIndexesDrawerTable Component', function () {
  before(cleanup);
  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  for (const status of [
    FetchStatuses.READY,
    FetchStatuses.REFRESHING,
    FetchStatuses.POLLING,
  ]) {
    it(`renders indexes list if the status is ${status}`, function () {
      renderIndexList({ status });

      for (const index of indexes) {
        const indexRow = screen
          .getByText(index.name)
          .closest('tr') as HTMLTableRowElement;
        expect(indexRow, 'it renders each index in a row').to.exist;

        expect(within(indexRow).getByTestId('search-indexes-name-field')).to
          .exist;
      }
    });
  }

  for (const status of [FetchStatuses.FETCHING, FetchStatuses.NOT_READY]) {
    it(`does not render the list if the status is ${status}`, function () {
      renderIndexList({ status });

      expect(() => screen.getByTestId('search-indexes-list')).to.throw();
    });
  }

  it('renders the zero state when there are no indexes', function () {
    renderIndexList({ indexes: [] });

    expect(screen.getByText('No search indexes found')).to.exist;
    expect(screen.getByText('Create a search index')).to.exist;
  });

  context('renders list with actions', function () {
    it('renders drop action and calls handler when clicked', function () {
      const onDropIndexSpy = sinon.spy();

      renderIndexList({ onDropIndexClick: onDropIndexSpy });
      const dropIndexActions = screen.getAllByTestId(
        'search-index-actions-drop-action'
      );

      expect(dropIndexActions.length).to.equal(indexes.length);
      dropIndexActions[0].click();
      expect(onDropIndexSpy.callCount).to.equal(1);
    });

    it('renders edit action and calls handler when clicked', function () {
      const onEditIndexSpy = sinon.spy();

      renderIndexList({ onEditIndexClick: onEditIndexSpy });
      const editIndexActions = screen.getAllByTestId(
        'search-index-actions-edit-action'
      );

      expect(editIndexActions.length).to.equal(indexes.length);
      editIndexActions[0].click();
      expect(onEditIndexSpy.callCount).to.equal(1);
    });
  });

  context('vector search index', function () {
    it('renders the vector search index details when expanded', function () {
      renderIndexList({ indexes: vectorSearchIndexes });

      const indexRow = screen
        .getByText('vectorSearching123')
        .closest('tr') as HTMLTableRowElement;

      const expandButton = within(indexRow).getByLabelText('Expand row');
      expect(expandButton).to.exist;
      fireEvent.click(expandButton);

      expect(screen.getByText('Status:')).to.exist;
      expect(screen.getByText('Index Fields:')).to.exist;
      expect(screen.getByText('Queryable:')).to.exist;
    });
  });

  it('filters indexes based on searchTerm', function () {
    renderIndexList({ indexes, searchTerm: 'default' });

    expect(screen.getByText('default').closest('tr') as HTMLTableRowElement).to
      .exist;
    expect(() => screen.getByText('another')).to.throw();
  });
});
