import React from 'react';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Document } from 'mongodb';
import { SearchIndexesTable } from './search-indexes-table';
import { SearchIndexesStatuses } from '../../modules/search-indexes';
import {
  searchIndexes as indexes,
  vectorSearchIndexes,
} from './../../../test/fixtures/search-indexes';
import { mockSearchIndex } from '../../../test/helpers';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesTable>> = {}
) => {
  const noop = () => {};
  render(
    <SearchIndexesTable
      namespace="foo.bar"
      indexes={indexes}
      status="READY"
      isWritable={true}
      readOnly={false}
      onDropIndexClick={noop}
      onEditIndexClick={noop}
      onOpenCreateModalClick={noop}
      onPollIndexes={noop}
      {...props}
    />
  );
};

describe('SearchIndexesTable Component', function () {
  before(cleanup);
  afterEach(cleanup);

  for (const status of [
    SearchIndexesStatuses.READY,
    SearchIndexesStatuses.REFRESHING,
  ]) {
    it(`renders indexes list if the status is ${status}`, function () {
      renderIndexList({ status });

      const indexesList = screen.getByTestId('search-indexes-list');
      expect(indexesList).to.exist;

      // Renders indexes list (table rows)
      for (const index of indexes) {
        const indexRow = screen.getByText(index.name).closest('tr')!;
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

  for (const status of [
    SearchIndexesStatuses.FETCHING,
    SearchIndexesStatuses.NOT_READY,
  ]) {
    it(`does not render the list if the status is ${status}`, function () {
      renderIndexList({
        status,
      });

      expect(() => {
        screen.getByTestId('search-indexes-list');
      }).to.throw;
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
    }).to.throw;

    const button = screen.getByTestId('create-atlas-search-index-button');
    expect(button).to.exist;

    expect(openCreateSpy.callCount).to.equal(0);
    fireEvent.click(button);
    expect(openCreateSpy.callCount).to.equal(1);
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

      const indexRow = screen.getByText('vectorSearching123').closest('tr')!;

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

  describe('connectivity', function () {
    it('does poll the index for changes in online mode', async function () {
      const onPollIndexesSpy = sinon.spy();
      const testPollingInterval = 50;
      renderIndexList({
        onPollIndexes: onPollIndexesSpy,
        isWritable: true,
        pollingInterval: testPollingInterval,
      });

      await waitFor(
        () => {
          expect(onPollIndexesSpy.callCount).to.equal(1);
        },
        { timeout: testPollingInterval * 1.5 }
      );
    });
  });

  describe('sorting', function () {
    function getIndexNames() {
      return screen.getAllByTestId('search-indexes-name-field').map((el) => {
        return el.textContent!.trim();
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
