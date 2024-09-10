import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { RegularIndexesTable } from './regular-indexes-table';
import type { RegularIndex } from '../../modules/regular-indexes';
import { mockRegularIndex } from '../../../test/helpers';

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
  return render(
    <RegularIndexesTable
      indexes={[]}
      serverVersion="4.4.0"
      isWritable={true}
      readOnly={false}
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
      const indexRow = screen.getByText(index.name).closest('tr')!;
      expect(indexRow, 'it renders each index in a row').to.exist;

      // Renders index fields (table cells)
      [
        'indexes-name-field',
        'indexes-type-field',
        'indexes-size-field',
        'indexes-usage-field',
        'indexes-properties-field',
        'indexes-actions-field',
      ].forEach((indexCell) => {
        // For _id index we always hide drop index field
        if (index.name !== '_id_' && indexCell !== 'indexes-actions-field') {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
        } else {
          expect(() => {
            within(indexRow).getByTestId(indexCell);
          }).to.throw();
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
    }).to.throw();
  });

  it('renders the delete and hide/unhide button when a user can modify indexes', function () {
    renderIndexList({ isWritable: true, readOnly: false, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByText(index.name).closest('tr')!;
      expect(within(indexRow).getByTestId('indexes-actions-field')).to.exist;
    });
  });

  it('does not render delete and hide/unhide button when a user can not modify indexes (!isWritable)', function () {
    renderIndexList({ isWritable: false, readOnly: false, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByText(index.name).closest('tr')!;
      expect(() => {
        within(indexRow).getByTestId('indexes-actions-field');
      }).to.throw();
    });
  });

  it('does not render delete and hide/unhide button when a user can not modify indexes (isWritable, readOnly)', function () {
    renderIndexList({ isWritable: true, readOnly: true, indexes: indexes });
    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    indexes.forEach((index) => {
      const indexRow = screen.getByText(index.name).closest('tr')!;
      expect(() => {
        within(indexRow).getByTestId('indexes-actions-field');
      }).to.throw();
    });
  });

  describe('sorting', function () {
    function getIndexNames() {
      return screen.getAllByTestId('indexes-name-field').map((el) => {
        return el.textContent!.trim();
      });
    }

    function clickSort(label: string) {
      userEvent.click(screen.getByRole('button', { name: `Sort by ${label}` }));
    }

    it('sorts table by name', function () {
      renderIndexList({
        indexes: [
          mockRegularIndex({ name: 'b' }),
          mockRegularIndex({ name: 'a' }),
          mockRegularIndex({ name: 'c' }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Name and Definition');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name and Definition');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by type', function () {
      renderIndexList({
        indexes: [
          mockRegularIndex({ name: 'b' }),
          mockRegularIndex({ name: 'a' }),
          mockRegularIndex({ name: 'c' }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Name and Definition');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name and Definition');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by size', function () {
      renderIndexList({
        indexes: [
          mockRegularIndex({ name: 'b', size: 5 }),
          mockRegularIndex({ name: 'a', size: 1 }),
          mockRegularIndex({ name: 'c', size: 10 }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Size');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Size');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by usage', function () {
      renderIndexList({
        indexes: [
          mockRegularIndex({ name: 'b', usageCount: 5 }),
          mockRegularIndex({ name: 'a', usageCount: 0 }),
          mockRegularIndex({ name: 'c', usageCount: 10 }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      clickSort('Usage');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Usage');
      expect(getIndexNames()).to.deep.eq(['c', 'b', 'a']);
    });

    it('sorts table by properties', function () {
      renderIndexList({
        indexes: [
          mockRegularIndex({ name: 'b', properties: ['sparse'] }),
          mockRegularIndex({ name: 'a', properties: ['partial'] }),
          mockRegularIndex({
            name: 'c',
            cardinality: 'compound',
            properties: ['ttl'],
          }),
        ],
      });

      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);

      // `c` is first because when cardinality is compound, the property name
      // that is used in sort is always `compound`
      clickSort('Properties');
      expect(getIndexNames()).to.deep.eq(['c', 'a', 'b']);

      clickSort('Properties');
      expect(getIndexNames()).to.deep.eq(['b', 'a', 'c']);
    });
  });
});
