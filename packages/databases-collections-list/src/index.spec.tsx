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
    is_non_existent: false,
    // dbStats
    document_count: 10,
    storage_size: 1500,
    data_size: 1000,
    index_count: 25,
    index_size: 100,
  };
}

function createCollection(name) {
  return {
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
    is_non_existent: false,
    /** Only relevant for a view and identifies collection/view from which this view was created. */
    sourceName: null,
    source: {} as any,
    // collStats
    document_count: 10,
    document_size: 11,
    avg_document_size: 12,
    storage_size: 13,
    free_storage_size: 14,
    index_count: 15,
    index_size: 16,
  };
}

function createTimeSeries(name) {
  return {
    ...createCollection(name),
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
  createCollection('foo.foo'),
  createCollection('bar.bar'),
  createCollection('buz.buz'),
  createTimeSeries('bat.bat'),
];

describe('databases and collections list', function () {
  describe('DatabasesList', function () {
    afterEach(cleanup);

    it('should render databases in a list', function () {
      const clickSpy = Sinon.spy();

      render(
        <DatabasesList
          databases={dbs}
          onDatabaseClick={clickSpy}
        ></DatabasesList>
      );

      expect(screen.getByTestId('database-grid')).to.exist;

      expect(screen.getAllByTestId('database-grid-item')).to.have.lengthOf(4);

      expect(screen.getByText('foo')).to.exist;
      expect(screen.getByText('bar')).to.exist;
      expect(screen.getByText('buz')).to.exist;

      userEvent.click(screen.getByText('foo'));

      expect(clickSpy).to.be.calledWith('foo');
    });

    it('should render database with dbStats when dbStats are enabled', async function () {
      const clickSpy = Sinon.spy();

      const db = createDatabase('foo');
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableDbAndCollStats: true });

      render(
        <PreferencesProvider value={preferences}>
          <DatabasesList
            databases={[db]}
            onDatabaseClick={clickSpy}
          ></DatabasesList>
        </PreferencesProvider>
      );

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

    it('should render database without dbStats when dbStats are disabled', async function () {
      const clickSpy = Sinon.spy();

      const db = createDatabase('foo');
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableDbAndCollStats: false });

      render(
        <PreferencesProvider value={preferences}>
          <DatabasesList
            databases={[db]}
            onDatabaseClick={clickSpy}
          ></DatabasesList>
        </PreferencesProvider>
      );

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
    afterEach(cleanup);

    it('should render collections in a list', function () {
      const clickSpy = Sinon.spy();

      render(
        <CollectionsList
          namespace="db"
          collections={colls}
          onCollectionClick={clickSpy}
        ></CollectionsList>
      );

      expect(screen.getByTestId('collection-grid')).to.exist;

      expect(screen.getAllByTestId('collection-grid-item')).to.have.lengthOf(4);

      expect(screen.getByText('foo.foo')).to.exist;
      expect(screen.getByText('bar.bar')).to.exist;
      expect(screen.getByText('buz.buz')).to.exist;

      userEvent.click(screen.getByText('bar.bar'));

      expect(clickSpy).to.be.calledWith('bar.bar');
    });

    it('should not display statistics (except storage size) on timeseries collection card', function () {
      render(
        <CollectionsList
          namespace="db"
          collections={colls}
          onCollectionClick={() => {}}
        ></CollectionsList>
      );

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
  });
});
