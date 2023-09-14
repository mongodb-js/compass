import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import { SearchIndexesTable } from './search-indexes-table';
import { SearchIndexesStatuses } from '../../modules/search-indexes';
import { searchIndexes as indexes } from './../../../test/fixtures/search-indexes';

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof SearchIndexesTable>> = {}
) => {
  render(
    <ConfirmationModalArea>
      <SearchIndexesTable
        indexes={indexes}
        status="READY"
        isWritable={true}
        readOnly={false}
        onSortTable={() => {}}
        onDropIndex={() => {}}
        {...props}
      />
    </ConfirmationModalArea>
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
        const indexRow = screen.getByTestId(`search-indexes-row-${index.name}`);
        expect(indexRow, 'it renders each index in a row').to.exist;

        // Renders index fields (table cells)
        for (const indexCell of [
          'search-indexes-name-field',
          'search-indexes-status-field',
        ]) {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
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

  it('does not render the table if there are no indexes', function () {
    renderIndexList({
      indexes: [],
    });

    expect(() => {
      screen.getByTestId('search-indexes-list');
    }).to.throw;
  });

  for (const column of ['Name and Fields', 'Status']) {
    it(`sorts table by ${column}`, function () {
      const onSortTableSpy = spy();
      renderIndexList({
        onSortTable: onSortTableSpy,
      });

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
    it('renders drop action and shows modal when clicked', async function () {
      const onDropIndexSpy = spy();

      renderIndexList({ onDropIndex: onDropIndexSpy });
      const dropIndexActions = screen.getAllByTestId(
        'search-index-actions-drop-action'
      );

      expect(dropIndexActions.length).to.equal(indexes.length);

      dropIndexActions[0].click();

      const modal = screen.getByTestId('confirmation-modal');
      expect(modal).to.exist;

      const input = within(modal).getByRole('textbox');

      // When the input does not match index name
      {
        userEvent.type(input, 'bla');
        const button = within(modal).getByRole('button', {
          name: /drop index/i,
        });
        expect(button.getAttribute('disabled')).to.not.be.null;
        button.click();
        expect(onDropIndexSpy.callCount).to.equal(0);
      }

      userEvent.clear(input);

      // When the input matches index name
      {
        userEvent.type(input, indexes[0].name);
        const button = within(modal).getByRole('button', {
          name: /drop index/i,
        });
        expect(button.getAttribute('disabled')).to.be.null;
        button.click();

        await waitForElementToBeRemoved(() =>
          screen.getByTestId('confirmation-modal')
        );

        expect(onDropIndexSpy.callCount).to.equal(1);
        expect(onDropIndexSpy.firstCall.args).to.deep.equal([indexes[0].name]);
      }
    });
  });
});
