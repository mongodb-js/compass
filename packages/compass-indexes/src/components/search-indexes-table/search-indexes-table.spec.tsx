import React from 'react';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  within,
} from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import userEvent from '@testing-library/user-event';
import type { Document } from 'mongodb';

import { SearchIndexesTable } from './search-indexes-table';
import { SearchIndexesStatuses } from '../../modules/search-indexes';
import { searchIndexes as indexes } from './../../../test/fixtures/search-indexes';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesTable>> = {}
) => {
  const onSortTableSpy = sinon.spy();
  const openCreateSpy = sinon.spy();

  render(
    <SearchIndexesTable
      indexes={indexes}
      status="READY"
      isWritable={true}
      readOnly={false}
      onSortTable={onSortTableSpy}
      onDropIndex={() => {}}
      openCreateModal={openCreateSpy}
      {...props}
    />
  );

  return { onSortTableSpy, openCreateSpy };
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
        const indexRow = screen.getByTestId(`search-indexes-row-${index.name}`);
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

  for (const status of [SearchIndexesStatuses.PENDING]) {
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
    const { openCreateSpy } = renderIndexList({
      indexes: [],
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

  for (const column of ['Name and Fields', 'Status']) {
    it(`sorts table by ${column}`, function () {
      const { onSortTableSpy } = renderIndexList();

      const indexesList = screen.getByTestId('search-indexes-list');

      const columnheader = within(indexesList).getByTestId(
        `search-indexes-header-${column}`
      );
      const sortButton = within(columnheader).getByRole('button', {
        name: /sort/i,
      });

      expect(onSortTableSpy.callCount).to.equal(0);

      userEvent.click(sortButton);
      expect(onSortTableSpy.callCount).to.equal(1);
      expect(onSortTableSpy.getCalls()[0].args).to.deep.equal([column, 'desc']);

      userEvent.click(sortButton);
      expect(onSortTableSpy.callCount).to.equal(2);
      expect(onSortTableSpy.getCalls()[1].args).to.deep.equal([column, 'asc']);
    });
  }

  context('renders list with action', function () {
    it('renders drop action and shows modal when clicked', function () {
      const onDropIndexSpy = sinon.spy();

      renderIndexList({ onDropIndex: onDropIndexSpy });
      const dropIndexActions = screen.getAllByTestId(
        'search-index-actions-drop-action'
      );

      expect(dropIndexActions.length).to.equal(indexes.length);
      dropIndexActions[0].click();
      expect(onDropIndexSpy.callCount).to.equal(1);
    });
  });
});
