import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EJSON, UUID } from 'bson';
import Sinon from 'sinon';
import { recentQueries, favoriteQueries } from '../test/fixtures/index';
import { RecentQueryStorage, FavoriteQueryStorage } from './query-storage';

const queries = [
  {
    filter: {},
    _id: new UUID().toString(),
    _lastExecuted: new Date(),
    _ns: 'airbnb.listings',
  },
  {
    filter: { name: 1 },
    project: { _id: 1 },
    _id: new UUID().toString(),
    _lastExecuted: new Date(),
    _ns: 'airbnb.listings',
  },
];

const maxAllowedRecentQueries = 30;

describe('RecentQueryStorage', function () {
  let queryHistoryStorage: RecentQueryStorage;

  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
    queryHistoryStorage = new RecentQueryStorage({
      basepath: tmpDir,
    });
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  const writeQuery = async (
    query: { _id: string },
    subDir: 'RecentQueries' | 'FavoriteQueries' = 'RecentQueries'
  ) => {
    const basepath = path.join(tmpDir, subDir);
    await fs.mkdir(basepath, { recursive: true });
    await fs.writeFile(
      path.join(basepath, `${query._id}.json`),
      EJSON.stringify(query)
    );
  };

  const createNumberOfQueries = async (num: number) => {
    const queries = Array.from({ length: num }, (v, i) => ({
      _id: new UUID().toString(),
      _ns: 'airbnb.users',
      _lastExecuted: new Date(1690876213077 - (i + 1) * 1000), // Difference of 1 sec
    }));
    await Promise.all(queries.map((query) => writeQuery(query)));
    return queries;
  };

  it('loads files from storage', async function () {
    await Promise.all(queries.map((query) => writeQuery(query)));

    const data = await queryHistoryStorage.loadAll();
    expect(data).to.have.lengthOf(2);

    expect(data.find((x) => x._id === queries[0]._id)).to.deep.equal(
      queries[0]
    );
    expect(data.find((x) => x._id === queries[1]._id)).to.deep.equal(
      queries[1]
    );
  });

  it('updates data in storage if files exists', async function () {
    await Promise.all(queries.map((query) => writeQuery(query)));

    const query = queries[0];
    await queryHistoryStorage.updateAttributes(query._id, {
      _host: 'localhost',
    });

    const data = await queryHistoryStorage.loadAll();
    expect(data).to.have.lengthOf(2);

    const expectedData = data.find((x) => x._id === query._id);
    expect(expectedData).to.deep.equal({ ...query, _host: 'localhost' });
  });

  it('creates item in storage if files does not exist', async function () {
    await Promise.all(queries.map((query) => writeQuery(query)));

    const query = {
      sort: { name: 1 },
      _id: new UUID().toString(),
      _lastExecuted: new Date(),
      _ns: 'airbnb.listings',
    };
    await queryHistoryStorage.updateAttributes(query._id, query);

    const data = await queryHistoryStorage.loadAll();
    expect(data).to.have.lengthOf(3);

    const expectedData = data.find((x) => x._id === query._id);
    expect(expectedData).to.deep.equal(query);

    // remove
    await queryHistoryStorage.delete(query._id);
  });

  it('deletes file from storage', async function () {
    await Promise.all(queries.map((query) => writeQuery(query)));

    await queryHistoryStorage.delete(queries[0]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(1);

    await queryHistoryStorage.delete(queries[1]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(0);
  });

  context(
    `limits saved recent queries to ${maxAllowedRecentQueries}`,
    function () {
      it('truncates recents queries to max allowed queries', async function () {
        const queries = await createNumberOfQueries(maxAllowedRecentQueries);

        const deleteSpy = Sinon.spy(queryHistoryStorage, 'delete');

        // Save another query
        await queryHistoryStorage.saveQuery({
          _ns: 'airbnb.users',
          filter: {},
        });

        const numQueries = (await queryHistoryStorage.loadAll()).length;
        expect(numQueries).to.equal(maxAllowedRecentQueries);

        expect(deleteSpy).to.have.been.calledOnceWithExactly(
          queries[queries.length - 1]._id
        );
      });

      it('does not remove recent query if recents are less then max allowed queries', async function () {
        await createNumberOfQueries(maxAllowedRecentQueries - 1);

        const deleteSpy = Sinon.spy(queryHistoryStorage, 'delete');

        // Save another query
        await queryHistoryStorage.saveQuery({
          _ns: 'airbnb.users',
          filter: {},
        });

        const numQueries = (await queryHistoryStorage.loadAll()).length;
        expect(numQueries).to.equal(maxAllowedRecentQueries);

        expect(deleteSpy.called).to.be.false;
      });
    }
  );

  for (const { query, version } of recentQueries) {
    it(`supports recent query from Compass v${version}`, async function () {
      await writeQuery(query, 'RecentQueries');
      const recentQueryStorage = new RecentQueryStorage({
        basepath: tmpDir,
      });
      const [loadedQuery] = await recentQueryStorage.loadAll();
      expect(loadedQuery._id).to.equal(query._id);
      expect(Object.keys(loadedQuery).sort()).to.deep.equal(
        Object.keys(query).sort()
      );

      expect(loadedQuery._lastExecuted).to.be.instanceOf(Date);
    });
  }

  for (const { query, version } of favoriteQueries) {
    it(`supports favorite query from Compass v${version}`, async function () {
      await writeQuery(query, 'FavoriteQueries');
      const favoriteQueryStorage = new FavoriteQueryStorage({
        basepath: tmpDir,
      });
      const [loadedQuery] = await favoriteQueryStorage.loadAll();
      expect(loadedQuery._id).to.equal(query._id);
      expect(Object.keys(loadedQuery).sort()).to.deep.equal(
        Object.keys(query).sort()
      );

      expect(loadedQuery._lastExecuted).to.be.instanceOf(Date);
      expect(loadedQuery._dateSaved).to.be.instanceOf(Date);

      // We did not have _dateModified in older version of Compass
      // and we introduced it in `saved-query-aggregations` project
      // which was release as part of 1.31.0
      if (version !== '1.27.0') {
        expect(loadedQuery._dateModified).to.be.instanceOf(Date);
      }
    });
  }
});

describe('FavoriteQueryStorage', function () {
  let queryFavoriteStorage: FavoriteQueryStorage;

  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
    queryFavoriteStorage = new FavoriteQueryStorage({
      basepath: tmpDir,
    });
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  it('should retrieve saved queries', async function () {
    await queryFavoriteStorage.saveQuery({
      _ns: 'test.test',
      _name: 'my-query',
      filter: { a: 1 },
      update: { $set: { a: 2 } },
    });

    const loaded = await queryFavoriteStorage.loadAll();
    expect(loaded.length).to.be.greaterThan(0);

    const [query] = loaded;
    expect(query._name).to.equal('my-query');
    expect(query._ns).to.equal('test.test');
    expect(query.filter).to.deep.equal({ a: 1 });
    expect(query.update).to.deep.equal({ $set: { a: 2 } });
  });
});
