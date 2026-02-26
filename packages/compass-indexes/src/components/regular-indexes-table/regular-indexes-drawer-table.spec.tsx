import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { RegularIndexesDrawerTable } from './regular-indexes-drawer-table';
import { setupStore } from '../../../test/setup-store';
import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';
import type { RootState } from '../../modules';

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
    fields: [{ field: '_id', value: 1 }],
    usageCount: 10,
    buildProgress: {},
  },
  {
    ns: 'db.coll',
    cardinality: 'compound',
    name: 'album_id_artist_id',
    size: 20,
    relativeSize: 25,
    type: 'text',
    extra: { hidden: true },
    properties: [],
    fields: [
      { field: 'album_id', value: 1 },
      { field: 'artist_id', value: -1 },
    ],
    usageCount: 15,
    buildProgress: {},
  },
];

const inProgressIndexes: InProgressIndex[] = [
  {
    id: 'in-progress-1',
    name: 'AAAA',
    fields: [
      { field: 'a', value: 1 },
      { field: 'b', value: -1 },
    ],
    status: 'creating',
    buildProgress: {},
  },
];

const rollingIndexes: RollingIndex[] = [
  {
    indexName: 'my-rolling-index',
    indexType: { label: 'regular' },
    keys: [{ name: 'title', value: 'text' }],
  },
];

const renderIndexList = (
  props: Partial<React.ComponentProps<typeof RegularIndexesDrawerTable>> = {},
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
      <RegularIndexesDrawerTable
        indexes={[]}
        inProgressIndexes={[]}
        rollingIndexes={[]}
        serverVersion="4.4.0"
        onHideIndexClick={noop}
        onUnhideIndexClick={noop}
        onDeleteIndexClick={noop}
        onDeleteFailedIndexClick={noop}
        onCreateRegularIndexClick={noop}
        {...props}
      />
    </Provider>
  );
};

describe('RegularIndexesDrawerTable Component', function () {
  before(cleanup);
  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  it('renders regular indexes', function () {
    renderIndexList({ indexes }, { isWritable: true });

    for (const index of indexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(indexRow, 'it renders each index in a row').to.exist;

      // Verify name field exists
      expect(within(indexRow).getByTestId('indexes-name-field')).to.exist;
    }
  });

  it('renders in-progress indexes', function () {
    renderIndexList({ inProgressIndexes }, { isWritable: true });

    for (const index of inProgressIndexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.name}`);
      expect(indexRow).to.exist;
    }
  });

  it('renders rolling indexes', function () {
    renderIndexList({ rollingIndexes }, { isWritable: true });

    for (const index of rollingIndexes) {
      const indexRow = screen.getByTestId(`indexes-row-${index.indexName}`);
      expect(indexRow).to.exist;
    }
  });

  it('renders the zero state when there are no indexes', function () {
    const onCreateSpy = sinon.spy();
    renderIndexList(
      { indexes: [], onCreateRegularIndexClick: onCreateSpy },
      { isWritable: true }
    );

    expect(screen.getByText('No standard indexes found')).to.exist;
  });

  it('does not render the list if there is an error', function () {
    renderIndexList({ indexes, error: 'moo' }, { isWritable: true });

    expect(() => screen.getByTestId('indexes-list')).to.throw();
  });

  it('filters indexes based on searchTerm', function () {
    renderIndexList({ indexes, searchTerm: 'album' }, { isWritable: true });

    expect(screen.getByTestId('indexes-row-album_id_artist_id')).to.exist;
    expect(() => screen.getByTestId('indexes-row-_id_')).to.throw();
  });
});
