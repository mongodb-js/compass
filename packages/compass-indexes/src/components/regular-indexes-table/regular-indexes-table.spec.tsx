import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';

import { RegularIndexesTable } from './regular-indexes-table';
import type { RegularIndex } from '../../modules/regular-indexes';

const indexes = [
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
    usageCount: 10,
  },
  {
    ns: 'db.coll',
    cardinality: 'compound',
    name: 'album_id_artist_id',
    size: 20,
    relativeSize: 25,
    type: 'text',
    extra: {
      hidden: true,
    },
    properties: [],
    fields: [
      {
        field: 'album_id',
        value: 1,
      },
      {
        field: 'artist_id',
        value: -1,
      },
    ],
    usageCount: 15,
  },
  {
    ns: 'db.coll',
    cardinality: 'compound',
    name: 'partial_with_ttl',
    size: 20,
    relativeSize: 25,
    type: 'text',
    extra: {
      expireAfterSeconds: 3600,
      partialFilterExpression: {
        play_count: 30,
      },
    },
    properties: ['ttl', 'partial'],
    fields: [
      {
        field: 'views',
        value: 1,
      },
    ],
    usageCount: 20,
  },
  {
    ns: 'db.coll',
    cardinality: 'single',
    name: 'wildcard_index',
    size: 20,
    relativeSize: 25,
    type: 'wildcard',
    extra: {
      wildcardProjection: {
        fieldA: true,
        _id: false,
      },
    },
    properties: [],
    fields: [
      {
        field: '$**',
        value: 1,
      },
    ],
    usageCount: 25,
  },
] as RegularIndex[];

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof RegularIndexesTable>> = {}
) => {
  render(
    <RegularIndexesTable
      indexes={[]}
      serverVersion="4.4.0"
      isWritable={true}
      readOnly={false}
      onSortTable={() => {}}
      onHideIndex={() => {}}
      onUnhideIndex={() => {}}
      onDeleteIndex={() => {}}
      {...props}
    />
  );
};

describe('RegularIndexesTable Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders indexes list', function () {
    renderIndexList({ isWritable: true, readOnly: false, indexes: indexes });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;

    // Renders indexes list (table rows)
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(indexRow, 'it renders each index in a row').to.exist;

      // Renders index fields (table cells)
      [
        'indexes-name-field',
        'indexes-type-field',
        'indexes-size-field',
        'indexes-usage-field',
        'indexes-property-field',
        'indexes-actions-field',
      ].forEach((indexCell) => {
        // For _id index we always hide drop index field
        if (index.name !== '_id_' && indexCell !== 'indexes-actions-field') {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
        } else {
          expect(() => {
            within(indexRow).getByTestId(indexCell);
          }).to.throw;
        }
      });
    });
  });

  it('does not render the list if there is an error', function () {
    renderIndexList({
      isWritable: true,
      readOnly: false,
      indexes: indexes,
      error: 'moo',
    });

    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });

  it('renders the delete and hide/unhide button when a user can modify indexes', function () {
    renderIndexList({ isWritable: true, readOnly: false, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(within(indexRow).getByTestId('indexes-actions-field')).to.exist;
    });
  });

  it('does not render delete and hide/unhide button when a user can not modify indexes (!isWritable)', function () {
    renderIndexList({ isWritable: false, readOnly: false, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(() => {
        within(indexRow).getByTestId('indexes-actions-field');
      }).to.throw;
    });
  });

  it('does not render delete and hide/unhide button when a user can not modify indexes (isWritable, readOnly)', function () {
    renderIndexList({ isWritable: true, readOnly: true, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(() => {
        within(indexRow).getByTestId('indexes-actions-field');
      }).to.throw;
    });
  });

  ['Name and Definition', 'Type', 'Size', 'Usage', 'Properties'].forEach(
    (column) => {
      it(`sorts table by ${column}`, function () {
        const onSortTableSpy = spy();
        renderIndexList({
          isWritable: true,
          readOnly: false,
          indexes: indexes,
          onSortTable: onSortTableSpy,
        });

        const indexesList = screen.getByTestId('indexes-list');

        const columnheader = within(indexesList).getByTestId(
          `indexes-header-${column}`
        );
        const sortButton = within(columnheader).getByRole('button', {
          name: /sort/i,
        });

        expect(onSortTableSpy.callCount).to.equal(0);

        userEvent.click(sortButton);
        expect(onSortTableSpy.callCount).to.equal(1);
        expect(onSortTableSpy.getCalls()[0].args).to.deep.equal([
          column,
          'desc',
        ]);

        userEvent.click(sortButton);
        expect(onSortTableSpy.callCount).to.equal(2);
        expect(onSortTableSpy.getCalls()[1].args).to.deep.equal([
          column,
          'asc',
        ]);
      });
    }
  );
});
