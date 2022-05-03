import sinon from 'sinon';
import { loadFields, getSelectableFields } from './load-fields';
import { expect } from 'chai';

describe('loadFields', function () {
  const fakeDataService = (err, docs) => {
    return {
      find: sinon.spy((ns, query, options, cb) => {
        cb(err, docs);
      }),
    };
  };

  it('folds all the fields from a set of documents', async function () {
    const dataService = fakeDataService(null, [{ a: '1' }, { b: '2' }]);
    const fields = await loadFields(dataService, 'db1.coll1', {}, {});

    expect(fields).to.deep.equal({
      a: 1,
      b: 1,
    });
  });

  it('folds nested fields', async function () {
    const dataService = fakeDataService(null, [
      {
        a: { b: '2' },
      },
      {
        c: '3',
      },
    ]);
    const fields = await loadFields(dataService, 'db1.coll1', {}, {});

    expect(fields).to.deep.equal({
      'a.b': 1,
      c: 1,
    });
  });

  it('merges nested fields', async function () {
    const dataService = fakeDataService(null, [
      {
        a: { b: '2' },
      },
      {
        a: { c: '3' },
      },
    ]);
    const fields = await loadFields(dataService, 'db1.coll1', {}, {});

    expect(fields).to.deep.equal({
      'a.b': 1,
      'a.c': 1,
    });
  });

  it('does not truncate fields', async function () {
    const dataService = fakeDataService(null, [
      {
        a: { b: { c: { d: 'x' } } },
      },
    ]);

    const fields = await loadFields(dataService, 'db1.coll1', {}, {});

    expect(fields).to.deep.equal({
      'a.b.c.d': 1,
    });
  });

  it('works for docs with multiple fields', async function () {
    const dataService = fakeDataService(null, [
      {
        _id: '1',
        title: 'doc1',
        year: '2003',
      },
      {
        _id: '2',
        title: 'doc2',
        year: '2004',
      },
    ]);
    const fields = await loadFields(dataService, 'db1.coll1', {}, {});

    expect(fields).to.deep.equal({
      _id: 1,
      title: 1,
      year: 1,
    });
  });

  it('pass down arguments', async function () {
    const dataService = fakeDataService(null, []);
    await loadFields(
      dataService,
      'db1.coll1',
      {
        filter: { x: 1 },
        sampleSize: 10,
      },
      {
        maxTimeMs: 123,
      }
    );

    expect(dataService.find).to.have.been.calledOnceWith(
      'db1.coll1',
      {
        x: 1,
      },
      {
        limit: 10,
        maxTimeMs: 123,
      }
    );
  });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe('getSelectableFields', function () {
  it('truncates fields as specified by maxDepth', function () {
    const allFields = { 'a.b.c.d': 1 };

    const table = [
      [1, 'a'],
      [2, 'a.b'],
      [3, 'a.b.c'],
      [4, 'a.b.c.d'],
    ];

    for (const [maxDepth, expected] of table) {
      const fields = getSelectableFields(allFields, { maxDepth });

      expect(fields).to.deep.equal({
        [expected]: 1,
      });
    }
  });

  it('excludes driver/server-internal fields by default', function () {
    const allFields = { 'a': 1, '__safeContent__': 1, '__safeContent__.0': 1 };

    const fields = getSelectableFields(allFields, { maxDepth: 2 });

    expect(fields).to.deep.equal({
      'a': 1,
      '__safeContent__': 0,
      '__safeContent__.0': 0
    });
  });
});
