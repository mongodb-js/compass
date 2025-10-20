import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { DatabasesList } from './index';
import Sinon from 'sinon';
import {
  type PreferencesAccess,
  PreferencesProvider,
} from 'compass-preferences-model/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { DatabaseProps } from 'mongodb-database-model';
import { inspectTable, testSortColumn } from '../test/utils';

function createDatabase(name: string): DatabaseProps {
  const db: DatabaseProps = {
    _id: name,
    name: name,
    status: 'ready',
    statusError: null,
    collectionsLength: 35,
    collectionsStatus: 'ready',
    collectionsStatusError: null,
    collection_count: 1,
    collections: [] as any,
    inferred_from_privileges: false,
    // dbStats
    document_count: 10,
    storage_size: 1500,
    data_size: 1000,
    index_count: 25,
    index_size: 100,
  };
  return db;
}

const dbs: DatabaseProps[] = [
  {
    ...createDatabase('foo'),
    storage_size: 5000,
    collectionsLength: 5,
    index_count: 5,
  },
  {
    ...createDatabase('bar'),
    storage_size: 0,
    collectionsLength: 1,
    index_count: 10,
    inferred_from_privileges: true,
  },
  {
    ...createDatabase('buz'),
    storage_size: 10000,
    collectionsLength: 10_001,
    index_count: 12,
  },
  {
    ...createDatabase('bat'),
    storage_size: 7500,
    collectionsLength: 7,
    index_count: 9,
  },
];

describe('Databases', function () {
  let preferences: PreferencesAccess;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(cleanup);

  const renderDatabasesList = (
    props: Partial<React.ComponentProps<typeof DatabasesList>>
  ) => {
    const clickSpy = Sinon.spy();
    const deleteSpy = Sinon.spy();
    const createSpy = Sinon.spy();
    const refreshSpy = Sinon.spy();

    render(
      <PreferencesProvider value={preferences}>
        <DatabasesList
          databases={[]}
          onDatabaseClick={clickSpy}
          onDeleteDatabaseClick={deleteSpy}
          onCreateDatabaseClick={createSpy}
          onRefreshClick={refreshSpy}
          virtual={false}
          {...props}
        ></DatabasesList>
      </PreferencesProvider>
    );

    return {
      clickSpy,
      deleteSpy,
      createSpy,
      refreshSpy,
    };
  };

  it('should render the database list', function () {
    const { clickSpy, deleteSpy, createSpy, refreshSpy } = renderDatabasesList({
      databases: dbs,
    });

    const result = inspectTable(screen, 'databases-list');

    expect(result.list).to.exist;

    expect(result.table).to.have.lengthOf(4);

    expect(result.columns).to.deep.equal([
      'Database name',
      'Storage size',
      'Collections',
      'Indexes',
      '', // Actions
    ]);

    userEvent.click(screen.getByText('Create database'));
    expect(createSpy.calledOnce).to.be.true;

    userEvent.click(screen.getByText('Refresh'));
    expect(refreshSpy.calledOnce).to.be.true;

    expect(createSpy.calledOnce).to.be.true;

    userEvent.click(screen.getByTestId('databases-list-row-foo'));
    expect(clickSpy.calledOnce).to.be.true;

    const row = screen.getByTestId('databases-list-row-foo');
    userEvent.hover(row);

    const deleteButton = row.querySelector('[title="Delete foo"]');
    expect(deleteButton).to.exist;
    userEvent.click(deleteButton as Element);
    expect(deleteSpy.calledOnce).to.be.true;
  });

  it('sorts by "Database name"', async function () {
    renderDatabasesList({
      databases: dbs,
    });

    await testSortColumn(screen, 'databases-list', 'Database name', [
      ['foo', 'bar', 'buz', 'bat'],
      ['bar', 'bat', 'buz', 'foo'],
      ['foo', 'buz', 'bat', 'bar'],
    ]);
  });

  it('sorts by "Storage size"', async function () {
    renderDatabasesList({
      databases: dbs,
    });

    await testSortColumn(screen, 'databases-list', 'Storage size', [
      ['5.00 kB', '0 B', '10.00 kB', '7.50 kB'],
      ['10.00 kB', '7.50 kB', '5.00 kB', '0 B'],
      ['0 B', '5.00 kB', '7.50 kB', '10.00 kB'],
    ]);
  });

  it('sorts by "Collections"', async function () {
    renderDatabasesList({
      databases: dbs,
    });

    await testSortColumn(screen, 'databases-list', 'Collections', [
      ['5', '1', '10K insight', '7'],
      ['10K insight', '7', '5', '1'],
      ['1', '5', '7', '10K insight'],
    ]);
  });

  it('sorts by "Indexes"', async function () {
    renderDatabasesList({
      databases: dbs,
    });

    await testSortColumn(screen, 'databases-list', 'Indexes', [
      ['5', '10', '12', '9'],
      ['12', '10', '9', '5'],
      ['5', '9', '10', '12'],
    ]);
  });

  it('renders renderLoadSampleDataBanner() if provided', function () {
    renderDatabasesList({
      databases: dbs,
      renderLoadSampleDataBanner: () => <div>Sample Data Banner</div>,
    });

    expect(screen.getByText('Sample Data Banner')).to.exist;
  });

  it('renders performance insights', function () {
    renderDatabasesList({
      databases: dbs,
    });
    expect(screen.getByTestId('insight-badge-text')).to.exist;
  });

  it('does not render stats with enableDbAndCollStats disabled', async function () {
    await preferences.savePreferences({ enableDbAndCollStats: false });

    renderDatabasesList({
      databases: dbs,
    });

    const result = inspectTable(screen, 'databases-list');
    expect(result.table).to.deep.equal([
      ['foo', '-', '-', '-', ''],
      ['bar', '-', '-', '-', ''],
      ['buz', '-', '-', '-', ''],
      ['bat', '-', '-', '-', ''],
    ]);
  });

  it('renders loaders while still loading data', function () {
    renderDatabasesList({
      databases: dbs.map((db) => {
        return { ...db, status: 'fetching' as const };
      }),
    });

    const result = inspectTable(screen, 'databases-list');
    expect(result.table).to.deep.equal([
      ['foo', '', '', '', ''],
      ['bar', '', '', '', ''],
      ['buz', '', '', '', ''],
      ['bat', '', '', '', ''],
    ]);
    expect(
      result.list.querySelectorAll('[data-testid="placeholder"]')
    ).to.have.lengthOf(12);
  });

  it('renders a tooltip when inferred_from_privileges is true', async function () {
    renderDatabasesList({
      databases: dbs,
    });

    const result = inspectTable(screen, 'databases-list');
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
