import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  userEvent,
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
import { mockSearchIndex } from '../../../test/helpers';
import { setupStore } from '../../../test/setup-store';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesDrawerTable>> = {}
) => {
  const noop = () => {};
  const store = setupStore();

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

    it('renders edit action as disabled when onEditIndexClick is not provided', function () {
      renderIndexList({ onEditIndexClick: undefined });
      const editIndexActions = screen.getAllByTestId(
        'search-index-actions-edit-action'
      );

      expect(editIndexActions.length).to.equal(indexes.length);
      expect(editIndexActions[0]).to.have.attribute('aria-disabled', 'true');
    });
  });

  context('vector search index', function () {
    it('renders the vector search index details when expanded', function () {
      renderIndexList({ indexes: vectorSearchIndexes });

      // 'vectorSearching123' is >10 chars, so it gets truncated in the drawer
      const indexRow = screen
        .getByText('vectorSear…')
        .closest('tr') as HTMLTableRowElement;

      const expandButton = within(indexRow).getByLabelText('Expand row');
      expect(expandButton).to.exist;
      userEvent.click(expandButton);

      expect(screen.getByText('Status:')).to.exist;
      expect(screen.getByText('Index Fields:')).to.exist;
      expect(screen.getByText('Queryable:')).to.exist;
    });
  });

  context('name truncation', function () {
    it('truncates names longer than 10 characters', function () {
      const longNameIndex = mockSearchIndex({
        name: 'a_very_long_index_name',
      });
      renderIndexList({ indexes: [longNameIndex] });

      expect(screen.getByText('a_very_lon…')).to.exist;
    });

    it('does not truncate names with 10 or fewer characters', function () {
      const shortNameIndex = mockSearchIndex({ name: 'short' });
      renderIndexList({ indexes: [shortNameIndex] });

      expect(screen.getByText('short')).to.exist;
    });
  });

  context('type rendering', function () {
    it('renders "Search" as plain text for search indexes', function () {
      const searchIndex = mockSearchIndex({
        name: 'my_search',
        type: 'search',
      });
      renderIndexList({ indexes: [searchIndex] });

      const indexRow = screen
        .getByText('my_search')
        .closest('tr') as HTMLTableRowElement;
      expect(within(indexRow).getByText('Search')).to.exist;
    });

    it('renders "Vector" as plain text for vector search indexes', function () {
      renderIndexList({ indexes: vectorSearchIndexes });

      const indexRow = screen
        .getByText('pineapple')
        .closest('tr') as HTMLTableRowElement;
      expect(within(indexRow).getByText('Vector')).to.exist;
    });
  });

  it('filters indexes based on searchTerm', function () {
    renderIndexList({ indexes, searchTerm: 'default' });

    expect(screen.getByText('default').closest('tr') as HTMLTableRowElement).to
      .exist;
    expect(() => screen.getByText('another')).to.throw();
  });
});
