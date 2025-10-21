import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { CollectionsList } from './index';
import Sinon from 'sinon';
import {
  type PreferencesAccess,
  PreferencesProvider,
} from 'compass-preferences-model/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { CollectionProps } from 'mongodb-collection-model';

import { inspectTable, testSortColumn } from '../test/utils';

function createCollection(
  name: string,
  props: Partial<CollectionProps> = {}
): CollectionProps {
  const col = {
    _id: name,
    name: name,
    type: 'collection' as const,
    status: 'ready' as const,
    statusError: null,
    ns: `db.${name}`,
    database: 'db',
    system: true,
    oplog: true,
    command: true,
    special: false,
    specialish: false,
    normal: false,
    readonly: false,
    view_on: null,
    collation: '',
    pipeline: [],
    validation: '',
    properties: [],
    is_capped: false,
    isTimeSeries: false,
    isView: false,
    inferred_from_privileges: false,
    /** Only relevant for a view and identifies collection/view from which this view was created. */
    sourceName: null,
    source: {} as any,
    // collStats
    document_count: 10,
    document_size: 11,
    avg_document_size: 150,
    storage_size: 2500,
    free_storage_size: 1000,
    index_count: 15,
    index_size: 16,
    calculated_storage_size: undefined,
    ...props,
  };

  return col;
}

function createTimeSeries(
  name: string,
  props: Partial<CollectionProps> = {}
): CollectionProps {
  return {
    ...createCollection(name, props),
    type: 'timeseries' as const,
  };
}
const colls: CollectionProps[] = [
  createCollection('foo', {
    storage_size: 1000,
    document_count: 10,
    avg_document_size: 100,
    index_count: 5,
    index_size: 500,
  }),
  createCollection('garply', {
    storage_size: 1000,
    document_count: 0,
    avg_document_size: 0,
    index_count: 0,
    index_size: 0,
    inferred_from_privileges: true,
  }),
  createCollection('bar', {
    storage_size: undefined,
    document_count: undefined,
    avg_document_size: undefined,
    index_count: undefined,
    index_size: undefined,
    type: 'view',
    properties: [{ id: 'view' }],
  }),
  createTimeSeries('baz', {
    storage_size: 5000,
    document_count: undefined,
    avg_document_size: undefined,
    index_size: undefined,
    type: 'timeseries',
    index_count: undefined,
    properties: [{ id: 'timeseries' }],
  }),
  createCollection('qux', {
    storage_size: 7000,
    document_count: undefined,
    avg_document_size: undefined,
    index_count: 5,
    index_size: 17000,
    properties: [{ id: 'capped' }],
  }),
  createCollection('quux', {
    storage_size: 6000,
    document_count: undefined,
    avg_document_size: undefined,
    index_count: 1,
    index_size: 10000000,
    properties: [{ id: 'collation' }],
  }),
  createCollection('corge', {
    storage_size: 4000,
    document_count: undefined,
    avg_document_size: undefined,
    index_count: 11,
    index_size: 555,
    properties: [{ id: 'clustered' }],
  }),
  createCollection('grault', {
    storage_size: 2000,
    document_count: undefined,
    avg_document_size: undefined,
    index_count: 3,
    index_size: 333333,
    properties: [{ id: 'fle2' }],
  }),
  createCollection('waldo', {
    storage_size: 100,
    document_count: 27,
    avg_document_size: 10000,
    index_count: 5,
    index_size: 123456,
  }),
  createCollection('fred', {
    storage_size: 200,
    document_count: 13,
    avg_document_size: 5000,
    index_count: 17,
    index_size: 200000,
  }),
];

describe('Collections', () => {
  let preferences: PreferencesAccess;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(cleanup);

  const renderCollectionsList = (
    props: Partial<React.ComponentProps<typeof CollectionsList>>
  ) => {
    const clickSpy = Sinon.spy();
    const deleteSpy = Sinon.spy();
    const createSpy = Sinon.spy();
    const refreshSpy = Sinon.spy();
    render(
      <PreferencesProvider value={preferences}>
        <CollectionsList
          onCollectionClick={clickSpy}
          onDeleteCollectionClick={deleteSpy}
          onCreateCollectionClick={createSpy}
          onRefreshClick={refreshSpy}
          virtual={false}
          namespace="db"
          collections={[]}
          {...props}
        ></CollectionsList>
      </PreferencesProvider>
    );

    return {
      clickSpy,
      deleteSpy,
      createSpy,
      refreshSpy,
    };
  };

  it('should render the collection list', () => {
    const { clickSpy, deleteSpy, createSpy, refreshSpy } =
      renderCollectionsList({
        collections: colls,
      });

    const result = inspectTable(screen, 'collections-list');

    expect(result.list).to.exist;

    expect(result.table).to.have.lengthOf(10);

    expect(result.columns).to.deep.equal([
      'Collection name',
      'Properties',
      'Storage size',
      'Documents',
      'Avg. document size',
      'Indexes',
      'Total index size',
      '', // Actions
    ]);

    userEvent.click(screen.getByText('Create collection'));
    expect(createSpy.calledOnce).to.be.true;

    userEvent.click(screen.getByText('Refresh'));
    expect(refreshSpy.calledOnce).to.be.true;

    expect(createSpy.calledOnce).to.be.true;

    userEvent.click(screen.getByTestId('collections-list-row-foo'));
    expect(clickSpy.calledOnce).to.be.true;

    const row = screen.getByTestId('collections-list-row-foo');
    userEvent.hover(row);

    const deleteButton = row.querySelector('[title="Delete foo"]');
    expect(deleteButton).to.exist;
    userEvent.click(deleteButton as Element);
    expect(deleteSpy.calledOnce).to.be.true;
  });

  it('sorts by Collection name', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Collection name', [
      [
        'foo',
        'garply',
        'bar',
        'baz',
        'qux',
        'quux',
        'corge',
        'grault',
        'waldo',
        'fred',
      ],
      [
        'bar',
        'baz',
        'corge',
        'foo',
        'fred',
        'garply',
        'grault',
        'quux',
        'qux',
        'waldo',
      ],
      [
        'waldo',
        'qux',
        'quux',
        'grault',
        'garply',
        'fred',
        'foo',
        'corge',
        'baz',
        'bar',
      ],
    ]);
  });

  it('sorts by Properties', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Properties', [
      [
        '-',
        '-',
        'view',
        'timeseries',
        'capped',
        'collation',
        'clustered',
        'Queryable Encryption',
        '-',
        '-',
      ],
      [
        'view',
        'timeseries',
        'capped',
        'collation',
        'clustered',
        'Queryable Encryption',
        '-',
        '-',
        '-',
        '-',
      ],
      [
        '-',
        '-',
        '-',
        '-',
        'Queryable Encryption',
        'clustered',
        'collation',
        'capped',
        'timeseries',
        'view',
      ],
    ]);
  });
  it('sorts by Storage size', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Storage size', [
      [
        '1.00 kB',
        '1.00 kB',
        '-', // views don't use storage size
        '5.00 kB',
        '7.00 kB',
        '6.00 kB',
        '4.00 kB',
        '2.00 kB',
        '100.00 B',
        '200.00 B',
      ],
      [
        '7.00 kB',
        '6.00 kB',
        '5.00 kB',
        '4.00 kB',
        '2.00 kB',
        '1.00 kB',
        '1.00 kB',
        '200.00 B',
        '100.00 B',
        '-',
      ],
      [
        '100.00 B',
        '200.00 B',
        '1.00 kB',
        '1.00 kB',
        '2.00 kB',
        '4.00 kB',
        '5.00 kB',
        '6.00 kB',
        '7.00 kB',
        '-',
      ],
    ]);
  });

  it('sorts by Documents', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Documents', [
      ['10', '0', '-', '-', '-', '-', '-', '-', '27', '13'],
      ['27', '13', '10', '0', '-', '-', '-', '-', '-', '-'],
      ['0', '10', '13', '27', '-', '-', '-', '-', '-', '-'],
    ]);
  });

  it('sorts by Avg. document size', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Avg. document size', [
      ['100.00 B', '0 B', '-', '-', '-', '-', '-', '-', '10.00 kB', '5.00 kB'],
      ['10.00 kB', '5.00 kB', '100.00 B', '0 B', '-', '-', '-', '-', '-', '-'],
      ['0 B', '100.00 B', '5.00 kB', '10.00 kB', '-', '-', '-', '-', '-', '-'],
    ]);
  });

  it('sorts by Indexes', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Indexes', [
      ['5', '0', '-', '-', '5', '1', '11', '3', '5', '17'],
      ['17', '11', '5', '5', '5', '3', '1', '0', '-', '-'],
      ['0', '1', '3', '5', '5', '5', '11', '17', '-', '-'],
    ]);
  });

  it('sorts by Total index size', async function () {
    renderCollectionsList({
      collections: colls,
    });

    await testSortColumn(screen, 'collections-list', 'Total index size', [
      [
        '500.00 B',
        '0 B',
        '-',
        '-',
        '17.00 kB',
        '10.00 MB',
        '555.00 B',
        '333.33 kB',
        '123.46 kB',
        '200.00 kB',
      ],
      [
        '10.00 MB',
        '333.33 kB',
        '200.00 kB',
        '123.46 kB',
        '17.00 kB',
        '555.00 B',
        '500.00 B',
        '0 B',
        '-',
        '-',
      ],
      [
        '0 B',
        '500.00 B',
        '555.00 B',
        '17.00 kB',
        '123.46 kB',
        '200.00 kB',
        '333.33 kB',
        '10.00 MB',
        '-',
        '-',
      ],
    ]);
  });

  it('does not render stats with enableDbAndCollStats disabled', async function () {
    await preferences.savePreferences({ enableDbAndCollStats: false });

    renderCollectionsList({
      collections: colls,
    });

    const result = inspectTable(screen, 'collections-list');
    expect(result.table).to.deep.equal([
      ['foo', '-', '-', '-', '-', '-', '-', ''],
      ['garply', '-', '-', '-', '-', '-', '-', ''],
      ['bar', 'view', '-', '-', '-', '-', '-', ''],
      ['baz', 'timeseries', '-', '-', '-', '-', '-', ''],
      ['qux', 'capped', '-', '-', '-', '-', '-', ''],
      ['quux', 'collation', '-', '-', '-', '-', '-', ''],
      ['corge', 'clustered', '-', '-', '-', '-', '-', ''],
      ['grault', 'Queryable Encryption', '-', '-', '-', '-', '-', ''],
      ['waldo', '-', '-', '-', '-', '-', '-', ''],
      ['fred', '-', '-', '-', '-', '-', '-', ''],
    ]);
  });

  it('renders loaders while still loading data', function () {
    renderCollectionsList({
      collections: colls.map((coll) => {
        return { ...coll, status: 'fetching' as const };
      }),
    });

    const result = inspectTable(screen, 'collections-list');
    expect(result.table).to.deep.equal([
      ['foo', '', '', '', '', '', '', ''],
      ['garply', '', '', '', '', '', '', ''],
      ['bar', '', '', '', '', '', '', ''],
      ['baz', '', '', '', '', '', '', ''],
      ['qux', '', '', '', '', '', '', ''],
      ['quux', '', '', '', '', '', '', ''],
      ['corge', '', '', '', '', '', '', ''],
      ['grault', '', '', '', '', '', '', ''],
      ['waldo', '', '', '', '', '', '', ''],
      ['fred', '', '', '', '', '', '', ''],
    ]);
    expect(
      result.list.querySelectorAll('[data-testid="placeholder"]')
    ).to.have.lengthOf(60);
  });

  // TODO
  it('renders a tooltip when inferred_from_privileges is true', async function () {
    renderCollectionsList({
      collections: colls,
    });

    const result = inspectTable(screen, 'collections-list');
    const icon = result.trs[1].querySelector(
      '[aria-label="Info With Circle Icon"]'
    );
    expect(icon).to.exist;

    userEvent.hover(icon as Element);
    await waitFor(
      function () {
        expect(screen.getByRole('tooltip')).to.exist;
      },
      {
        timeout: 5000,
      }
    );

    expect(screen.getByRole('tooltip').textContent).to.equal(
      'Your privileges grant you access to this namespace, but it might not currently exist'
    );
  });
});
