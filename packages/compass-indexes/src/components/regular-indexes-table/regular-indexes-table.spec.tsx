import React from 'react';
import {
  cleanup,
  renderWithConnections,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { RegularIndexesTable } from './regular-indexes-table';
import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';
import { mockRegularIndex } from '../../../test/helpers';

const indexes: RegularIndex[] = [
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
    buildProgress: 0,
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
    buildProgress: 0,
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
    buildProgress: 0,
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
    buildProgress: 0,
  },
];

const inProgressIndexes: InProgressIndex[] = [
  {
    id: 'in-progress-1',
    name: 'AAAA',
    fields: [
      {
        field: 'a',
        value: 1,
      },
      {
        field: 'b',
        value: -1,
      },
    ],
    status: 'creating',
    buildProgress: 0,
  },
  {
    id: 'in-progress-2',
    name: 'z',
    fields: [
      {
        field: 'z',
        value: 'text',
      },
    ],
    status: 'creating',
    error: 'this is an error',
    buildProgress: 0,
  },
];

const rollingIndexes: RollingIndex[] = [
  {
    indexName: 'my-rolling-index',
    indexType: {
      label: 'regular',
    },
    keys: [
      {
        name: 'title',
        value: 'text',
      },
    ],
  },
];

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof RegularIndexesTable>> = {}
) => {
  return renderWithConnections(
    <RegularIndexesTable
      indexes={[]}
      inProgressIndexes={[]}
      rollingIndexes={[]}
      serverVersion="4.4.0"
      isWritable={true}
      readOnly={false}
      onHideIndexClick={() => {}}
      onUnhideIndexClick={() => {}}
      onDeleteIndexClick={() => {}}
      onDeleteFailedIndexClick={() => {}}
      onRegularIndexesOpened={() => {}}
      onRegularIndexesClosed={() => {}}
      {...props}
    />
  );
};

const indexFields = [
  'indexes-name-field',
  'indexes-type-field',
  'indexes-size-field',
  'indexes-usageCount-field',
  'indexes-properties-field',
  'indexes-actions-field',
];

describe('RegularIndexesTable Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders regular indexes', function () {
    renderIndexList({ isWritable: true, readOnly: false, indexes: indexes });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;

    // Renders indexes list (table rows)
    for (const index of indexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(indexRow, 'it renders each index in a row').to.exist;

      // Renders index fields (table cells)
      for (const indexCell of indexFields) {
        let mustExist = true;

        // For _id index we always hide hide/drop index field buttons
        if (index.name === '_id_' && indexCell === 'indexes-actions-field') {
          mustExist = false;
        }

        if (mustExist) {
          expect(within(indexRow).getByTestId(indexCell)).to.exist;
        } else {
          expect(() => {
            within(indexRow).getByTestId(indexCell);
          }).to.throw;
        }
      }

      if (index.name === '_id_') {
        expect(() => {
          within(indexRow).getByTestId('index-actions-hide-action');
        }).to.throw;
        expect(() => {
          within(indexRow).getByTestId('index-actions-delete-action');
        }).to.throw;
      } else {
        if (index.extra.hidden) {
          expect(() =>
            within(indexRow).getByTestId('index-actions-hide-action')
          ).to.throw;
          expect(within(indexRow).getByTestId('index-actions-unhide-action')).to
            .exist;
        } else {
          expect(within(indexRow).getByTestId('index-actions-hide-action')).to
            .exist;
          expect(() =>
            within(indexRow).getByTestId('index-actions-unhide-action')
          ).to.throw;
        }
        expect(within(indexRow).getByTestId('index-actions-delete-action')).to
          .exist;
      }

      userEvent.click(within(indexRow).getByLabelText('Expand row'));
      const detailsRow = indexRow.nextSibling as HTMLTableRowElement;
      expect(detailsRow).to.exist;

      const details = within(detailsRow).getByTestId(
        `indexes-details-${index.name}`
      );
      expect(details).to.exist;

      for (const field of index.fields) {
        expect(within(details).getByTestId(`${field.field}-key`));
      }
    }
  });

  it('renders in-progress indexes', function () {
    renderIndexList({
      isWritable: true,
      readOnly: false,
      inProgressIndexes: inProgressIndexes,
    });

    for (const index of inProgressIndexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);

      for (const indexCell of indexFields) {
        expect(within(indexRow).getByTestId(indexCell)).to.exist;
      }

      expect(() => within(indexRow).getByTestId('index-actions-hide-action')).to
        .throw;
      if (index.status === 'creating') {
        expect(() =>
          within(indexRow).getByTestId('index-actions-delete-action')
        ).to.throw;
      } else {
        expect(within(indexRow).getByTestId('index-actions-delete-action')).to
          .exist;
      }
    }
  });

  it('renders rolling indexes', function () {
    renderIndexList({
      isWritable: true,
      readOnly: false,
      rollingIndexes: rollingIndexes,
    });

    for (const index of rollingIndexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.indexName}`);

      for (const indexCell of indexFields) {
        expect(within(indexRow).getByTestId(indexCell)).to.exist;
      }

      expect(() => within(indexRow).getByTestId('index-actions-hide-action')).to
        .throw;
      expect(() => within(indexRow).getByTestId('index-actions-delete-action'))
        .to.throw;

      userEvent.click(within(indexRow).getByLabelText('Expand row'));
      const detailsRow = indexRow.nextSibling as HTMLTableRowElement;
      expect(detailsRow).to.exist;

      const details = within(detailsRow).getByTestId(
        `indexes-details-${index.indexName}`
      );
      expect(details).to.exist;

      for (const key of index.keys) {
        expect(within(details).getByTestId(`${key.name}-key`));
      }
    }
  });

  it('strips out regular indexes that are also rolling indexes', function () {
    const indexesWithRollingIndex: RegularIndex[] = [
      ...indexes,
      {
        name: rollingIndexes[0].indexName,
        fields: rollingIndexes[0].keys.map(({ name, value }) => ({
          field: name,
          value,
        })),
        type: rollingIndexes[0].indexType.label as RegularIndex['type'],
        cardinality: 'single',
        properties: [],
        extra: {},
        size: 11111,
        relativeSize: 0,
        buildProgress: 0,
      },
    ];

    // first do a sanity check to make sure that we would render it as a regular
    // index if it didn't also exist as a rolling index
    renderIndexList({
      isWritable: true,
      readOnly: false,
      indexes: indexesWithRollingIndex,
    });

    let indexRow = screen.getByTestId(
      `indexes-row-${rollingIndexes[0].indexName}`
    );
    expect(within(indexRow).getByTestId('index-ready')).to.exist;
    expect(() => within(indexRow).getByTestId('index-building')).to.throw;

    cleanup();

    // then render it along with a rolling index to make sure it is not showing
    // up as a regular index too
    renderIndexList({
      isWritable: true,
      readOnly: false,
      indexes: indexesWithRollingIndex,
      rollingIndexes,
    });

    indexRow = screen.getByTestId(`indexes-row-${rollingIndexes[0].indexName}`);
    expect(() => within(indexRow).getByTestId('index-ready')).to.throw;
    expect(within(indexRow).getByTestId('index-building')).to.exist;
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
        within(indexRow).queryByTestId('indexes-actions-field');
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

  describe('sorting', function () {
    function getIndexNames() {
      return screen.getAllByTestId('indexes-name-field').map((el) => {
        return el.textContent.trim();
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

      clickSort('Name & Definition');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name & Definition');
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

      clickSort('Name & Definition');
      expect(getIndexNames()).to.deep.eq(['a', 'b', 'c']);

      clickSort('Name & Definition');
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
