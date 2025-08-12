import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { DatabasesList, CollectionsList } from './index';
import Sinon from 'sinon';
import {
  type PreferencesAccess,
  PreferencesProvider,
} from 'compass-preferences-model/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

function createDatabase(name) {
  return {
    _id: name,
    name: name,
    status: 'ready' as const,
    statusError: null,
    collectionsLength: 35,
    collectionsStatus: 'ready' as const,
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
}

function createCollection(name, props: any = {}) {
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
    ...props,
  };

  if (col.storage_size !== undefined && col.free_storage_size !== undefined) {
    col.calculated_storage_size = col.storage_size - col.free_storage_size;
  }

  return col;
}

function createTimeSeries(name, props: any = {}) {
  return {
    ...createCollection(name, props),
    type: 'timeseries' as const,
  };
}

const dbs = [
  createDatabase('foo'),
  createDatabase('bar'),
  createDatabase('buz'),
  createDatabase('bat'),
];

const colls = [
  createCollection('foo.foo', { storage_size: 1000, free_storage_size: 1000 }), // 1000
  createCollection('bar.bar', { storage_size: 2000, free_storage_size: 500 }), // 1500
  createCollection('buz.buz', { storage_size: 3000, free_storage_size: 2000 }), // 1000
  createTimeSeries('bat.bat', { storage_size: 4000, free_storage_size: 0 }), // 4000
];

describe('databases and collections list', function () {
  describe('DatabasesList', function () {
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
    });

    afterEach(cleanup);

    const renderDatabasesList = (props) => {
      render(
        <PreferencesProvider value={preferences}>
          <DatabasesList {...props}></DatabasesList>
        </PreferencesProvider>
      );
    };

    it('should render databases in a list', function () {
      const clickSpy = Sinon.spy();

      renderDatabasesList({ databases: dbs, onDatabaseClick: clickSpy });

      expect(screen.getByTestId('database-grid')).to.exist;

      expect(screen.getAllByTestId('database-grid-item')).to.have.lengthOf(4);

      expect(screen.getByText('foo')).to.exist;
      expect(screen.getByText('bar')).to.exist;
      expect(screen.getByText('buz')).to.exist;

      userEvent.click(screen.getByText('foo'));

      expect(clickSpy).to.be.calledWith('foo');
    });

    it('should render database with statistics when dbStats are enabled', async function () {
      const clickSpy = Sinon.spy();

      const db = createDatabase('foo');
      await preferences.savePreferences({ enableDbAndCollStats: true });

      renderDatabasesList({ databases: [db], onDatabaseClick: clickSpy });

      expect(screen.getByTestId('database-grid')).to.exist;

      expect(screen.getAllByTestId('database-grid-item')).to.have.lengthOf(1);
      expect(screen.getByText('foo')).to.exist;

      expect(screen.getByText(/Storage size/)).to.exist;
      expect(screen.getByText('1.50 kB')).to.exist;
      expect(screen.getByText(/Collections/)).to.exist;
      expect(screen.getByText('35')).to.exist;
      expect(screen.getByText(/Indexes/)).to.exist;
      expect(screen.getByText('25')).to.exist;
    });

    it('should render database without statistics when dbStats are disabled', async function () {
      const clickSpy = Sinon.spy();

      const db = createDatabase('foo');
      await preferences.savePreferences({ enableDbAndCollStats: false });

      renderDatabasesList({ databases: [db], onDatabaseClick: clickSpy });

      expect(screen.getByTestId('database-grid')).to.exist;

      expect(screen.getAllByTestId('database-grid-item')).to.have.lengthOf(1);
      expect(screen.getByText('foo')).to.exist;

      expect(screen.queryByText(/Storage size/)).not.to.exist;
      expect(screen.queryByText('1.50 kB')).not.to.exist;
      expect(screen.queryByText(/Collections/)).not.to.exist;
      expect(screen.queryByText('35')).not.to.exist;
      expect(screen.queryByText(/Indexes/)).not.to.exist;
      expect(screen.queryByText('25')).not.to.exist;
    });
  });

  describe('CollectionsList', function () {
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
    });

    afterEach(cleanup);

    const renderCollectionsList = (props) => {
      render(
        <PreferencesProvider value={preferences}>
          <CollectionsList {...props}></CollectionsList>
        </PreferencesProvider>
      );
    };

    it('should render collections in a list', function () {
      const clickSpy = Sinon.spy();

      renderCollectionsList({
        namespace: 'db',
        collections: colls,
        onCollectionClick: clickSpy,
      });

      expect(screen.getByTestId('collection-grid')).to.exist;

      expect(screen.getAllByTestId('collection-grid-item')).to.have.lengthOf(4);

      expect(screen.getByText('foo.foo')).to.exist;
      expect(screen.getByText('bar.bar')).to.exist;
      expect(screen.getByText('buz.buz')).to.exist;

      userEvent.click(screen.getByText('bar.bar'));

      expect(clickSpy).to.be.calledWith('bar.bar');
    });

    it('should sort collections', function () {
      renderCollectionsList({
        namespace: 'db',
        collections: colls,
      });

      screen
        .getByRole('button', {
          name: 'Sort by',
        })
        .click();

      screen
        .getByRole('option', {
          name: 'Storage size',
        })
        .click();

      const sorted = screen
        .getAllByRole('gridcell')
        .map((el: HTMLElement) => el.getAttribute('data-id'));
      expect(sorted).to.deep.equal([
        'foo.foo',
        'buz.buz',
        'bar.bar',
        'bat.bat',
      ]);
    });

    it('should not display statistics (except storage size) on timeseries collection card', function () {
      renderCollectionsList({
        namespace: 'db',
        collections: colls,
        onCollectionClick: () => {},
      });

      const timeseriesCard = screen
        .getByText('bat.bat')
        .closest('[data-testid="collection-grid-item"]');
      expect(timeseriesCard).to.exist;
      expect(timeseriesCard).to.contain.text('Storage size:');
      expect(timeseriesCard).to.not.contain.text('Documents:');
      expect(timeseriesCard).to.not.contain.text('Avg. document size::');
      expect(timeseriesCard).to.not.contain.text('Indexes:');
      expect(timeseriesCard).to.not.contain.text('Total index size:');
    });

    it('should display statistics when collStats are enabled', async function () {
      await preferences.savePreferences({ enableDbAndCollStats: true });

      const coll = createCollection('bar');

      renderCollectionsList({
        namespace: 'db',
        collections: [coll],
        onCollectionClick: () => {},
      });

      expect(screen.getByText(/Storage size/)).to.exist;
      expect(screen.getByText('1.50 kB')).to.exist;
      expect(screen.getByText(/Documents/)).to.exist;
      expect(screen.getByText('10')).to.exist;
      expect(screen.getByText(/Avg. document size/)).to.exist;
      expect(screen.getByText('150.00 B')).to.exist;
      expect(screen.getByText(/Indexes/)).to.exist;
      expect(screen.getByText('15')).to.exist;
      expect(screen.getByText(/Total index size/)).to.exist;
      expect(screen.getByText('16.00 B')).to.exist;
    });

    it('should not display statistics when collStats are disabled', async function () {
      await preferences.savePreferences({ enableDbAndCollStats: false });

      const coll = createCollection('bar');

      renderCollectionsList({
        namespace: 'db',
        collections: [coll],
        onCollectionClick: () => {},
      });

      expect(screen.queryByText(/Storage size/)).not.to.exist;
      expect(screen.queryByText('1.50 kB')).not.to.exist;
      expect(screen.queryByText(/Documents/)).not.to.exist;
      expect(screen.queryByText('10')).not.to.exist;
      expect(screen.queryByText(/Avg. document size/)).not.to.exist;
      expect(screen.queryByText('150.00 B')).not.to.exist;
      expect(screen.queryByText(/Indexes/)).not.to.exist;
      expect(screen.queryByText('15')).not.to.exist;
      expect(screen.queryByText(/Total index size/)).not.to.exist;
      expect(screen.queryByText('16.00 B')).not.to.exist;
    });
  });
});
