import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Document } from 'mongodb';
import { SearchIndexesTable } from './search-indexes-table';
import { FetchStatuses } from '../../utils/fetch-status';
import {
  searchIndexes as indexes,
  vectorSearchIndexes,
} from './../../../test/fixtures/search-indexes';
import { mockSearchIndex } from '../../../test/helpers';
import { setupStore } from '../../../test/setup-store';
import type { RootState } from '../../modules';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesTable>> = {},
  state?: Partial<RootState>
) => {
  const noop = () => {};
  const store = setupStore({
    ...props,
  });

  if (state) {
    const newState = { ...store.getState(), ...state };
    Object.assign(store.getState(), newState);
  }

  render(
    <Provider store={store}>
      <SearchIndexesTable
        namespace="foo.bar"
        indexes={indexes}
        status="READY"
        isReadonlyView={false}
        context="indexes-tab"
        onDropIndexClick={noop}
        onEditIndexClick={noop}
        onOpenCreateModalClick={noop}
        onSearchIndexesOpened={noop}
        onSearchIndexesClosed={noop}
        {...props}
      />
    </Provider>
  );
};

describe('SearchIndexesTable Component', function () {
  before(cleanup);
  afterEach(cleanup);

  for (const status of [FetchStatuses.READY, FetchStatuses.REFRESHING]) {
    it(`renders indexes list if the status is ${status}`, function () {
      renderIndexList({ status });

      const indexesList = screen.getByTestId('search-indexes-list');
      expect(indexesList).to.exist;

      // Renders indexes list (table rows)
      for (const index of indexes) {
        const indexRow = screen
          .getByText(index.name)
          .closest('tr') as HTMLTableRowElement;
        expect(indexRow, 'it renders each index in a row').to.exist;

        // Renders index fields (table cells)
        for (const indexCell of [
          'search-indexes-name-field',
          'search-indexes-status-field',
        ]) {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
        }

        // Renders status badges
        const badge = within(indexRow).getByTestId(
          `search-indexes-status-${index.name}`
        );
        expect(badge).to.exist;
        expect(badge).to.have.text(index.status);

        // Renders details

        const expandButton = within(indexRow).getByLabelText('Expand row');
        expect(expandButton).to.exist;
        fireEvent.click(expandButton);

        const details = screen.getByTestId(
          `search-indexes-details-${index.name}`
        );
        expect(details).to.exist;

        if (index.latestDefinition.mappings?.dynamic) {
          expect(within(details).getAllByText('Dynamic Mappings')).to.exist;
        }
        if (index.latestDefinition.mappings?.fields) {
          for (const field of Object.keys(
            index.latestDefinition.mappings.fields as Document
          )) {
            expect(within(details).getAllByText(field)).to.exist;
          }
        }
      }
    });
  }

  for (const status of [FetchStatuses.FETCHING, FetchStatuses.NOT_READY]) {
    it(`does not render the list if the status is ${status}`, function () {
      renderIndexList({
        status,
      });

      expect(() => {
        screen.getByTestId('search-indexes-list');
      }).to.throw();
    });
  }

  it('renders the zero state rather than the table if there are no indexes', function () {
    const openCreateSpy = sinon.spy();
    renderIndexList({
      indexes: [],
      onOpenCreateModalClick: openCreateSpy,
    });

    expect(() => {
      screen.getByTestId('search-indexes-list');
    }).to.throw();

    const button = screen.getByTestId('create-atlas-search-index-button');
    expect(button).to.exist;

    expect(openCreateSpy.callCount).to.equal(0);
    fireEvent.click(button);
    expect(openCreateSpy.callCount).to.equal(1);
  });

  it('renders the zero state with button disabled if there are no indexes and isReadOnlyView with non searchable pipeline', function () {
    const pipelineMock: Document[] = [{ $project: { newField: 'testValue' } }];
    const mockCollectionStats = {
      index_count: 0,
      index_size: 0,
      pipeline: pipelineMock,
    };
    renderIndexList(
      {
        indexes: [],
        isReadonlyView: true,
      },
      { collectionStats: mockCollectionStats }
    );

    expect(() => {
      screen.getByTestId('search-indexes-list');
    }).to.throw();

    const button = screen.getByTestId('create-atlas-search-index-button');
    expect(button).to.exist;
    expect(button.closest('button')?.getAttribute('aria-disabled')).to.equal(
      'true'
    );
  });

  context('renders list with action', function () {
    it('renders drop action and shows modal when clicked', function () {
      const onDropIndexSpy = sinon.spy();

      renderIndexList({ onDropIndexClick: onDropIndexSpy });
      const dropIndexActions = screen.getAllByTestId(
        'search-index-actions-drop-action'
      );

      expect(dropIndexActions.length).to.equal(indexes.length);
      dropIndexActions[0].click();
      expect(onDropIndexSpy.callCount).to.equal(1);
    });

    it('renders edit action and shows modal when clicked', function () {
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
      renderIndexList({
        indexes: vectorSearchIndexes,
      });

      const indexRow = screen
        .getByText('vectorSearching123')
        .closest('tr') as HTMLTableRowElement;

      const expandButton = within(indexRow).getByLabelText('Expand row');
      expect(expandButton).to.exist;
      fireEvent.click(expandButton);

      const details = screen.getByTestId(
        `search-indexes-details-vectorSearching123`
      );
      expect(details).to.exist;

      for (const path of ['plot_embedding', 'genres']) {
        expect(within(details).getAllByText(path)).to.exist;
      }
    });
  });

  describe('indexes-drawer context', function () {
    it('renders simplified columns in drawer context', function () {
      renderIndexList({ indexes, context: 'indexes-drawer' });

      const indexesList = screen.getByTestId('search-indexes-list');
      expect(indexesList).to.exist;

      // Should render Name header (not "Name and Fields")
      const nameHeader = screen.getByTestId('search-indexes-header-name');
      expect(nameHeader.textContent).to.include('Name');
      expect(nameHeader.textContent).to.not.include('Fields');

      // Should render Type, Status, Actions columns
      expect(screen.getByTestId('search-indexes-header-type')).to.exist;
      expect(screen.getByTestId('search-indexes-header-status')).to.exist;
      expect(screen.getByTestId('search-indexes-header-actions')).to.exist;
    });

    it('does not render the Aggregate button in drawer context', function () {
      renderIndexList({ indexes, context: 'indexes-drawer' });

      // The Aggregate button should not be present in drawer context
      expect(screen.queryByTestId('search-index-actions-aggregate-action')).to
        .not.exist;
    });

    it('renders the Aggregate button in indexes-tab context', function () {
      renderIndexList({ indexes, context: 'indexes-tab' });

      // The Aggregate button should be present in tab context
      const aggregateButtons = screen.getAllByTestId(
        'search-index-actions-aggregate-action'
      );
      expect(aggregateButtons.length).to.be.greaterThan(0);
    });

    it('shows "Vector" instead of "Vector Search" for type in drawer context', function () {
      renderIndexList({
        indexes: vectorSearchIndexes,
        context: 'indexes-drawer',
      });

      const typeFields = screen.getAllByTestId('search-indexes-type-field');
      // Check that at least one type field contains "Vector" but not "Vector Search"
      const hasVectorType = typeFields.some((field) => {
        const text = field.textContent || '';
        return text.includes('Vector') && !text.includes('Vector Search');
      });
      expect(hasVectorType).to.be.true;
    });

    it('shows "Vector Search" for type in indexes-tab context', function () {
      renderIndexList({
        indexes: vectorSearchIndexes,
        context: 'indexes-tab',
      });

      const typeFields = screen.getAllByTestId('search-indexes-type-field');
      // Check that at least one type field contains "Vector Search"
      const hasVectorSearchType = typeFields.some((field) => {
        const text = field.textContent || '';
        return text.includes('Vector Search');
      });
      expect(hasVectorSearchType).to.be.true;
    });

    it('renders simplified expanded content in drawer context', function () {
      renderIndexList({
        indexes,
        context: 'indexes-drawer',
      });

      const indexRow = screen
        .getByText(indexes[0].name)
        .closest('tr') as HTMLTableRowElement;

      const expandButton = within(indexRow).getByLabelText('Expand row');
      fireEvent.click(expandButton);

      // In drawer context, should show simplified content with Status, Index Fields, Queryable
      // and NOT the detailed search-indexes-details component
      expect(screen.queryByTestId(`search-indexes-details-${indexes[0].name}`))
        .to.not.exist;
      expect(screen.getByText(/Status:/)).to.exist;
      expect(screen.getByText(/Queryable:/)).to.exist;
    });

    it('renders detailed expanded content in indexes-tab context', function () {
      renderIndexList({
        indexes,
        context: 'indexes-tab',
      });

      const indexRow = screen
        .getByText(indexes[0].name)
        .closest('tr') as HTMLTableRowElement;

      const expandButton = within(indexRow).getByLabelText('Expand row');
      fireEvent.click(expandButton);

      // In tab context, should show the detailed search-indexes-details component
      expect(screen.getByTestId(`search-indexes-details-${indexes[0].name}`)).to
        .exist;
    });

    it('calls onEditIndexClick when edit action is clicked in drawer context', function () {
      const onEditIndexSpy = sinon.spy();

      renderIndexList({
        indexes,
        context: 'indexes-drawer',
        onEditIndexClick: onEditIndexSpy,
      });

      const editIndexActions = screen.getAllByTestId(
        'search-index-actions-edit-action'
      );
      editIndexActions[0].click();
      expect(onEditIndexSpy.callCount).to.equal(1);
    });
  });

  describe('sorting', function () {
    function getIndexNames() {
      return screen.getAllByTestId('search-indexes-name-field').map((el) => {
        return el.textContent.trim();
      });
    }

    function clickSort(label: string) {
      userEvent.click(screen.getByRole('button', { name: `Sort by ${label}` }));
    }

    it('sorts table by name', function () {
      renderIndexList({
        indexes: [
          mockSearchIndex({ name: 'b' }),
          mockSearchIndex({ name: 'a' }),
          mockSearchIndex({ name: 'c' }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by type', function () {
      renderIndexList({
        indexes: [
          mockSearchIndex({ name: 'b', type: 'vector search' }),
          mockSearchIndex({ name: 'a', type: 'search' }),
          mockSearchIndex({ name: 'c', type: 'vector search' }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by status', function () {
      renderIndexList({
        indexes: [
          mockSearchIndex({ name: 'b', status: 'FAILED' }),
          mockSearchIndex({ name: 'a', status: 'BUILDING' }),
          mockSearchIndex({ name: 'c', status: 'READY' }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name and Fields');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });
  });
});
