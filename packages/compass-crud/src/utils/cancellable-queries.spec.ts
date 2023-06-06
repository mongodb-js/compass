import { expect } from 'chai';
import sinon from 'sinon';
import Connection from 'mongodb-connection-model';
import type { DataService } from 'mongodb-data-service';
import { connect, convertConnectionModelToInfo } from 'mongodb-data-service';

import {
  findDocuments,
  countDocuments,
  fetchShardingKeys,
} from './cancellable-queries';

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27022,
  ns: 'compass-crud',
  mongodb_database_name: 'admin',
});

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('cancellable-queries', function () {
  this.timeout(5000);

  let dataService: DataService;
  let abortController;
  let signal;
  let currentOpsByNS;

  before(async function () {
    const info = convertConnectionModelToInfo(CONNECTION);
    dataService = await connect({
      connectionOptions: info.connectionOptions,
    });

    currentOpsByNS = async function (ns) {
      const ops = await dataService.currentOp();
      return ops.inprog.filter((op) => op.ns === ns);
    };

    const docs = [...Array(1000).keys()].map((i) => ({ i }));

    try {
      await dataService.dropCollection('cancel.numbers');
    } catch (err) {
      // noop
    }
    await dataService.insertMany('cancel.numbers', docs, {});

    try {
      await dataService.dropCollection('cancel.empty');
    } catch (err) {
      // noop
    }
    await dataService.createCollection('cancel.empty', {});

    // define a shard key for the cancel.shared collection
    await dataService.deleteMany('config.collections', {
      _id: 'cancel.sharded',
    } as any);
    await dataService.insertOne(
      'config.collections',
      { _id: 'cancel.sharded', key: { a: 1 } },
      {}
    );
  });

  after(async function () {
    if (dataService) {
      try {
        await dataService.disconnect();
      } catch (err) {
        // ignore
      }
    }
  });

  beforeEach(function () {
    sinon.restore();

    abortController = new AbortController();
    signal = abortController.signal;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('findDocuments', function () {
    it('resolves to the documents', async function () {
      const docs = await findDocuments(
        dataService,
        'cancel.numbers',
        { i: { $gt: 5 } },
        {
          signal,
          // making sure arbitrary options make it through
          skip: 5,
          limit: 5,
          projection: { _id: 0 },
        }
      );
      expect(docs).to.deep.equal([
        { i: 11 },
        { i: 12 },
        { i: 13 },
        { i: 14 },
        { i: 15 },
      ]);
    });

    it('can be aborted', async function () {
      // make sure there are no operations in progress before we start
      let ops = await currentOpsByNS('cancel.numbers');
      expect(ops).to.be.empty;

      const filter = { $where: 'function() { return sleep(10000) || true; }' };
      const promise = findDocuments(dataService, 'cancel.numbers', filter, {
        signal,
      });

      // give it enough time to start
      await delay(100);
      ops = await currentOpsByNS('cancel.numbers');
      expect(ops).to.have.lengthOf(1);

      // abort the promise
      abortController.abort();
      const error = await promise.catch((err) => err);
      expect(dataService.isCancelError(error)).to.equal(true);

      // give it enough time to be killed
      await delay(100);
      ops = await currentOpsByNS('cancel.numbers');
      expect(ops).to.have.lengthOf(0);
    });
  });

  describe('countDocuments', function () {
    it('resolves to the count when a filter is supplied', async function () {
      const count = await countDocuments(
        dataService,
        'cancel.numbers',
        { i: { $gt: 5 } },
        {
          signal,
          // making sure skip and limit works
          skip: 5,
          limit: 5,
        }
      );
      expect(count).to.equal(5);
    });

    it('resolves to the count when no filter is supplied', async function () {
      const count = await countDocuments(dataService, 'cancel.numbers', null, {
        signal,
      });
      expect(count).to.equal(1000);
    });

    it('resolves to the count when a blank filter is supplied', async function () {
      const count = await countDocuments(
        dataService,
        'cancel.numbers',
        {},
        {
          signal,
        }
      );
      expect(count).to.equal(1000);
    });

    it('resolves to 0 for empty collections', async function () {
      const count = await countDocuments(
        dataService,
        'cancel.empty',
        {},
        {
          signal,
        }
      );
      expect(count).to.equal(0);
    });

    it('resolves to null if the query fails', async function () {
      const count = await countDocuments(
        dataService,
        'cancel.numbers',
        'this is not a filter',
        {
          signal,
          hint: { _id_: 1 }, // this collection doesn't have this index so this query should fail
        }
      );
      expect(count).to.equal(null);
    });

    it('can be aborted', async function () {
      const promise = countDocuments(
        dataService,
        'cancel.numbers',
        {},
        { signal }
      );

      // abort the promise
      abortController.abort();
      const error = await promise.catch((err) => err);
      expect(dataService.isCancelError(error)).to.equal(true);
    });
  });

  describe('fetchShardingKeys', function () {
    it('resolves to {} if there are no shard keys', async function () {
      const shardKeys = await fetchShardingKeys(dataService, 'cancel.numbers', {
        signal,
      });
      expect(shardKeys).to.deep.equal({});
    });

    it('resolves to the shard keys if there are any', async function () {
      const shardKeys = await fetchShardingKeys(dataService, 'cancel.sharded', {
        signal,
      });
      expect(shardKeys).to.deep.equal({ a: 1 });
    });

    it('can be aborted', async function () {
      const promise = fetchShardingKeys(dataService, 'cancel.sharded', {
        signal,
      });

      // abort the promise
      abortController.abort();
      const error = await promise.catch((err) => err);
      expect(dataService.isCancelError(error)).to.equal(true);
    });

    // TODO: if (configDocs && configDocs.length) { implies that configDocs could be empty?
  });
});
