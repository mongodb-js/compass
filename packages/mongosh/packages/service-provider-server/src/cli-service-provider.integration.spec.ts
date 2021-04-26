import CliServiceProvider from './cli-service-provider';
import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { startTestServer, skipIfServerVersion } from '../../../testing/integration-testing-hooks';
import { DbOptions, MongoClientOptions, ConnectionString } from '@mongosh/service-provider-core';

describe('CliServiceProvider [integration]', function() {
  const testServer = startTestServer('shared');

  let serviceProvider: CliServiceProvider;
  let client: MongoClient;
  let dbName: string;
  let db;
  let connectionString: string;

  beforeEach(async() => {
    connectionString = await testServer.connectionString();
    client = await MongoClient.connect(
      connectionString,
      {} as MongoClientOptions
    );

    dbName = `test-db-${Date.now()}`;
    db = client.db(dbName);
    serviceProvider = new CliServiceProvider(client, {}, new ConnectionString(connectionString));
  });

  afterEach(() => {
    serviceProvider.close(true);
  });

  describe('.connect', () => {
    let instance: CliServiceProvider;
    beforeEach(async() => {
      instance = await CliServiceProvider.connect(connectionString);
    });

    afterEach(() => {
      instance.close(true);
    });

    it('returns a CliServiceProvider', async() => {
      expect(instance).to.be.instanceOf(CliServiceProvider);
    });
  });

  describe('.getNewConnection', () => {
    let instance: CliServiceProvider;

    beforeEach(async() => {
      instance = await serviceProvider.getNewConnection(connectionString);
    });

    afterEach(() => {
      instance.close(true);
    });

    it('returns a CliServiceProvider', async() => {
      expect(instance).to.be.instanceOf(CliServiceProvider);
    });

    it('differs from the original CliServiceProvider', () => {
      expect(instance).to.not.equal(serviceProvider);
    });
  });

  describe('.authenticate', () => {
    beforeEach(async() => {
      await serviceProvider.runCommandWithCheck('admin', {
        createUser: 'xyz', pwd: 'asdf', roles: []
      });
    });

    afterEach(async() => {
      await serviceProvider.runCommandWithCheck('admin', {
        dropUser: 'xyz'
      });
    });

    it('resets the MongoClient', async() => {
      const mongoClientBefore = serviceProvider.mongoClient;
      await serviceProvider.authenticate({ user: 'xyz', pwd: 'asdf', authDb: 'admin' });
      expect(serviceProvider.mongoClient).to.not.equal(mongoClientBefore);
    });
  });

  describe('.resetConnectionOptions', () => {
    it('resets the MongoClient', async() => {
      const mongoClientBefore = serviceProvider.mongoClient;
      await serviceProvider.resetConnectionOptions({
        readPreference: 'secondaryPreferred'
      });
      expect(serviceProvider.mongoClient).to.not.equal(mongoClientBefore);
      expect(serviceProvider.getReadPreference().mode).to.equal('secondaryPreferred');
    });
  });

  describe('.getConnectionInfo', () => {
    context('when a uri has been passed', () => {
      it('returns the connection\'s info', async() => {
        const instance = new CliServiceProvider(client, {}, new ConnectionString(connectionString));
        const connectionInfo = await instance.getConnectionInfo();

        expect(Object.keys(connectionInfo)).to.deep.equal([
          'buildInfo',
          'topology',
          'extraInfo'
        ]);
        expect(connectionInfo.buildInfo.version.length > 1);
      });
    });

    context('when the optional uri has not been passed', () => {
      it('returns the connection\'s info', async() => {
        const instance = new CliServiceProvider(client);
        const connectionInfo = await instance.getConnectionInfo();

        expect(Object.keys(connectionInfo)).to.deep.equal([
          'buildInfo',
          'topology',
          'extraInfo'
        ]);
        expect(connectionInfo.buildInfo.version.length > 1);
      });
    });
  });

  describe('#aggregate', () => {
    context('when passing a $function to be serialized by the driver', function() {
      skipIfServerVersion(testServer, '< 4.4');

      let result;

      beforeEach(async() => {
        const pipeline = [
          {
            '$addFields': {
              'attr.namespace': {
                '$function': {
                  'body': function(value): any { if (value) { return value; } },
                  'args': [ '$attr.namespace' ],
                  'lang': 'js'
                }
              }
            }
          }
        ];
        result = await serviceProvider.aggregate('music', 'bands', pipeline);
      });

      it('executes the command and resolves the result', async() => {
        const docs = await result.toArray();
        expect(docs).to.deep.equal([]);
      });
    });

    context('when running against a collection', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.
          aggregate('music', 'bands', [{ $match: { name: 'Aphex Twin' } }]);
      });

      it('executes the command and resolves the result', async() => {
        const docs = await result.toArray();
        expect(docs).to.deep.equal([]);
      });
    });

    context('when running against a database', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.aggregateDb('admin', [{ $currentOp: {} }]);
      });

      it('executes the command and resolves the result', async() => {
        const docs = await result.toArray();
        expect(docs[0].active).to.equal(true);
      });
    });
  });

  describe('#bulkWrite', () => {
    context('when the filter is empty', () => {
      let result;
      const requests = [{
        insertOne: { name: 'Aphex Twin' }
      } as any];

      beforeEach(async() => {
        result = await serviceProvider.bulkWrite('music', 'bands', requests);
      });

      afterEach(() => {
        return serviceProvider.deleteMany('music', 'bands', {});
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.result.nInserted).to.equal(1);
      });
    });
  });

  describe('#count', () => {
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.count('music', 'bands');
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result).to.equal(0);
      });
    });
  });

  describe('#countDocuments', () => {
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.countDocuments('music', 'bands');
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result).to.equal(0);
      });
    });
  });

  describe('#deleteMany', () => {
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.deleteMany('music', 'bands', {});
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.deletedCount).to.equal(0);
      });
    });
  });

  describe('#deleteOne', () => {
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.deleteOne('music', 'bands', {});
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.deletedCount).to.equal(0);
      });
    });
  });

  describe('#distinct', () => {
    context('when the distinct is valid', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.distinct('music', 'bands', 'name');
      });

      it('executes the command and resolves the result', () => {
        expect(result).to.deep.equal([]);
      });
    });
  });

  describe('#estimatedDocumentCount', () => {
    context('when no options are provided', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.estimatedDocumentCount('music', 'bands');
      });

      it('executes the count and resolves the result', () => {
        expect(result).to.equal(0);
      });
    });
  });

  describe('#find', () => {
    context('when the find is valid', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.find('music', 'bands', { name: 'Aphex Twin' });
      });

      it('executes the command and resolves the result', async() => {
        const docs = await result.toArray();
        expect(docs).to.deep.equal([]);
      });
    });
  });

  describe('#findOneAndDelete', () => {
    context('when the find is valid', () => {
      let result;
      const filter = { name: 'Aphex Twin' };

      beforeEach(async() => {
        result = await serviceProvider.findOneAndDelete('music', 'bands', filter);
      });

      it('executes the command and resolves the result', () => {
        expect(result.ok).to.equal(1);
      });
    });
  });

  describe('#findOneAndReplace', () => {
    context('when the find is valid', () => {
      let result;
      const filter = { name: 'Aphex Twin' };
      const replacement = { name: 'Richard James' };

      beforeEach(async() => {
        result = await serviceProvider.
          findOneAndReplace('music', 'bands', filter, replacement);
      });

      it('executes the command and resolves the result', () => {
        expect(result.ok).to.equal(1);
      });
    });
  });

  describe('#findOneAndUpdate', () => {
    context('when the find is valid', () => {
      let result;
      const filter = { name: 'Aphex Twin' };
      const update = { $set: { name: 'Richard James' } };

      beforeEach(async() => {
        result = await serviceProvider.
          findOneAndUpdate('music', 'bands', filter, update);
      });

      it('executes the command and resolves the result', () => {
        expect(result.ok).to.equal(1);
      });
    });
  });

  describe('#insertMany', () => {
    context('when the insert is valid', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.insertMany('music', 'bands', [{ name: 'Aphex Twin' }]);
      });

      afterEach(() => {
        return serviceProvider.deleteMany('music', 'bands', {});
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
      });
    });
  });

  describe('#insertOne', () => {
    context('when the insert is valid', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.insertOne('music', 'bands', { name: 'Aphex Twin' });
      });

      afterEach(() => {
        return serviceProvider.deleteMany('music', 'bands', {});
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
      });
    });
  });

  describe('#isCapped', () => {
    context('for regular collections', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.isCapped('music', 'bands');
      });

      it('returns false', () => {
        expect(result).to.equal(false);
      });
    });
  });

  describe('#listDatabases', () => {
    let result;

    beforeEach(async() => {
      result = await serviceProvider.listDatabases('admin');
    });

    it('returns a list of databases', () => {
      expect(result.ok).to.equal(1);
      expect(result.databases.map(db => db.name)).to.include('admin');
    });
  });

  describe('#remove', () => {
    const filter = { name: 'Aphex Twin' };

    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.remove('music', 'bands', filter);
      });

      it('executes the remove op with and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
        expect(result.deletedCount).to.equal(0);
      });
    });
  });

  describe('#replaceOne', () => {
    const filter = { name: 'Aphex Twin' };
    const replacement = { name: 'Richard James' };

    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.
          replaceOne('music', 'bands', filter, replacement);
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
      });
    });
  });

  describe('#runCommand', () => {
    context('when the command is valid', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.runCommand('admin', { ismaster: true });
      });

      it('executes the command and resolves the result', () => {
        expect(result.ismaster).to.equal(true);
      });
    });
  });

  describe('#updateMany', () => {
    const filter = { name: 'Aphex Twin' };
    const update = { $set: { name: 'Richard James' } };
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.
          updateMany('music', 'bands', filter, update);
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
      });
    });
  });

  describe('#updateOne', () => {
    const filter = { name: 'Aphex Twin' };
    const update = { $set: { name: 'Richard James' } };
    context('when the filter is empty', () => {
      let result;

      beforeEach(async() => {
        result = await serviceProvider.
          updateOne('music', 'bands', filter, update);
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result.acknowledged).to.equal(true);
      });
    });
  });

  describe('#dropCollection', () => {
    context('when a collection existed', () => {
      it('returns  {ok: 1}', async() => {
        await serviceProvider.createCollection('test', 'collectionexists');
        const result = await serviceProvider.dropCollection('test', 'collectionexists');
        expect(result).to.equal(true);
      });
    });
  });

  describe('#dropDatabase', () => {
    context('when a database does not exist', () => {
      let result;

      it('returns  {ok: 1}', async() => {
        result = await serviceProvider.dropDatabase(`test-db-${Date.now()}`);
        expect(result.ok).to.equal(1);
      });
    });

    context('when a database exists', () => {
      let result;

      const dbExists = async(): Promise<boolean> => {
        return (await db.admin().listDatabases())
          .databases
          .map((database) => database.name)
          .includes(dbName);
      };

      beforeEach(async() => {
        await db.collection('coll1').insertOne({ doc: 1 });
        expect(await dbExists()).to.be.true;
        result = await serviceProvider.dropDatabase(dbName);
      });

      it('returns {ok: 1}', async() => {
        expect(result.ok).to.equal(1);
      });

      it('deletes the database', async() => {
        expect(await dbExists()).to.be.false;
      });
    });
  });

  describe('#createIndexes', () => {
    it('creates a new index', async() => {
      const collName = 'coll1';
      const nativeCollection = db.collection(collName);

      await db.createCollection(collName);

      expect(
        await nativeCollection.indexExists('index-1')
      ).to.be.false;

      await serviceProvider.createIndexes(
        dbName,
        collName,
        [{
          name: 'index-1',
          key: { x: 1 }
        }]
      );

      expect(
        await nativeCollection.indexExists('index-1')
      ).to.be.true;
    });
  });

  describe('#getIndexes', () => {
    it('returns indexes', async() => {
      const collName = 'coll1';
      const nativeCollection = db.collection(collName);

      await nativeCollection.createIndex('x');

      const result = await serviceProvider.getIndexes(
        dbName,
        collName
      );

      expect(
        result.map((spec) => spec.key)
      ).to.deep.equal([{ _id: 1 }, { x: 1 }]);
    });
  });

  describe('stats', () => {
    it('returns collection stats', async() => {
      const collName = 'coll1';
      await db.createCollection(collName);

      const stats = await serviceProvider.stats(
        dbName,
        collName
      );

      expect(Object.keys(stats)).to.contain.members([
        'ns',
        'size',
        'count',
        'storageSize',
        'capped',
        'wiredTiger',
        'nindexes',
        'indexDetails',
        'totalIndexSize',
        'indexSizes',
        'ok'
      ]);
    });
  });

  describe('#listCollections', () => {
    it('returns the list of collections', async() => {
      await db.createCollection('coll1');

      expect(
        (await serviceProvider.listCollections(dbName)).map((c: any) => c.name)
      ).to.deep.equal(['coll1']);
    });

    it('filter the list of collections', async() => {
      await db.createCollection('coll1');
      await db.createCollection('coll2');

      expect(
        (await serviceProvider.listCollections(dbName, { name: 'coll2' })).map((c: any) => c.name)
      ).to.deep.equal(['coll2']);
    });

    it('allows options', async() => {
      await db.createCollection('coll1');
      await db.createCollection('coll2');

      const collections = await serviceProvider.listCollections(dbName, {}, { nameOnly: true });

      expect(
        collections
      ).to.deep.contain({
        name: 'coll1',
        type: 'collection'
      });

      expect(
        collections
      ).to.deep.contain({
        name: 'coll2',
        type: 'collection'
      });
    });
  });

  describe('db fetching', () => {
    it('returns the same db instance when used with the same name and options', () => {
      const db1 = serviceProvider._dbTestWrapper('foo', { readPreference: { mode: 'secondary' } } as DbOptions);
      const db2 = serviceProvider._dbTestWrapper('foo', { readPreference: { mode: 'secondary' } } as DbOptions);
      expect(db1).to.equal(db2);
    });

    it('returns the different db instances when used with different names', () => {
      const db1 = serviceProvider._dbTestWrapper('bar', { readPreference: { mode: 'secondary' } } as DbOptions);
      const db2 = serviceProvider._dbTestWrapper('foo', { readPreference: { mode: 'secondary' } } as DbOptions);
      expect(db1).not.to.equal(db2);
    });

    it('returns the different db instances when used with different options', () => {
      const db1 = serviceProvider._dbTestWrapper('foo', { readPreference: { mode: 'primary' } } as DbOptions);
      const db2 = serviceProvider._dbTestWrapper('foo', { readPreference: { mode: 'secondary' } } as DbOptions);
      expect(db1).not.to.equal(db2);
    });
  });

  describe('#driverMetadata', () => {
    it('returns information about the driver instance', () => {
      expect(serviceProvider.driverMetadata.driver.name).to.equal('nodejs');
    });
  });

  describe('#getURI', () => {
    it('returns the current URI', () => {
      expect(serviceProvider.getURI()).to.equal(connectionString + '/');
    });
  });
});
