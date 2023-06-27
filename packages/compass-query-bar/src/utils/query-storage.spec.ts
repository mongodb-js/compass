import { expect } from 'chai';
import fs from 'fs';
import os from 'os';
import { join } from 'path';
import { EJSON, UUID } from 'bson';

import { QueryStorage } from './query-storage';

// Testing base class here
class QueryHistoryStorage extends QueryStorage {
  constructor(basepath: string) {
    super(basepath);
  }
}

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

describe('QueryStorage', function () {
  let basedir: string;
  let queryHistoryStorage: QueryHistoryStorage;

  before(function () {
    basedir = fs.mkdtempSync(os.tmpdir());
    const folder = join(basedir, 'Queries');
    fs.mkdirSync(folder);
    queries.forEach((query) => {
      fs.writeFileSync(
        join(folder, `${query._id}.json`),
        EJSON.stringify(query)
      );
    });

    queryHistoryStorage = new QueryHistoryStorage(folder);
  });

  after(function () {
    fs.rmdirSync(basedir, { recursive: true });
  });

  it('loads files from storage', async function () {
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
    await queryHistoryStorage.delete(queries[0]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(1);

    await queryHistoryStorage.delete(queries[1]._id);
    expect(await queryHistoryStorage.loadAll()).to.have.lengthOf(0);
  });
});
