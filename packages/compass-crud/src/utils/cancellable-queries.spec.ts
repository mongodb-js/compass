import { expect } from 'chai';
import sinon from 'sinon';
import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

import { countDocuments, fetchShardingKeys } from './cancellable-queries';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('cancellable-queries', function () {
  this.timeout(5000);

  const cluster = mochaTestServer();
  let dataService: DataService;
  let abortController;
  let signal;

  before(async function () {
    dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
      },
    });

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
