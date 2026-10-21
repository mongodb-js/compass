import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  BSON,
  Binary,
  Decimal128,
  Double,
  EJSON,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
} from 'bson';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';
import Sinon from 'sinon';
import { recentQueries, favoriteQueries } from '../test/fixtures/index';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import {
  createElectronRecentQueryStorage,
  createElectronFavoriteQueryStorage,
  createWebRecentQueryStorage,
} from './storage-factories';

const queries = [
  {
    filter: '{}',
    _id: new UUID().toString(),
    _lastExecuted: new Date(),
    _ns: 'airbnb.listings',
  },
  {
    filter: '{ name: 1 }',
    project: '{ _id: 1 }',
    _id: new UUID().toString(),
    _lastExecuted: new Date(),
    _ns: 'airbnb.listings',
  },
];

const maxAllowedRecentQueries = 30;

function expectSameQuery(queryString: string | undefined, ejson: unknown) {
  expect(queryString).to.be.a('string');
  expect(
    BSON.serialize({ value: parse(queryString!, { mode: ParseMode.Loose }) })
  ).to.deep.equal(
    BSON.serialize({ value: EJSON.parse(JSON.stringify(ejson)) })
  );
}

describe('CompassRecentQueryStorage', function () {
  let queryHistoryStorage: ReturnType<typeof createElectronRecentQueryStorage>;

  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
    queryHistoryStorage = createElectronRecentQueryStorage({
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

  it('loads files from storage only for a specific namespace', async function () {
    const differentNSQuery = {
      _id: new UUID().toString(),
      _ns: 'x.y',
      _lastExecuted: new Date(1690876213077 - queries.length * 1000),
    };
    const mixedQueries = [...queries, differentNSQuery];
    await Promise.all(mixedQueries.map((query) => writeQuery(query)));

    const data = await queryHistoryStorage.loadAll(differentNSQuery._ns);
    expect(data).to.have.lengthOf(1);
    expect(data[0]).to.deep.equal(differentNSQuery);
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
      sort: '{ name: 1 }',
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
          filter: '{ a: 1 }',
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
          filter: '{ a: 1 }',
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
      const recentQueryStorage = createElectronRecentQueryStorage({
        basepath: tmpDir,
      });
      const [loadedQuery] = await recentQueryStorage.loadAll();
      expect(loadedQuery._id).to.equal(query._id);
      expect(Object.keys(loadedQuery).sort()).to.deep.equal(
        Object.keys(query).sort()
      );
      expectSameQuery(loadedQuery.filter, query.filter);

      expect(loadedQuery._lastExecuted).to.be.instanceOf(Date);
    });
  }

  for (const { query, version } of favoriteQueries) {
    it(`supports favorite query from Compass v${version}`, async function () {
      await writeQuery(query, 'FavoriteQueries');
      const favoriteQueryStorage = createElectronFavoriteQueryStorage({
        basepath: tmpDir,
      });
      const [loadedQuery] = await favoriteQueryStorage.loadAll();
      expect(loadedQuery._id).to.equal(query._id);
      expect(Object.keys(loadedQuery).sort()).to.deep.equal(
        Object.keys(query).sort()
      );
      expectSameQuery(loadedQuery.filter, query.filter);

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

describe('CompassFavoriteQueryStorage', function () {
  let queryFavoriteStorage: ReturnType<
    typeof createElectronFavoriteQueryStorage
  >;

  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
    queryFavoriteStorage = createElectronFavoriteQueryStorage({
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
      filter: '{ a: 1 }',
      update: '{ $set: { a: 2 } }',
    });

    const loaded = await queryFavoriteStorage.loadAll();
    expect(loaded.length).to.be.greaterThan(0);

    const [query] = loaded;
    expect(query._name).to.equal('my-query');
    expect(query._ns).to.equal('test.test');
    expect(query.filter).to.equal('{ a: 1 }');
    expect(query.update).to.equal('{ $set: { a: 2 } }');
  });

  it('should retrieve saved queries only for a specific namespace', async function () {
    const nsTestQuery = {
      _ns: 'test.test',
      _name: 'my-query',
      filter: '{ a: 1 }',
      update: '{ $set: { a: 2 } }',
    };
    const nsTest1Query = {
      _ns: 'test1.test1',
      _name: 'my-query-1',
      filter: '{ a: 1 }',
      update: '{ $set: { a: 2 } }',
    };
    await queryFavoriteStorage.saveQuery(nsTestQuery);
    await queryFavoriteStorage.saveQuery(nsTest1Query);

    const loaded = await queryFavoriteStorage.loadAll(nsTest1Query._ns);
    expect(loaded.length).to.equal(1);

    const [query] = loaded;
    expect(query._name).to.equal(nsTest1Query._name);
    expect(query._ns).to.equal(nsTest1Query._ns);
    expect(query.filter).to.deep.equal(nsTest1Query.filter);
    expect(query.update).to.deep.equal(nsTest1Query.update);
  });
});

describe('query strings', function () {
  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  const query = {
    filter: `{
  // comments and formatting are kept
  _id: ObjectId('507f1f77bcf86cd799439011'),
  count: NumberLong('9007199254740993'),
  int: NumberInt(5),
  double: Double(5),
  decimal: NumberDecimal('1.5'),
  date: ISODate('2020-01-01T00:00:00.000Z'),
  uuid: UUID('0b2c6e0a-4f2e-4a39-8e4b-7d2d6d1e1f10'),
  binary: BinData(0, 'AAEC'),
  ts: Timestamp({ t: 1, i: 2 }),
  name: /ber/i,
  nested: { a: { b: [1, { c: MinKey() }] } }
}`,
    project: '{ _id: 0, "a.b": 1 }',
    sort: "[['count', -1]]",
    collation: "{ locale: 'en', strength: 2 }",
    hint: "'count_1'",
    skip: 5,
    limit: 10,
  };

  it('round trips recent queries exactly', async function () {
    const storage = createElectronRecentQueryStorage({ basepath: tmpDir });
    await storage.saveQuery({ ...query, _ns: 'db.coll' });

    const [loaded] = await storage.loadAll();
    expect(loaded).to.deep.include(query);

    const [file] = await fs.readdir(path.join(tmpDir, 'RecentQueries'));
    const stored = JSON.parse(
      await fs.readFile(path.join(tmpDir, 'RecentQueries', file), 'utf8')
    );
    expect(stored).to.deep.include(query);
  });

  it('round trips favorite update queries exactly', async function () {
    const storage = createElectronFavoriteQueryStorage({ basepath: tmpDir });
    const updateQuery = {
      filter: "{ _id: ObjectId('507f1f77bcf86cd799439011') }",
      update: `[
  { $set: { count: NumberLong('9007199254740993') } }
]`,
    };
    await storage.saveQuery({ ...updateQuery, _ns: 'db.coll', _name: 'q' });

    const [loaded] = await storage.loadAll();
    expect(loaded).to.deep.include(updateQuery);
  });

  it('keeps hints that use comments', async function () {
    const storage = createElectronRecentQueryStorage({ basepath: tmpDir });
    const hint = '{ count: 1 } // the count index';
    await storage.saveQuery({ filter: '{ a: 1 }', hint, _ns: 'db.coll' });

    const [loaded] = await storage.loadAll();
    expect(loaded.hint).to.equal(hint);
  });

  it('rejects parsed query values', async function () {
    const storage = createElectronRecentQueryStorage({ basepath: tmpDir });
    let error: unknown;
    try {
      await storage.saveQuery({
        // @ts-expect-error parsed values are not accepted
        filter: { a: 1 },
        _ns: 'db.coll',
      });
    } catch (e) {
      error = e;
    }
    expect(error).to.exist;
    expect(await storage.loadAll()).to.have.lengthOf(0);
  });

  it('keeps query strings when attributes are updated', async function () {
    const storage = createElectronRecentQueryStorage({ basepath: tmpDir });
    await storage.saveQuery({ ...query, _ns: 'db.coll' });
    const [{ _id }] = await storage.loadAll();

    await storage.updateAttributes(_id, { _host: 'localhost' });
    await storage.updateAttributes(_id, { _host: 'localhost:27017' });

    const [loaded] = await storage.loadAll();
    expect(loaded).to.deep.include({ ...query, _host: 'localhost:27017' });
  });
});

describe('queries saved as parsed values by older versions of Compass', function () {
  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'query-storage-tests'));
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  // Older versions of Compass serialized queries with relaxed EJSON.
  async function writeLegacyQuery(attributes: Record<string, unknown>) {
    const _id = new UUID().toString();
    const content = EJSON.stringify(
      {
        ...attributes,
        _id,
        _ns: 'db.coll',
        _lastExecuted: new Date('2023-08-30T19:03:19.336Z'),
      },
      undefined,
      2
    );
    const basepath = path.join(tmpDir, 'RecentQueries');
    await fs.mkdir(basepath, { recursive: true });
    await fs.writeFile(path.join(basepath, `${_id}.json`), content);
    return { _id, content };
  }

  async function loadQuery() {
    const storage = createElectronRecentQueryStorage({ basepath: tmpDir });
    const [loaded] = await storage.loadAll();
    return { storage, loaded };
  }

  const legacyValues: { name: string; value: Record<string, unknown> }[] = [
    {
      name: 'ObjectId',
      value: { _id: new ObjectId('507f1f77bcf86cd799439011') },
    },
    { name: 'Long', value: { count: Long.fromNumber(42) } },
    {
      name: 'Int32 and Double',
      value: { a: new Int32(5), b: new Double(5.5) },
    },
    { name: 'Decimal128', value: { price: Decimal128.fromString('1.5') } },
    { name: 'Date', value: { date: new Date('2020-01-01T00:00:00.000Z') } },
    {
      name: 'UUID',
      value: { uuid: new UUID('0b2c6e0a-4f2e-4a39-8e4b-7d2d6d1e1f10') },
    },
    { name: 'Timestamp', value: { ts: new Timestamp({ t: 1, i: 2 }) } },
    { name: 'NaN and Infinity', value: { a: NaN, b: -Infinity } },
    { name: 'MinKey and MaxKey', value: { a: new MinKey(), b: new MaxKey() } },
    { name: 'Binary', value: { bin: Binary.createFromBase64('AAEC', 0) } },
    { name: 'regex', value: { name: /ber/i } },
    {
      name: 'nested objects and arrays',
      value: {
        $or: [
          { a: { $in: [1, 'two', null] } },
          { 'b.c': { $elemMatch: { d: { $gte: 3 } } } },
        ],
      },
    },
  ];

  for (const { name, value } of legacyValues) {
    it(`converts a legacy filter with ${name} to an equivalent query string`, async function () {
      const { content } = await writeLegacyQuery({ filter: value });
      const { loaded } = await loadQuery();
      expectSameQuery(loaded.filter, JSON.parse(content).filter);
    });
  }

  it('converts all legacy query attributes', async function () {
    await writeLegacyQuery({
      filter: { _id: new ObjectId('507f1f77bcf86cd799439011') },
      project: { _id: 0 },
      sort: [['a', -1]],
      collation: { locale: 'en' },
      hint: { a: 1 },
      update: [{ $set: { a: 1 } }],
      skip: 5,
      limit: 10,
    });
    const { loaded } = await loadQuery();
    expect(loaded).to.deep.include({
      filter: "{\n  _id: ObjectId('507f1f77bcf86cd799439011')\n}",
      project: '{\n  _id: 0\n}',
      sort: "[\n  [\n    'a',\n    -1\n  ]\n]",
      collation: "{\n  locale: 'en'\n}",
      hint: '{\n  a: 1\n}',
      update: '[\n  {\n    $set: {\n      a: 1\n    }\n  }\n]',
      skip: 5,
      limit: 10,
    });
  });

  it('quotes legacy index name hints', async function () {
    await writeLegacyQuery({ hint: 'a_1' });
    const { loaded } = await loadQuery();
    expect(loaded.hint).to.equal("'a_1'");
  });

  it('drops empty legacy attributes', async function () {
    await writeLegacyQuery({
      filter: {},
      project: null,
      sort: [],
      limit: 10,
    });
    const { loaded } = await loadQuery();
    expect(loaded.filter).to.be.undefined;
    expect(loaded.project).to.be.undefined;
    expect(loaded.sort).to.be.undefined;
    expect(loaded.limit).to.equal(10);
  });

  it('persists the converted query strings when attributes are updated', async function () {
    const { _id } = await writeLegacyQuery({
      filter: { _id: new ObjectId('507f1f77bcf86cd799439011') },
      hint: 'a_1',
    });
    const { storage, loaded } = await loadQuery();

    await storage.updateAttributes(_id, { _host: 'localhost' });

    const stored = JSON.parse(
      await fs.readFile(
        path.join(tmpDir, 'RecentQueries', `${_id}.json`),
        'utf8'
      )
    );
    expect(stored.filter).to.equal(loaded.filter);
    expect(stored.hint).to.equal("'a_1'");

    const { loaded: reloaded } = await loadQuery();
    expect(reloaded).to.deep.include({
      filter: loaded.filter,
      hint: "'a_1'",
      _host: 'localhost',
    });
  });
});

describe('web query storage', function () {
  let docs: Record<string, string>;
  let storage: ReturnType<typeof createWebRecentQueryStorage>;

  beforeEach(function () {
    docs = Object.create(null);
    const atlasService = {
      userDataEndpoint(
        _orgId: string,
        _projectId: string,
        _type: string,
        id?: string
      ) {
        return `/RecentQueries/${id ?? ''}`;
      },
      authenticatedFetch(url: string, init: { method: string; body?: string }) {
        const id = url.split('/').pop();
        if (init.method === 'PUT' && id) {
          docs[id] = JSON.parse(init.body ?? '{}').data;
        }
        const json = id
          ? { data: docs[id] }
          : Object.values(docs).map((data) => ({ data }));
        return Promise.resolve({ json: () => Promise.resolve(json) });
      },
    } as unknown as AtlasService;
    storage = createWebRecentQueryStorage({
      orgId: 'org',
      projectId: 'project',
      atlasService,
    });
  });

  it('round trips query strings', async function () {
    const filter =
      "{\n  // a comment\n  count: NumberLong('9007199254740993')\n}";
    await storage.saveQuery({ filter, limit: 10, _ns: 'db.coll' });

    const [loaded] = await storage.loadAll();
    expect(loaded).to.deep.include({ filter, limit: 10 });
  });

  it('converts and persists legacy queries', async function () {
    const _id = new UUID().toString();
    docs[_id] = EJSON.stringify({
      _id,
      _ns: 'db.coll',
      _lastExecuted: new Date(),
      filter: { _id: new ObjectId('507f1f77bcf86cd799439011') },
      hint: 'a_1',
    });

    const [loaded] = await storage.loadAll();
    expect(loaded).to.deep.include({
      filter: "{\n  _id: ObjectId('507f1f77bcf86cd799439011')\n}",
      hint: "'a_1'",
    });

    await storage.updateAttributes(_id, { _host: 'localhost' });
    expect(JSON.parse(docs[_id])).to.deep.include({
      filter: loaded.filter,
      hint: "'a_1'",
      _host: 'localhost',
    });
  });
});
