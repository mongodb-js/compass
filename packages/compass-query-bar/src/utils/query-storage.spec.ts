import { expect } from 'chai';
import fs from 'fs';
import os from 'os';
import { join } from 'path';
import { EJSON, UUID } from 'bson';

import { RecentQueryStorage, type RecentQuery } from './query-storage';
import Sinon from 'sinon';

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

const writeQuery = (tmpDir: string, query: RecentQuery) => {
  const path = join(tmpDir, 'RecentQueries');
  fs.mkdirSync(path, { recursive: true });
  fs.writeFileSync(join(path, `${query._id}.json`), EJSON.stringify(query));
};

const createNumberOfQueries = (tmpDir: string, num: number) => {
  const queries = Array.from({ length: num }, (v, i) => ({
    _id: new UUID().toString(),
    _ns: 'airbnb.users',
    _lastExecuted: new Date(1690876213077 - (i + 1) * 1000), // Difference of 1 sec
  }));
  queries.forEach((query) => writeQuery(tmpDir, query));
  return queries;
};

const maxAllowedRecentQueries = 30;

describe('QueryStorage', function () {
  let tmpDir: string;
  let queryHistoryStorage: RecentQueryStorage;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(os.tmpdir());
    queryHistoryStorage = new RecentQueryStorage(tmpDir);
  });

  afterEach(function () {
    fs.rmdirSync(tmpDir, { recursive: true });
    Sinon.restore();
  });

  it('loads files from storage', async function () {
    queries.forEach((query) => writeQuery(tmpDir, query));

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
    queries.forEach((query) => writeQuery(tmpDir, query));

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
    queries.forEach((query) => writeQuery(tmpDir, query));

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
    queries.forEach((query) => writeQuery(tmpDir, query));

    await queryHistoryStorage.delete(queries[0]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(1);

    await queryHistoryStorage.delete(queries[1]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(0);
  });

  context(
    `limits saved recent queries to ${maxAllowedRecentQueries}`,
    function () {
      it('truncates recents queries to max allowed queries', async function () {
        const queries = createNumberOfQueries(tmpDir, maxAllowedRecentQueries);

        const deleteSpy = Sinon.spy(queryHistoryStorage, 'delete');

        // Save another query
        await queryHistoryStorage.saveQuery({
          _ns: 'airbnb.users',
          filter: {},
        });

        const numQueries = (await queryHistoryStorage.loadAll()).length;
        expect(numQueries).to.equal(maxAllowedRecentQueries);

        expect(deleteSpy.calledOnceWithExactly(queries[queries.length - 1]._id))
          .to.be.true;
      });

      it('does not remove recent query if recents are less then max allowed queries', async function () {
        createNumberOfQueries(tmpDir, 11);

        const deleteSpy = Sinon.spy(queryHistoryStorage, 'delete');

        // Save another query
        await queryHistoryStorage.saveQuery({
          _ns: 'airbnb.users',
          filter: {},
        });

        const numQueries = (await queryHistoryStorage.loadAll()).length;
        expect(numQueries).to.equal(12);

        expect(deleteSpy.called).to.be.false;
      });
    }
  );
});
