import { CommonErrors } from '@mongosh/errors';
import chai, { expect } from 'chai';
import { Collection, Db, MongoClient } from 'mongodb';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface, stubConstructor } from 'ts-sinon';
import CliServiceProvider, { connectMongoClient } from './cli-service-provider';
import { ConnectionString } from '@mongosh/service-provider-core';
import { EventEmitter } from 'events';

chai.use(sinonChai);


const DEFAULT_BASE_OPTS = { serializeFunctions: true };

/**
 * Create a client stub from the provided collection stub.
 *
 * @note: We basically only care about the method under test
 *   which is always mocked on a new collection stub each
 *   test run. We we can use the boilerplate creation of the
 *   db and client here.
 *
 * @param {Stub} collectionStub - The collection stub.
 *
 * @returns {Stub} The client stub to pass to the transport.
 */
const createClientStub = (collectionStub): StubbedInstance<MongoClient> => {
  const clientStub = stubInterface<MongoClient>();
  const dbStub = stubInterface<Db>();
  dbStub.collection.returns(collectionStub);
  clientStub.db.returns(dbStub);
  return clientStub;
};

describe('CliServiceProvider', () => {
  let serviceProvider: CliServiceProvider;
  let collectionStub: StubbedInstance<Collection>;

  describe('connectMongoClient', () => {
    class FakeMongoClient extends EventEmitter {
      connect() {}
      db() {}
      close() {}
    }

    it('connects once when no AutoEncryption set', async() => {
      const uri = 'localhost:27017';
      const mClient = stubConstructor(FakeMongoClient);
      const mClientType = sinon.stub().returns(mClient);
      mClient.connect.onFirstCall().resolves(mClient);
      const result = await connectMongoClient(uri, {}, mClientType as any);
      expect(mClientType.getCalls()).to.have.lengthOf(1);
      expect(mClientType.getCalls()[0].args).to.deep.equal([uri, {}]);
      expect(mClient.connect.getCalls()).to.have.lengthOf(1);
      expect(result).to.equal(mClient);
    });
    it('connects once when bypassAutoEncryption is true', async() => {
      const uri = 'localhost:27017';
      const opts = { autoEncryption: { bypassAutoEncryption: true } };
      const mClient = stubConstructor(FakeMongoClient);
      const mClientType = sinon.stub().returns(mClient);
      mClient.connect.onFirstCall().resolves(mClient);
      const result = await connectMongoClient(uri, opts, mClientType as any);
      expect(mClientType.getCalls()).to.have.lengthOf(1);
      expect(mClientType.getCalls()[0].args).to.deep.equal([uri, opts]);
      expect(mClient.connect.getCalls()).to.have.lengthOf(1);
      expect(result).to.equal(mClient);
    });
    it('connects twice when bypassAutoEncryption is false and enterprise via modules', async() => {
      const uri = 'localhost:27017';
      const opts = { autoEncryption: { bypassAutoEncryption: false } };
      const mClientFirst = stubConstructor(FakeMongoClient);
      const mClientSecond = stubConstructor(FakeMongoClient);
      const mClientType = sinon.stub();
      const commandSpy = sinon.spy();
      mClientFirst.db.returns({ admin: () => ({ command: (...args) => {
        commandSpy(...args);
        return { modules: [ 'enterprise' ] };
      } } as any) } as any);
      mClientType.onFirstCall().returns(mClientFirst);
      mClientType.onSecondCall().returns(mClientSecond);
      const result = await connectMongoClient(uri, opts, mClientType as any);
      const calls = mClientType.getCalls();
      expect(calls.length).to.equal(2);
      expect(calls[0].args).to.deep.equal([
        uri, {}
      ]);
      expect(commandSpy).to.have.been.calledOnceWithExactly({ buildInfo: 1 });
      expect(result).to.equal(mClientSecond);
    });
    it('errors when bypassAutoEncryption is falsy and not enterprise', async() => {
      const uri = 'localhost:27017';
      const opts = { autoEncryption: {} };
      const mClientFirst = stubConstructor(FakeMongoClient);
      const mClientSecond = stubConstructor(FakeMongoClient);
      const mClientType = sinon.stub();
      const commandSpy = sinon.spy();
      mClientFirst.db.returns({ admin: () => ({ command: (...args) => {
        commandSpy(...args);
        return { modules: [] };
      } } as any) } as any);
      mClientType.onFirstCall().returns(mClientFirst);
      mClientType.onSecondCall().returns(mClientSecond);
      try {
        await connectMongoClient(uri, opts, mClientType as any);
      } catch (e) {
        return expect(e.message.toLowerCase()).to.include('automatic encryption');
      }
      expect.fail('Failed to throw expected error');
    });
    it('errors when bypassAutoEncryption is falsy, missing modules', async() => {
      const uri = 'localhost:27017';
      const opts = { autoEncryption: {} };
      const mClientFirst = stubConstructor(FakeMongoClient);
      const mClientSecond = stubConstructor(FakeMongoClient);
      const mClientType = sinon.stub();
      const commandSpy = sinon.spy();
      mClientFirst.db.returns({ admin: () => ({ command: (...args) => {
        commandSpy(...args);
        return {};
      } } as any) } as any);
      mClientType.onFirstCall().returns(mClientFirst);
      mClientType.onSecondCall().returns(mClientSecond);
      try {
        await connectMongoClient(uri, opts, mClientType as any);
      } catch (e) {
        return expect(e.message.toLowerCase()).to.include('automatic encryption');
      }
      expect.fail('Failed to throw expected error');
    });

    it('fails fast if there is a fail-fast connection error', async() => {
      const err = Object.assign(new Error('ENOTFOUND'), { name: 'MongoNetworkError' });
      const uri = 'localhost:27017';
      const mClient = new FakeMongoClient();
      const mClientType = sinon.stub().returns(mClient);
      let rejectConnect;
      mClient.close = sinon.stub().callsFake(() => {
        rejectConnect(new Error('discarded error'));
      });
      mClient.connect = () => new Promise((resolve, reject) => {
        rejectConnect = reject;
        setImmediate(() => {
          mClient.emit('serverHeartbeatFailed', { failure: err });
        });
      });
      try {
        await connectMongoClient(uri, {}, mClientType as any);
      } catch (e) {
        expect((mClient.close as any).getCalls()).to.have.lengthOf(1);
        return expect(e).to.equal(err);
      }
      expect.fail('Failed to throw expected error');
    });
  });

  describe('#constructor', () => {
    const mongoClient: any = sinon.spy();
    serviceProvider = new CliServiceProvider(mongoClient);

    it('sets the mongo client on the instance', () => {
      expect((serviceProvider as any).mongoClient).to.equal(mongoClient);
    });
  });

  describe('#aggregate', () => {
    const pipeline = [{ $match: { name: 'Aphex Twin' } }];
    const aggResult = [{ name: 'Aphex Twin' }];

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.aggregate.resolves({ toArray: async() => aggResult });
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const cursor = await serviceProvider.aggregate('music', 'bands', pipeline);
      const result = await cursor.toArray();
      expect(result).to.deep.equal(aggResult);
      expect(collectionStub.aggregate).to.have.been.calledWith(pipeline);
    });
  });

  describe('#bulkWrite', () => {
    const requests = [{ insertOne: { name: 'Aphex Twin' } } as any];
    const commandResult = { result: { nInserted: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.bulkWrite.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.bulkWrite('music', 'bands', requests);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.bulkWrite).to.have.been.calledWith(requests);
    });
  });

  describe('#countDocuments', () => {
    const countResult = 10;

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.countDocuments.resolves(countResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.countDocuments('music', 'bands');
      expect(result).to.deep.equal(countResult);
      expect(collectionStub.countDocuments).to.have.been.calledWith({});
    });
  });

  describe('#deleteMany', () => {
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.deleteMany.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.deleteMany('music', 'bands', {});
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.deleteMany).to.have.been.calledWith({});
    });
  });

  describe('#deleteOne', () => {
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.deleteOne.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.deleteOne('music', 'bands', {});
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.deleteOne).to.have.been.calledWith({});
    });
  });

  describe('#distinct', () => {
    const distinctResult = [ 'Aphex Twin' ];

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.distinct.resolves(distinctResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.distinct('music', 'bands', 'name');
      expect(result).to.deep.equal(distinctResult);
      expect(collectionStub.distinct).to.have.been.calledWith('name', {}, DEFAULT_BASE_OPTS);
    });
  });

  describe('#estimatedDocumentCount', () => {
    const countResult = 10;

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.estimatedDocumentCount.resolves(countResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.estimatedDocumentCount('music', 'bands');
      expect(result).to.deep.equal(countResult);
      expect(collectionStub.estimatedDocumentCount).to.have.been.calledWith(DEFAULT_BASE_OPTS);
    });
  });

  describe('#find', () => {
    const filter = { name: 'Aphex Twin' };
    const findResult = [{ name: 'Aphex Twin' }];

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.find.resolves({ toArray: async() => findResult });
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const cursor = await serviceProvider.find('music', 'bands', filter);
      const result = await cursor.toArray();
      expect(result).to.deep.equal(findResult);
      expect(collectionStub.find).to.have.been.calledWith(filter);
    });
  });
  describe('#find with options', () => {
    const filter = { name: 'Aphex Twin' };
    const findResult = [{ name: 'Aphex Twin' }];
    const options = { allowPartialResults: true, noCursorTimeout: true, tailable: true };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.find.resolves({ toArray: async() => findResult });
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const cursor = await serviceProvider.find('music', 'bands', filter, options);
      const result = await cursor.toArray();
      expect(result).to.deep.equal(findResult);
      expect(collectionStub.find).to.have.been.calledWith(filter, { ...DEFAULT_BASE_OPTS, ...options, partial: true, timeout: true });
    });
  });

  describe('#findOneAndDelete', () => {
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.findOneAndDelete.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.findOneAndDelete('music', 'bands', {});
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.findOneAndDelete).to.have.been.calledWith({});
    });
  });

  describe('#findOneAndReplace', () => {
    const commandResult = { result: { n: 1, ok: 1 } };
    const filter = { name: 'Aphex Twin' };
    const replacement = { name: 'Richard James' };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.findOneAndReplace.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.
        findOneAndReplace('music', 'bands', filter, replacement);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.findOneAndReplace).to.have.been.calledWith(filter, replacement);
    });
  });

  describe('#findOneAndUpdate', () => {
    const commandResult = { result: { n: 1, ok: 1 } };
    const filter = { name: 'Aphex Twin' };
    const update = { $set: { name: 'Richard James' } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.findOneAndUpdate.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.
        findOneAndUpdate('music', 'bands', filter, update);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.findOneAndUpdate).to.have.been.calledWith(filter, update);
    });
  });

  describe('#insertMany', () => {
    const doc = { name: 'Aphex Twin' };
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.insertMany.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.insertMany('music', 'bands', [ doc ]);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.insertMany).to.have.been.calledWith([doc]);
    });
  });

  describe('#insertOne', () => {
    const doc = { name: 'Aphex Twin' };
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.insertOne.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.insertOne('music', 'bands', doc);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.insertOne).to.have.been.calledWith(doc);
    });
  });

  describe('#replaceOne', () => {
    const filter = { name: 'Aphex Twin' };
    const replacement = { name: 'Richard James' };
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.replaceOne.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.replaceOne('music', 'bands', filter, replacement);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.replaceOne).to.have.been.calledWith(filter, replacement);
    });
  });

  describe('#runCommand', () => {
    let clientStub: any;
    let dbStub: any;
    const commandResult = { ismaster: true };

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      dbStub.command.resolves(commandResult);
      clientStub.db.returns(dbStub);
      serviceProvider = new CliServiceProvider(clientStub);
    });

    afterEach(() => {
      dbStub = null;
      clientStub = null;
      serviceProvider = null;
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.runCommand('admin', { ismaster: 1 });
      expect(result).to.deep.equal(commandResult);
      expect(dbStub.command).to.have.been.calledWith({ ismaster: 1 });
    });
  });

  describe('#runCommandWithCheck', () => {
    let clientStub: any;
    let dbStub: any;
    const commandResult = { ok: 0 };

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      dbStub.command.resolves(commandResult);
      clientStub.db.returns(dbStub);
      serviceProvider = new CliServiceProvider(clientStub);
    });

    afterEach(() => {
      dbStub = null;
      clientStub = null;
      serviceProvider = null;
    });

    it('executes the command against the database and throws if ok: 0', async() => {
      try {
        await serviceProvider.runCommandWithCheck('admin', { ismaster: 1 });
      } catch (e) {
        expect(e.message).to.include(JSON.stringify({ ismaster: 1 }));
        expect(e.name).to.equal('MongoshCommandFailed');
        expect(e.code).to.equal(CommonErrors.CommandFailed);
        return;
      }
      expect.fail('Error not thrown');
    });
  });

  describe('#updateOne', () => {
    const filter = { name: 'Aphex Twin' };
    const update = { $set: { name: 'Richard James' } };
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.updateOne.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.updateOne('music', 'bands', filter, update);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.updateOne).to.have.been.calledWith(filter, update);
    });
  });

  describe('#updateMany', () => {
    const filter = { name: 'Aphex Twin' };
    const update = { $set: { name: 'Richard James' } };
    const commandResult = { result: { n: 1, ok: 1 } };

    beforeEach(() => {
      collectionStub = stubInterface<Collection>();
      collectionStub.updateMany.resolves(commandResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.updateMany('music', 'bands', filter, update);
      expect(result).to.deep.equal(commandResult);
      expect(collectionStub.updateMany).to.have.been.calledWith(filter, update);
    });
  });

  describe('#dropDatabase', () => {
    let clientStub: StubbedInstance<MongoClient>;
    let dbStub: StubbedInstance<Db>;

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      clientStub.db.returns(dbStub);

      serviceProvider = new CliServiceProvider(clientStub);
    });

    it('returns ok: 1 if dropped', async() => {
      dbStub.dropDatabase.resolves(true);
      const result = await serviceProvider.dropDatabase('db1');
      expect(result).to.contain({ ok: 1 });
    });

    it('returns ok: 0 if not dropped', async() => {
      dbStub.dropDatabase.resolves(false);
      const result = await serviceProvider.dropDatabase('db1');
      expect(result).to.contain({ ok: 0 });
    });

    it('returns dropped: "db name" if dropped', async() => {
      dbStub.dropDatabase.resolves(true);
      const result = await serviceProvider.dropDatabase('db1');
      expect(result).to.contain({ dropped: 'db1' });
    });

    context('when write concern is omitted', () => {
      it('runs against the database with default write concern', async() => {
        dbStub.dropDatabase.resolves(true);
        await serviceProvider.dropDatabase('db1');
        expect(clientStub.db).to.have.been.calledOnceWith('db1');
      });
    });

    context('with write concern', () => {
      it('runs against the database passing write concern', async() => {
        const opts = { serializeFunctions: true, w: 1 };
        dbStub.dropDatabase.resolves(true);
        await serviceProvider.dropDatabase('db1', opts);
        expect(clientStub.db).to.have.been.calledOnceWith('db1');
      });
    });
  });

  describe('#createIndexes', () => {
    let indexSpecs;
    let nativeMethodResult;

    beforeEach(() => {
      indexSpecs = [
        { key: 'x' }
      ];

      nativeMethodResult = {
        createdCollectionAutomatically: false,
        numIndexesBefore: 2,
        numIndexesAfter: 3,
        ok: 1
      };

      collectionStub = stubInterface<Collection>();
      collectionStub.createIndexes.resolves(nativeMethodResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.createIndexes(
        'db1',
        'coll1',
        indexSpecs);
      expect(result).to.deep.equal(nativeMethodResult);
      expect(collectionStub.createIndexes).to.have.been.calledWith(indexSpecs);
    });
  });

  describe('#getIndexes', () => {
    let indexSpecs;
    let nativeMethodResult;

    beforeEach(() => {
      indexSpecs = [
        { key: 'x' }
      ];

      nativeMethodResult = {
        toArray: (): Promise<any[]> => Promise.resolve(indexSpecs)
      };

      collectionStub = stubInterface<Collection>();
      collectionStub.listIndexes.returns(nativeMethodResult);

      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.getIndexes(
        'db1',
        'coll1'
      );

      expect(result).to.deep.equal(indexSpecs);
      expect(collectionStub.listIndexes).to.have.been.calledWith(DEFAULT_BASE_OPTS);
    });
  });

  describe('#listCollections', () => {
    let dbStub: StubbedInstance<Db>;
    let clientStub: StubbedInstance<MongoClient>;

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      dbStub.listCollections.returns({
        toArray: () => {
          return Promise.resolve([
            {
              name: 'coll1'
            }
          ]);
        }
      } as any);
      clientStub.db.returns(dbStub);
      serviceProvider = new CliServiceProvider(clientStub);
    });

    it('executes the command', async() => {
      const result = await serviceProvider.listCollections('db1');
      expect(result).to.deep.equal([
        {
          name: 'coll1'
        }
      ]);

      expect(dbStub.listCollections).to.have.been.calledWith({}, DEFAULT_BASE_OPTS);
      expect(clientStub.db).to.have.been.calledWith('db1');
    });
  });

  describe('#stats', () => {
    let options;
    let expectedResult;

    beforeEach(() => {
      options = { ...DEFAULT_BASE_OPTS, scale: 1 };
      expectedResult = { ok: 1 };

      collectionStub = stubInterface<Collection>();
      collectionStub.stats.resolves(expectedResult);
      serviceProvider = new CliServiceProvider(createClientStub(collectionStub));
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.stats('db1', 'coll1', options);
      expect(result).to.deep.equal(expectedResult);
      expect(collectionStub.stats).to.have.been.calledWith(options);
    });
  });

  describe('#renameCollection', () => {
    let dbStub: StubbedInstance<Db>;
    let clientStub: StubbedInstance<MongoClient>;

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      dbStub.renameCollection.resolves({ ok: 1 });
      clientStub.db.returns(dbStub);
      serviceProvider = new CliServiceProvider(clientStub);
    });

    it('executes the command against the database', async() => {
      const result = await serviceProvider.renameCollection(
        'db1',
        'coll1',
        'newName',
        { dropTarget: true, session: {} as any }
      );
      expect(result).to.deep.equal({ ok: 1 });
      expect(dbStub.renameCollection).to.have.been.calledOnceWith('coll1',
        'newName',
        {
          ...DEFAULT_BASE_OPTS,
          dropTarget: true,
          session: {}
        });
      expect(clientStub.db).to.have.been.calledOnceWith('db1');
    });
  });

  describe('#createCollection', () => {
    let dbStub: StubbedInstance<Db>;
    let clientStub: StubbedInstance<MongoClient>;

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      dbStub.createCollection.resolves({
        toArray: () => {
          return Promise.resolve([
            { collectionType: 1 }
          ]);
        }
      });
      clientStub.db.returns(dbStub);
      serviceProvider = new CliServiceProvider(clientStub);
    });

    it('executes the command', async() => {
      const result = await serviceProvider.createCollection('db1', 'newcoll', {});
      expect(result).to.deep.equal({ ok: 1 });
      expect(dbStub.createCollection).to.have.been.calledOnceWith('newcoll', DEFAULT_BASE_OPTS);
      expect(clientStub.db).to.have.been.calledOnceWith('db1');
    });
  });

  describe('sessions', () => {
    let clientStub: StubbedInstance<MongoClient>;
    let serviceProvider: CliServiceProvider;
    let db: StubbedInstance<Db>;
    let driverSession;
    beforeEach(() => {
      clientStub = stubInterface<MongoClient>();
      serviceProvider = new CliServiceProvider(clientStub);
      driverSession = { dSession: 1 };
      clientStub.startSession.returns(driverSession);
      db = stubInterface<Db>();
      clientStub.db.returns(db);
    });
    describe('startSession', () => {
      it('calls startSession without args', () => {
        const opts = {};
        const result = serviceProvider.startSession(opts);
        expect(clientStub.startSession).to.have.been.calledOnceWith( opts);
        expect(result).to.equal(driverSession);
      });
    });
  });

  describe('#watch', () => {
    let options;
    let expectedResult;
    let watchMock;
    let watchMock2;
    let watchMock3;
    let pipeline;

    beforeEach(() => {
      pipeline = [{ $match: { operationType: 'insertOne' } }];
      options = { batchSize: 1 };
      expectedResult = { ChangeStream: 1 };

      watchMock = sinon.mock().once().withArgs(pipeline, options).returns(expectedResult);
      watchMock2 = sinon.mock().once().withArgs(pipeline, options).returns(expectedResult);
      watchMock3 = sinon.mock().once().withArgs(pipeline, options).returns(expectedResult);

      const collectionStub = sinon.createStubInstance(Collection, {
        watch: watchMock3
      });
      const dbStub = sinon.createStubInstance(Db, {
        watch: watchMock2,
        collection: sinon.stub().returns(collectionStub) as any
      });
      const clientStub = sinon.createStubInstance(MongoClient, {
        db: sinon.stub().returns(dbStub) as any,
        watch: watchMock
      }) as any;

      serviceProvider = new CliServiceProvider(clientStub);
    });

    it('executes watch on MongoClient', () => {
      const result = serviceProvider.watch(pipeline, options);
      expect(result).to.deep.equal(expectedResult);
      (watchMock as any).verify();
    });
    it('executes watch on Db', () => {
      const result = serviceProvider.watch(pipeline, options, {}, 'dbname');
      expect(result).to.deep.equal(expectedResult);
      (watchMock2 as any).verify();
    });
    it('executes watch on collection', () => {
      const result = serviceProvider.watch(pipeline, options, {}, 'dbname', 'collname');
      expect(result).to.deep.equal(expectedResult);
      (watchMock3 as any).verify();
    });
  });

  describe('#getConnectionInfo', () => {
    let clientStub: any;
    let dbStub: any;
    let firstCall;

    beforeEach(() => {
      dbStub = stubInterface<Db>();
      clientStub = stubInterface<MongoClient>();
      firstCall = true;
      dbStub.command.callsFake(() => {
        if (firstCall) {
          firstCall = false;
          throw new Error('some command not supported for auto encryption');
        }
        return { ok: 1 };
      });
      clientStub.db.returns(dbStub);
      clientStub.topology = { s: {} };
      serviceProvider = new CliServiceProvider(clientStub, {}, new ConnectionString('mongodb://localhost/'));
      serviceProvider.getNewConnection = async() => serviceProvider;
    });

    afterEach(() => {
      dbStub = null;
      clientStub = null;
      serviceProvider = null;
    });

    it('returns some connection info data', async() => {
      const info = await serviceProvider.getConnectionInfo();
      expect(info.extraInfo.is_atlas).to.equal(false);
      expect(info.extraInfo.is_localhost).to.equal(true);
      expect(dbStub.command).to.have.callCount(4);
    });
  });
});
