import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';

import { IndexesTable } from './indexes-table';
import type { IndexDefinition } from '../../modules/indexes';

const indexes: IndexDefinition[] = [
  {
    cardinality: 'single',
    inProgress: false,
    name: '_id_',
    size: 12,
    relativeSize: 20,
    type: 'hashed',
    extra: {},
    properties: ['unique'],
    fields: {
      serialize() {
        return [
          {
            field: '_id',
            value: 1,
          },
        ];
      },
    },
    usageCount: 10,
  },
  {
    cardinality: 'compound',
    inProgress: false,
    name: 'album_id_artist_id',
    size: 20,
    relativeSize: 25,
    type: 'text',
    extra: {},
    properties: [],
    fields: {
      serialize() {
        return [
          {
            field: 'album_id',
            value: 1,
          },
          {
            field: 'artist_id',
            value: -1,
          },
        ];
      },
    },
    usageCount: 15,
  },
  {
    cardinality: 'compound',
    inProgress: false,
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
    fields: {
      serialize() {
        return [
          {
            field: 'views',
            value: 1,
          },
        ];
      },
    },
    usageCount: 20,
  },
  {
    cardinality: 'single',
    inProgress: false,
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
    fields: {
      serialize() {
        return [
          {
            field: '$**',
            value: 1,
          },
        ];
      },
    },
    usageCount: 25,
  },
];

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof IndexesTable>> = {}
) => {
  render(
    <IndexesTable
      indexes={[]}
      canDeleteIndex={true}
      onSortTable={() => {}}
      onDeleteIndex={() => {}}
      {...props}
    />
  );
};

describe('IndexesTable Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders indexes list', function () {
    renderIndexList({ canDeleteIndex: true, indexes: indexes });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;

    // Renders indexes list (table rows)
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`index-row-${index.name}`);
      expect(indexRow, 'it renders each index in a row').to.exist;

      // Renders index fields (table cells)
      [
        'index-name-field',
        'index-type-field',
        'index-size-field',
        'index-usage-field',
        'index-property-field',
        'index-drop-field',
      ].forEach((indexCell) => {
        // For _id index we always hide drop index field
        if (index.name !== '_id_' && indexCell !== 'index-drop-field') {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
        } else {
          expect(() => {
            within(indexRow).getByTestId(indexCell);
          }).to.throw;
        }
      });
    });
  });

  it('does not render delete button when a user can not delete indexes', function () {
    renderIndexList({ canDeleteIndex: false, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByTestId(`index-row-${index.name}`);
      expect(() => {
        within(indexRow).getByTestId('index-drop-field');
      }).to.throw;
    });
  });

  ['Name and Definition', 'Type', 'Size', 'Usage', 'Properties'].forEach(
    (column) => {
      it(`sorts table by ${column}`, function () {
        const onSortTableSpy = spy();
        renderIndexList({
          canDeleteIndex: true,
          indexes: indexes,
          onSortTable: onSortTableSpy,
        });

        const indexesList = screen.getByTestId('indexes-list');

        const columnheader = within(indexesList).getByTestId(
          `index-header-${column}`
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
