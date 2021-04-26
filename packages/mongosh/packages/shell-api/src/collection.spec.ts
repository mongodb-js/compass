import { expect, use } from 'chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { EventEmitter } from 'events';
import { signatures, toShellResult } from './index';
import { ALL_SERVER_VERSIONS, ALL_TOPOLOGIES, ALL_PLATFORMS, shellApiType, ADMIN_DB } from './enums';
import Database from './database';
import Mongo from './mongo';
import Collection from './collection';
import AggregationCursor from './aggregation-cursor';
import ChangeStreamCursor from './change-stream-cursor';
import Explainable from './explainable';
import {
  FindCursor as ServiceProviderCursor,
  AggregationCursor as ServiceProviderAggregationCursor,
  ServiceProvider,
  bson,
  ClientSession as ServiceProviderSession
} from '@mongosh/service-provider-core';
import { ObjectId } from 'mongodb';
import ShellInternalState from './shell-internal-state';
import { ShellApiErrors } from './error-codes';
import { CommonErrors, MongoshInvalidInputError, MongoshRuntimeError } from '@mongosh/errors';

const sinonChai = require('sinon-chai'); // weird with import

use(sinonChai);
describe('Collection', () => {
  describe('help', () => {
    const apiClass = new Collection({} as any, {} as any, 'name');
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.Collection.type).to.equal('Collection');
    });
    it('attributes', () => {
      expect(signatures.Collection.attributes.aggregate).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: 'AggregationCursor',
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.Collection.hasAsyncChild).to.equal(true);
    });
  });
  describe('metadata', () => {
    describe('toShellResult', () => {
      const mongo = sinon.spy();
      const db = new Database(mongo as any, 'myDB');
      const coll = new Collection(mongo as any, db, 'myCollection');
      it('toShellResult', async() => {
        expect((await toShellResult(coll)).type).to.equal('Collection');
        expect((await toShellResult(coll)).printable).to.equal('myCollection');
      });
    });
  });
  describe('.collections', () => {
    it('allows to get a collection as property if is not one of the existing methods', () => {
      const database = new Database({ _internalState: { emitApiCall: (): void => {} } } as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll.someCollection).to.have.instanceOf(Collection);
      expect(coll.someCollection._name).to.equal('coll.someCollection');
    });

    it('reuses collections', () => {
      const database: any = new Database({ _internalState: { emitApiCall: (): void => {} } } as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll.someCollection).to.equal(database.getCollection('coll.someCollection'));
      expect(coll.someCollection).to.equal(database.coll.someCollection);
    });

    it('does not return a collection starting with _', () => {
      // this is the behaviour in the old shell
      const database: any = new Database({} as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll._someProperty).to.equal(undefined);
    });

    it('does not return a collection for symbols', () => {
      const database: any = new Database({} as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll[Symbol('someProperty')]).to.equal(undefined);
    });

    it('does not return a collection with invalid name', () => {
      const database: any = new Database({} as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll['   ']).to.equal(undefined);
    });

    it('allows to access _name', () => {
      const database: any = new Database({} as any, 'db1');
      const coll: any = new Collection({} as any, database, 'coll');
      expect(coll._name).to.equal('coll');
    });
  });
  describe('commands', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let database: Database;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;
    let collection: Collection;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      database = new Database(mongo, 'db1');
      collection = new Collection(mongo, database, 'coll1');
    });
    describe('aggregate', () => {
      let serviceProviderCursor: StubbedInstance<ServiceProviderAggregationCursor>;

      beforeEach(() => {
        serviceProviderCursor = stubInterface<ServiceProviderAggregationCursor>();
      });

      it('calls serviceProvider.aggregate with pipeline and no options', async() => {
        await collection.aggregate(
          [{ $piplelineStage: {} }]
        );

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          [{ $piplelineStage: {} }],
          {}
        );
      });
      it('calls serviceProvider.aggregate with no pipeline and no options', async() => {
        await collection.aggregate();

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          [],
          {}
        );
      });
      it('calls serviceProvider.aggregate with stages as arguments', async() => {
        await collection.aggregate(
          { $option1: 1 },
          { $option2: 2 },
          { $option3: 3 }
        );

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          [{ $option1: 1 }, { $option2: 2 }, { $option3: 3 }],
          {}
        );
      });

      it('calls serviceProvider.aggregate with pipleline and options', async() => {
        await collection.aggregate(
          [{ $piplelineStage: {} }],
          { options: true });

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          [{ $piplelineStage: {} }],
          { options: true }
        );
      });

      it('returns an AggregationCursor that wraps the service provider one', async() => {
        const toArrayResult = [];
        serviceProviderCursor.toArray.resolves(toArrayResult);
        serviceProvider.aggregate.returns(serviceProviderCursor);

        const cursor = await collection.aggregate([{
          $piplelineStage: {}
        }]);

        expect(await (cursor as AggregationCursor).toArray()).to.equal(toArrayResult);
      });

      it('throws if serviceProvider.aggregate rejects', async() => {
        const expectedError = new Error();
        serviceProvider.aggregate.throws(expectedError);

        expect(
          await collection.aggregate(
            [{ $piplelineStage: {} }]
          ).catch(e => e)
        ).to.equal(expectedError);
      });

      it('pass readConcern and writeConcern as dbOption', async() => {
        await collection.aggregate(
          [],
          { otherOption: true, readConcern: { level: 'majority' }, writeConcern: { w: 1 } }
        );

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          [],
          { otherOption: true },
          { readConcern: { level: 'majority' }, w: 1 }
        );
      });

      it('runs explain if explain true is passed', async() => {
        const expectedExplainResult = {};
        serviceProviderCursor.explain.resolves(expectedExplainResult);
        serviceProvider.aggregate.returns(serviceProviderCursor as any);

        const explainResult = await collection.aggregate(
          [],
          { explain: true }
        );

        expect(explainResult).to.equal(expectedExplainResult);
        expect((await toShellResult(explainResult)).type).to.equal('ExplainOutput');
        expect(serviceProviderCursor.explain).to.have.been.calledOnce;
      });

      it('wont run explain if explain is not passed', async() => {
        serviceProvider.aggregate.returns(serviceProviderCursor as any);

        const cursor = await collection.aggregate(
          [],
          {}
        );

        expect((await toShellResult(cursor)).type).to.equal('AggregationCursor');
        expect(serviceProviderCursor.explain).not.to.have.been.called;
      });
    });

    describe('bulkWrite', () => {
      let requests;
      beforeEach(async() => {
        requests = [
          { insertOne: { 'document': { doc: 1 } } }
        ];
      });

      it('calls service provider bulkWrite', async() => {
        serviceProvider.bulkWrite = sinon.spy(() => Promise.resolve({
          result: { ok: 1 }
        })) as any;

        await collection.bulkWrite(requests);

        expect(serviceProvider.bulkWrite).to.have.been.calledWith(
          'db1',
          'coll1',
          requests
        );
      });

      it('passes writeConcern through if specified', async() => {
        serviceProvider.bulkWrite = sinon.spy(() => Promise.resolve({
          result: { ok: 1 }
        })) as any;

        await collection.bulkWrite(requests, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.bulkWrite).to.have.been.calledWith(
          'db1',
          'coll1',
          requests,
          { writeConcern: { w: 'majority' } }
        );
      });

      it('adapts the result', async() => {
        const id1 = new ObjectId();
        const id2 = new ObjectId();
        serviceProvider.bulkWrite.resolves({
          result: { ok: 1 },
          insertedCount: 1,
          matchedCount: 2,
          modifiedCount: 3,
          deletedCount: 4,
          upsertedCount: 5,
          insertedIds: { 0: id1 },
          upsertedIds: { 0: id2 },
          ok: true
        } as any);

        const result = await collection.bulkWrite(requests);

        expect((await toShellResult(result)).printable).to.be.deep.equal({
          acknowledged: true,
          insertedCount: 1,
          matchedCount: 2,
          modifiedCount: 3,
          deletedCount: 4,
          upsertedCount: 5,
          insertedIds: { 0: id1 },
          upsertedIds: { 0: id2 }
        });
      });
    });

    describe('convertToCapped', () => {
      it('calls service provider runCommandWithCheck', async() => {
        const result = await collection.convertToCapped(1000);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          'db1',
          {
            convertToCapped: 'coll1',
            size: 1000
          }
        );

        expect(result).to.deep.equal({ ok: 1 });
      });
    });

    describe('count', () => {
      it('passes readConcern through if specified', async() => {
        serviceProvider.count = (sinon.spy(() => Promise.resolve(10))) as any;

        await collection.count({}, {
          readConcern: { level: 'majority' }
        });

        expect(serviceProvider.count).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          { readConcern: { level: 'majority' } }
        );
      });
    });

    describe('deleteMany', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.deleteMany = sinon.spy(() => Promise.resolve({
          result: { ok: 1, deletedCount: 10 }
        })) as any;

        await collection.deleteMany({}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.deleteMany).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          { writeConcern: { w: 'majority' } }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.deleteMany.resolves({ ok: 1 } as any);

        const explained = await collection.deleteMany({}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('deleteOne', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.deleteOne = sinon.spy(() => Promise.resolve({
          result: { ok: 1, deletedCount: 1 }
        })) as any;

        await collection.deleteOne({}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.deleteOne).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          { writeConcern: { w: 'majority' } }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.deleteOne.resolves({ ok: 1 } as any);

        const explained = await collection.deleteOne({}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('distinct', () => {
      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.distinct.resolves({ ok: 1 } as any);

        const explained = await collection.distinct('_id', {}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('remove', () => {
      beforeEach(() => {
        serviceProvider.deleteOne = sinon.spy(() => Promise.resolve({
          acknowledged: true, deletedCount: 1
        })) as any;
        serviceProvider.deleteMany = sinon.spy(() => Promise.resolve({
          acknowledged: true, deletedCount: 2
        })) as any;
      });

      it('calls deleteOne if justOne is passed as an argument', async() => {
        expect((await collection.remove({}, true)).deletedCount).to.equal(1);
        expect(serviceProvider.deleteOne).to.have.been.calledWith('db1', 'coll1', {}, {});
        expect(serviceProvider.deleteMany).to.not.have.been.called;
      });

      it('calls deleteOne if justOne is passed as an option', async() => {
        expect((await collection.remove({}, { justOne: true })).deletedCount).to.equal(1);
        expect(serviceProvider.deleteOne).to.have.been.calledWith('db1', 'coll1', {}, {});
        expect(serviceProvider.deleteMany).to.not.have.been.called;
      });

      it('calls deleteMany if !justOne is passed as an argument', async() => {
        expect((await collection.remove({}, false)).deletedCount).to.equal(2);
        expect(serviceProvider.deleteOne).to.not.have.been.called;
        expect(serviceProvider.deleteMany).to.have.been.calledWith('db1', 'coll1', {}, {});
      });

      it('calls deleteMany if !justOne is passed as an option', async() => {
        expect((await collection.remove({}, { justOne: false })).deletedCount).to.equal(2);
        expect(serviceProvider.deleteOne).to.not.have.been.called;
        expect(serviceProvider.deleteMany).to.have.been.calledWith('db1', 'coll1', {}, {});
      });

      it('calls deleteMany by default', async() => {
        expect((await collection.remove({})).deletedCount).to.equal(2);
        expect(serviceProvider.deleteOne).to.not.have.been.called;
        expect(serviceProvider.deleteMany).to.have.been.calledWith('db1', 'coll1', {}, {});
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.deleteMany = sinon.spy(() => Promise.resolve({ ok: 1 })) as any;

        const explained = await collection.remove({}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('findOneAndReplace', () => {
      it('sets returnOriginal to true by default', async() => {
        serviceProvider.findOneAndReplace = sinon.spy(() => Promise.resolve({
          result: { ok: 1, value: {} }
        })) as any;

        await collection.findOneAndReplace({}, {});

        expect(serviceProvider.findOneAndReplace).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { returnOriginal: true }
        );
      });

      it('lets returnNewDocument determine returnOriginal', async() => {
        serviceProvider.findOneAndReplace = sinon.spy(() => Promise.resolve({
          result: { ok: 1, value: {} }
        })) as any;

        await collection.findOneAndReplace({}, {}, {
          returnNewDocument: true
        });

        expect(serviceProvider.findOneAndReplace).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { returnOriginal: false }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.findOneAndReplace.resolves({ ok: 1 });

        const explained = await collection.findOneAndReplace({}, {}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('findOneAndUpdate', () => {
      it('sets returnOriginal to true by default', async() => {
        serviceProvider.findOneAndUpdate = sinon.spy(() => Promise.resolve({
          result: { ok: 1, value: {} }
        })) as any;

        await collection.findOneAndUpdate({}, {});

        expect(serviceProvider.findOneAndUpdate).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { returnOriginal: true }
        );
      });

      it('lets returnNewDocument determine returnOriginal', async() => {
        serviceProvider.findOneAndUpdate = sinon.spy(() => Promise.resolve({
          result: { ok: 1, value: {} }
        })) as any;

        await collection.findOneAndUpdate({}, {}, {
          returnNewDocument: true
        });

        expect(serviceProvider.findOneAndUpdate).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { returnOriginal: false }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.findOneAndUpdate.resolves({ ok: 1 });

        const explained = await collection.findOneAndUpdate({}, {}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('getDb', () => {
      it('returns the db instance', () => {
        expect(collection.getDB()).to.equal(database);
      });
    });

    describe('getMongo', () => {
      it('returns the Mongo instance', () => {
        expect(collection.getMongo()).to.equal(mongo);
      });
    });

    describe('insert', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.insertMany = sinon.spy(() => Promise.resolve({
          result: { ok: 1, insertedIds: {} }
        })) as any;

        await collection.insert({}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.insertMany).to.have.been.calledWith(
          'db1',
          'coll1',
          [{}],
          { writeConcern: { w: 'majority' } }
        );
      });
    });

    describe('insertMany', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.insertMany = sinon.spy(() => Promise.resolve({
          result: { ok: 1, insertedIds: {} }
        })) as any;

        await collection.insertMany([{}], {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.insertMany).to.have.been.calledWith(
          'db1',
          'coll1',
          [{}],
          { writeConcern: { w: 'majority' } }
        );
      });
    });

    describe('insertOne', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.insertOne = sinon.spy(() => Promise.resolve({
          result: { ok: 1, insertedId: null }
        })) as any;

        await collection.insertOne({}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.insertOne).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          { writeConcern: { w: 'majority' } }
        );
      });
    });

    describe('replaceOne', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.replaceOne = sinon.spy(() => Promise.resolve({
          result: { ok: 1, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null }
        })) as any;

        await collection.replaceOne({}, {}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.replaceOne).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { writeConcern: { w: 'majority' } }
        );
      });
    });

    describe('updateOne', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.updateOne = sinon.spy(() => Promise.resolve({
          result: { ok: 1, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null }
        })) as any;

        await collection.updateOne({}, {}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.updateOne).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { writeConcern: { w: 'majority' } }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.updateOne.resolves({ ok: 1 } as any);

        const explained = await collection.updateOne({}, {}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('updateMany', () => {
      it('passes writeConcern through if specified', async() => {
        serviceProvider.updateMany = sinon.spy(() => Promise.resolve({
          result: { ok: 1, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null }
        })) as any;

        await collection.updateMany({}, {}, {
          writeConcern: { w: 'majority' }
        });

        expect(serviceProvider.updateMany).to.have.been.calledWith(
          'db1',
          'coll1',
          {},
          {},
          { writeConcern: { w: 'majority' } }
        );
      });

      it('returns an ExplainOutput object when explained', async() => {
        serviceProvider.updateMany.resolves({ ok: 1 } as any);

        const explained = await collection.updateMany({}, {}, { explain: 'queryPlanner' });
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('createIndexes', () => {
      beforeEach(async() => {
        serviceProvider.createIndexes.resolves(['index_1']);
      });

      context('when options is not passed', () => {
        it('calls serviceProvider.createIndexes using keyPatterns as keys', async() => {
          await collection.createIndexes([{ x: 1 }]);

          expect(serviceProvider.createIndexes).to.have.been.calledWith(
            'db1',
            'coll1',
            [{ key: { x: 1 } }]
          );
        });
      });

      context('when options is an object', () => {
        it('calls serviceProvider.createIndexes merging options', async() => {
          await collection.createIndexes([{ x: 1 }], { name: 'index-1' });

          expect(serviceProvider.createIndexes).to.have.been.calledWith(
            'db1',
            'coll1',
            [{ key: { x: 1 }, name: 'index-1' }],
            { name: 'index-1' }
          );
        });
      });

      context('when options is not an object', () => {
        it('throws an error', async() => {
          const error = await collection.createIndexes(
            [{ x: 1 }], 'unsupported' as any
          ).catch(e => e);

          expect(error).to.be.instanceOf(MongoshInvalidInputError);
          expect(error.message).to.contain('The "options" argument must be an object.');
          expect(error.code).to.equal(CommonErrors.InvalidArgument);
        });
      });
    });

    ['ensureIndex', 'createIndex'].forEach((method) => {
      describe(method, () => {
        beforeEach(async() => {
          serviceProvider.createIndexes.resolves(['index_1']);
        });

        context('when options is not passed', () => {
          it('calls serviceProvider.createIndexes using keys', async() => {
            await collection[method]({ x: 1 });

            expect(serviceProvider.createIndexes).to.have.been.calledWith(
              'db1',
              'coll1',
              [{ key: { x: 1 } }]
            );
          });
        });

        context('when options is an object', () => {
          it('calls serviceProvider.createIndexes merging options', async() => {
            await collection[method]({ x: 1 }, { name: 'index-1' });

            expect(serviceProvider.createIndexes).to.have.been.calledWith(
              'db1',
              'coll1',
              [{ key: { x: 1 }, name: 'index-1' }],
              { name: 'index-1' }
            );
          });
        });

        context('when options is not an object', () => {
          it('throws an error', async() => {
            const error = await collection[method](
              { x: 1 }, 'unsupported' as any
            ).catch(e => e);

            expect(error).to.be.instanceOf(MongoshInvalidInputError);
            expect(error.message).to.contain('The "options" argument must be an object.');
            expect(error.code).to.equal(CommonErrors.InvalidArgument);
          });
        });
      });
    });

    ['getIndexes', 'getIndexSpecs', 'getIndices'].forEach((method) => {
      describe(method, () => {
        let result;
        beforeEach(async() => {
          result = [{
            v: 2,
            key: {
              _id: 1
            },
            name: '_id_',
            ns: 'test.coll1'
          }];
          serviceProvider.getIndexes.resolves(result);
        });

        it('returns serviceProvider.getIndexes using keys', async() => {
          expect(await collection[method]()).to.deep.equal(result);
        });
      });
    });

    describe('getIndexKeys', () => {
      let result;
      beforeEach(async() => {
        result = [{
          v: 2,
          key: {
            _id: 1
          },
          name: '_id_',
          ns: 'test.coll1'
        },
        {
          v: 2,
          key: {
            name: 1
          },
          name: 'name_',
          ns: 'test.coll1'
        }];
        serviceProvider.getIndexes.resolves(result);
      });

      it('returns only indexes keys', async() => {
        expect(await collection.getIndexKeys()).to.deep.equal([
          { _id: 1 },
          { name: 1 }
        ]);
      });
    });

    describe('dropIndexes', () => {
      context('when serviceProvider.dropIndexes resolves', () => {
        let result;
        beforeEach(async() => {
          result = { nIndexesWas: 3, ok: 1 };
          serviceProvider.runCommandWithCheck.resolves(result);
        });

        it('returns the result of serviceProvider.dropIndexes', async() => {
          expect(await collection.dropIndexes('index_1')).to.deep.equal(result);
        });

        it('defaults to removing all indexes', async() => {
          expect(await collection.dropIndexes()).to.deep.equal(result);
          expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
            database.getName(),
            { dropIndexes: collection.getName(), index: '*' },
            {});
        });
      });

      context('when serviceProvider.dropIndexes rejects IndexNotFound', () => {
        beforeEach(async() => {
          const error = new Error('index not found with name [index_1]');
          Object.assign(error, {
            ok: 0,
            errmsg: 'index not found with name [index_1]',
            code: 27,
            codeName: 'IndexNotFound',
            name: 'MongoError'
          });

          serviceProvider.runCommandWithCheck.rejects(error);
        });

        it('returns the error as object', async() => {
          expect(await collection.dropIndexes('index_1')).to.deep.equal({
            ok: 0,
            errmsg: 'index not found with name [index_1]',
            code: 27,
            codeName: 'IndexNotFound'
          });
        });
      });

      context('when serviceProvider.dropIndexes rejects IndexNotFound because mongod 4.0 does not support arrays', () => {
        beforeEach(async() => {
          const error = new Error('invalid index name spec');
          Object.assign(error, {
            ok: 0,
            errmsg: 'invalid index name spec',
            code: 27,
            codeName: 'IndexNotFound',
            name: 'MongoError'
          });

          serviceProvider.runCommandWithCheck.callsFake(async(db, cmd) => {
            if (cmd.dropIndexes) {
              if (Array.isArray(cmd.index)) {
                throw error;
              } else if (cmd.index === 'index_1') {
                return { nIndexesWas: 2, ok: 1 };
              } else {
                return { nIndexesWas: 3, ok: 1 };
              }
            } else if (cmd.buildInfo) {
              return { version: '4.0.0' };
            } else {
              expect.fail('unknown runCommandWithCheck');
            }
          });
        });

        it('falls back to multiple dropIndexes calls', async() => {
          expect(await collection.dropIndexes(['index_1', 'index_2'])).to.deep.equal({ nIndexesWas: 3, ok: 1 });
        });
      });

      context('when serviceProvider.dropIndexes rejects any other error', () => {
        let error;
        beforeEach(async() => {
          error = new Error('Some error');
          serviceProvider.runCommandWithCheck.rejects(new Error('Some error'));
        });

        it('rejects with error', async() => {
          let catched;
          await collection.dropIndexes('index_1').catch(err => { catched = err; });
          expect(catched.message).to.equal(error.message);
        });
      });
    });

    describe('dropIndex', () => {
      context('when collection.dropIndexes resolves', () => {
        let result;
        beforeEach(async() => {
          result = { nIndexesWas: 3, ok: 1 };
          serviceProvider.runCommandWithCheck.resolves(result);
        });

        it('returns the result of serviceProvider.dropIndexes', async() => {
          expect(await collection.dropIndex('index_1')).to.deep.equal(result);
        });

        it('throws if index is "*"', async() => {
          let catched;
          await collection.dropIndex('*').catch(err => { catched = err; });

          expect(catched).to.be.instanceOf(MongoshInvalidInputError);
          expect(catched.message).to.contain(
            'To drop indexes in the collection using \'*\', use db.collection.dropIndexes().'
          );
          expect(catched.code).to.equal(CommonErrors.InvalidArgument);
        });

        it('throws if index is an array', async() => {
          let catched;
          await collection.dropIndex(['index-1']).catch(err => { catched = err; });

          expect(catched).to.be.instanceOf(MongoshInvalidInputError);
          expect(catched.message).to.contain(
            'The index to drop must be either the index name or the index specification document.'
          );
          expect(catched.code).to.equal(CommonErrors.InvalidArgument);
        });
      });
    });

    describe('totalIndexSize', () => {
      beforeEach(() => {
        serviceProvider.stats.resolves({
          totalIndexSize: 1000
        });
      });

      it('returns totalIndexSize', async() => {
        expect(await collection.totalIndexSize()).to.equal(1000);
        expect(serviceProvider.stats).to.have.been.calledOnceWith('db1', 'coll1');
      });

      it('throws an error if called with verbose', async() => {
        let catched;
        await collection.totalIndexSize(true)
          .catch(err => { catched = err; });

        expect(catched).to.be.instanceOf(MongoshInvalidInputError);
        expect(catched.message).to.contain(
          '"totalIndexSize" takes no argument. Use db.collection.stats to get detailed information.'
        );
        expect(catched.code).to.equal(CommonErrors.InvalidArgument);
      });
    });

    describe('reIndex', () => {
      it('returns the result of serviceProvider.dropIndexes', async() => {
        expect(await collection.reIndex()).to.deep.equal({ ok: 1 });
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith('db1', {
          reIndex: 'coll1'
        });
      });
    });

    describe('stats', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with no options', async() => {
        await collection.stats();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { collStats: 'coll1', scale: 1 } // ensure simple collname
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database with scale option', async() => {
        await collection.stats({ scale: 2 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { collStats: collection._name, scale: 2 }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database with legacy scale', async() => {
        await collection.stats(2);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { collStats: collection._name, scale: 2 }
        );
      });

      context('indexDetails', () => {
        let expectedResult;
        let indexesResult;
        beforeEach(() => {
          expectedResult = { ok: 1, indexDetails: { k1_1: { details: 1 }, k2_1: { details: 2 } } };
          indexesResult = [ { v: 2, key: { k1: 1 }, name: 'k1_1' }, { v: 2, key: { k2: 1 }, name: 'k2_1' }];
          serviceProvider.runCommandWithCheck.resolves(expectedResult);
          serviceProvider.getIndexes.resolves(indexesResult);
        });
        it('not returned when no args', async() => {
          const result = await collection.stats();
          expect(result).to.deep.equal({ ok: 1 });
        });
        it('not returned when options indexDetails: false', async() => {
          const result = await collection.stats({ indexDetails: false });
          expect(result).to.deep.equal({ ok: 1 });
        });
        it('returned all when true, even if no key/name set', async() => {
          const result = await collection.stats({ indexDetails: true });
          expect(result).to.deep.equal(expectedResult);
        });
        it('returned only 1 when indexDetailsName set', async() => {
          const result = await collection.stats({ indexDetails: true, indexDetailsName: 'k2_1' });
          expect(result).to.deep.equal({ ok: 1, indexDetails: { 'k2_1': expectedResult.indexDetails.k2_1 } });
        });
        it('returned all when indexDetailsName set but not found', async() => {
          const result = await collection.stats({ indexDetails: true, indexDetailsName: 'k3_1' });
          expect(result).to.deep.equal(expectedResult);
        });
        it('returned only 1 when indexDetailsKey set', async() => {
          const result = await collection.stats({ indexDetails: true, indexDetailsKey: indexesResult[1].key });
          expect(result).to.deep.equal({ ok: 1, indexDetails: { 'k2_1': expectedResult.indexDetails.k2_1 } });
        });
        it('returned all when indexDetailsKey set but not found', async() => {
          const result = await collection.stats({ indexDetails: true, indexDetailsKey: { other: 1 } });
          expect(result).to.deep.equal(expectedResult);
        });
        it('throws when indexDetailsName and indexDetailsKey are given', async() => {
          const error = await collection.stats(
            { indexDetails: true, indexDetailsName: 'k2_1', indexDetailsKey: { other: 1 } }
          ).catch(e => e);

          expect(error).to.be.instanceOf(MongoshInvalidInputError);
          expect(error.message).to.contain('Cannot filter indexDetails on both indexDetailsKey and indexDetailsName');
          expect(error.code).to.equal(CommonErrors.InvalidArgument);
        });
        it('throws when indexDetailsKey is not an object', async() => {
          const error = await collection.stats(
            { indexDetails: true, indexDetailsKey: 'string' } as any
          ).catch(e => e);

          expect(error).to.be.instanceOf(MongoshInvalidInputError);
          expect(error.message).to.contain('Expected options.indexDetailsKey to be a document');
          expect(error.code).to.equal(CommonErrors.InvalidArgument);
        });
        it('throws when indexDetailsName is not a string', async() => {
          const error = await collection.stats(
            { indexDetails: true, indexDetailsName: {} } as any
          ).catch(e => e);

          expect(error).to.be.instanceOf(MongoshInvalidInputError);
          expect(error.message).to.contain('Expected options.indexDetailsName to be a string');
          expect(error.code).to.equal(CommonErrors.InvalidArgument);
        });
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await collection.stats()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws is serviceProvider.runCommandWithCheck returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const error = await collection.stats(
          { indexDetails: true, indexDetailsName: 'k2_1' }
        ).catch(e => e);

        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.message).to.contain('Error running collStats command');
      });
    });

    describe('dataSize', () => {
      let result;

      beforeEach(() => {
        result = { size: 1000 };
        serviceProvider.stats.resolves(result);
      });

      it('returns stats.size', async() => {
        expect(await collection.dataSize()).to.equal(1000);
        expect(serviceProvider.stats).to.have.been.calledOnceWith('db1', 'coll1');
      });
    });

    describe('storageSize', () => {
      let result;

      beforeEach(() => {
        result = { storageSize: 1000 };
        serviceProvider.stats.resolves(result);
      });

      it('returns stats.storageSize', async() => {
        expect(await collection.storageSize()).to.equal(1000);
        expect(serviceProvider.stats).to.have.been.calledOnceWith('db1', 'coll1');
      });
    });

    describe('totalSize', () => {
      let result;

      beforeEach(() => {
        result = { storageSize: 1000, totalIndexSize: 1000 };
        serviceProvider.stats.resolves(result);
      });

      it('returns sum of storageSize and totalIndexSize', async() => {
        expect(await collection.totalSize()).to.equal(2000);
        expect(serviceProvider.stats).to.have.been.calledOnceWith('db1', 'coll1');
      });
    });

    describe('drop', () => {
      it('re-throws an error that is not NamespaceNotFound', async() => {
        const error = new Error();
        serviceProvider.dropCollection.rejects(error);
        expect(await (collection.drop().catch((e) => e))).to.equal(error);
      });
    });

    describe('getFullName', () => {
      it('returns the namespaced collection name', async() => {
        expect(collection.getFullName()).to.equal('db1.coll1');
      });
    });

    describe('getName', () => {
      it('returns the namespaced collection name', async() => {
        expect(collection.getName()).to.equal('coll1');
      });
    });

    describe('findAndModify', () => {
      let mockResult;

      beforeEach(() => {
        mockResult = { value: {} };
        serviceProvider.findOneAndUpdate.resolves(mockResult);
        serviceProvider.findOneAndReplace.resolves(mockResult);
        serviceProvider.findOneAndDelete.resolves(mockResult);
      });

      it('returns result.value from serviceProvider.findOneAndReplace', async() => {
        expect(await collection.findAndModify({ query: {}, update: {} })).to.equal(mockResult.value);
        expect(serviceProvider.findOneAndReplace).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          {},
          {}
        );
      });

      it('throws if no query is provided', async() => {
        try {
          await collection.findAndModify({} as any);
        } catch (e) {
          return expect(e.name).to.equal('MongoshInvalidInputError');
        }
        expect.fail('MongoshInvalidInputError not thrown for findAndModify');
      });
      it('throws if no argument is provided', async() => {
        try {
          await (collection.findAndModify as any)();
        } catch (e) {
          return expect(e.name).to.equal('MongoshInvalidInputError');
        }
        expect.fail('MongoshInvalidInputError not thrown for findAndModify');
      });

      it('calls the service provider with the correct options', async() => {
        const options = {
          remove: true,
          new: true,
          fields: { projection: 1 },
          upsert: true,
          bypassDocumentValidation: true,
          writeConcern: { writeConcern: 1 },
          collation: { collation: 1, locale: 'en_US' },
          arrayFilters: [ { filter: 1 } ]
        };

        await collection.findAndModify({
          query: { query: 1 },
          sort: { sort: 1 },
          update: { update: 1 },
          ...options
        });

        expect(serviceProvider.findOneAndDelete).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          { query: 1 },
          { ...options, sort: { sort: 1 } }
        );
      });
    });

    describe('renameCollection', () => {
      let mockResult;

      beforeEach(() => {
        mockResult = {};
        serviceProvider.renameCollection.resolves(mockResult);
      });

      it('returns { ok: 1 } if the operation is successful', async() => {
        expect(
          await collection.renameCollection(
            'newName'
          )
        ).to.deep.equal({ ok: 1 });
      });

      it('calls the service provider with dropTarget=false if none is provided', async() => {
        await collection.renameCollection('newName');

        expect(serviceProvider.renameCollection).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          'newName',
          { dropTarget: false }
        );
      });

      it('calls the service provider with the correct options', async() => {
        await collection.renameCollection('newName', true);

        expect(serviceProvider.renameCollection).to.have.been.calledWith(
          collection._database._name,
          collection._name,
          'newName',
          { dropTarget: true }
        );
      });

      it('rethrows a generic error', async() => {
        const error: any = new Error();

        serviceProvider.renameCollection.rejects(error);

        expect(
          await collection.renameCollection(
            'newName'
          ).catch(e => e)
        ).to.equal(error);
      });

      it('returns a MongoError with { ok: 0 } instead of throwing', async() => {
        const error: any = new Error();
        error.name = 'MongoError';
        error.code = 123;
        error.errmsg = 'msg';
        error.codeName = 'NamespaceNotFound';

        serviceProvider.renameCollection.rejects(error);

        expect(
          await collection.renameCollection(
            'newName'
          )
        ).to.deep.equal({
          code: error.code,
          errmsg: error.errmsg,
          codeName: error.codeName,
          ok: 0
        });
      });

      it('throws an error if newName is not a string', async() => {
        try {
          await collection.renameCollection({} as any);
          expect.fail('expected error');
        } catch (e) {
          expect(e.message).to.include('type string');
          expect(e.name).to.equal('MongoshInvalidInputError');
          expect(e.code).to.equal(CommonErrors.InvalidArgument);
        }
      });
    });

    describe('runCommand', () => {
      it('calls serviceProvider.runCommand with the collection set', async() => {
        await collection.runCommand('someCommand', {
          someOption: 1
        } as any);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          collection._database._name,
          {
            someCommand: collection._name,
            someOption: 1
          }
        );
      });

      it('can be called without options', async() => {
        await collection.runCommand('someCommand');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          collection._database._name,
          {
            someCommand: collection._name
          }
        );
      });

      it('throws an error if commandName is not a string', async() => {
        const e = await collection.runCommand(
          {} as any
        ).catch(e => e);

        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.message).to.include('type string');
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
      });

      it('throws an error if commandName is passed as option', async() => {
        const e = await collection.runCommand(
          'commandName', { commandName: 1 } as any
        ).catch(e => e);

        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.message).to.contain('The "commandName" argument cannot be passed as an option to "runCommand".');
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
      });
    });

    describe('explain', () => {
      it('returns an Explainable object', () => {
        expect(collection.explain()).to.have.instanceOf(Explainable);
      });

      it('accepts valid verbosity', () => {
        expect(
          collection.explain('queryPlanner')._verbosity
        ).to.equal('queryPlanner');

        expect(
          collection.explain('executionStats')._verbosity
        ).to.equal('executionStats');

        expect(
          collection.explain('allPlansExecution')._verbosity
        ).to.equal('allPlansExecution');

        expect(
          collection.explain(true)._verbosity
        ).to.equal('allPlansExecution');

        expect(
          collection.explain(false)._verbosity
        ).to.equal('queryPlanner');
      });

      it('throws in case of non valid verbosity', () => {
        expect(() => {
          collection.explain('badVerbosityArgument' as any);
        }).to.throw('verbosity can only be one of queryPlanner, executionStats, allPlansExecution. Received badVerbosityArgument.');
      });

      it('sets the right default verbosity', () => {
        const explainable = collection.explain();
        expect(explainable._verbosity).to.equal('queryPlanner');
      });
    });

    describe('latencyStats', () => {
      it('calls serviceProvider.aggregate on the database with options', async() => {
        serviceProvider.aggregate.returns({ toArray: async() => ([]) } as any);
        await collection.latencyStats({ histograms: true });

        expect(serviceProvider.aggregate).to.have.been.calledWith(
          database._name,
          collection._name,
          [{
            $collStats: { latencyStats: { histograms: true } }
          }],
          {}
        );
      });

      it('returns whatever serviceProvider.aggregate returns', async() => {
        serviceProvider.aggregate.returns({ toArray: async() => ([{ 1: 'db1' }]) } as any);
        const result = await collection.latencyStats();
        expect(result).to.deep.equal([{ 1: 'db1' }]);
      });

      it('throws if serviceProvider.aggregate rejects', async() => {
        const expectedError = new Error();
        serviceProvider.aggregate.throws(expectedError);
        const catchedError = await collection.latencyStats()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('initializeUnorderedBulkOp', () => {
      it('calls serviceProvider.aggregate on the database with options', async() => {
        await collection.initializeUnorderedBulkOp();

        expect(serviceProvider.initializeBulkOp).to.have.been.calledWith(
          database._name,
          collection._name,
          false
        );
      });

      it('returns Bulk wrapping whatever serviceProvider returns', async() => {
        const expectedResult = { batches: [] } as any;
        serviceProvider.initializeBulkOp.resolves(expectedResult);
        const result = await collection.initializeUnorderedBulkOp();
        expect((await toShellResult(result)).type).to.equal('Bulk');
        expect(result._serviceProviderBulkOp).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.initializeBulkOp rejects', async() => {
        const expectedError = new Error();
        serviceProvider.initializeBulkOp.throws(expectedError);
        const catchedError = await collection.initializeUnorderedBulkOp()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('initializeOrderedBulkOp', () => {
      it('calls serviceProvider.aggregate on the database with options', async() => {
        await collection.initializeOrderedBulkOp();

        expect(serviceProvider.initializeBulkOp).to.have.been.calledWith(
          database._name,
          collection._name,
          true
        );
      });

      it('returns Bulk wrapped in whatever serviceProvider returns', async() => {
        const expectedResult = { batches: [] } as any;
        serviceProvider.initializeBulkOp.resolves(expectedResult);
        const result = await collection.initializeOrderedBulkOp();
        expect((await toShellResult(result)).type).to.equal('Bulk');
        expect(result._serviceProviderBulkOp).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider rejects', async() => {
        const expectedError = new Error();
        serviceProvider.initializeBulkOp.throws(expectedError);
        const catchedError = await collection.initializeOrderedBulkOp()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getPlanCache', () => {
      it('returns a PlanCache object', async() => {
        const pc = collection.getPlanCache();
        expect(pc[shellApiType]).to.equal('PlanCache');
        expect((await toShellResult(pc)).printable).to.equal('PlanCache for collection coll1.');
      });
    });
    describe('validate', () => {
      it('calls serviceProvider.runCommand on the collection default', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await collection.validate();
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            validate: collection._name,
            full: false
          }
        );
      });
      it('calls serviceProvider.runCommand on the collection with options', async() => {
        await collection.validate(true);
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            validate: collection._name,
            full: true
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await collection.validate();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommand rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await collection.validate()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('mapReduce', () => {
      let mapFn;
      let reduceFn;
      beforeEach(() => {
        mapFn = function(): void {};
        reduceFn = function(keyCustId, valuesPrices): any {
          return valuesPrices.reduce((t, s) => (t + s));
        };
      });
      it('calls serviceProvider.mapReduce on the collection with js args', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await collection.mapReduce(mapFn, reduceFn, { out: 'map_reduce_example' });
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            mapReduce: collection._name,
            map: mapFn,
            reduce: reduceFn,
            out: 'map_reduce_example'
          }
        );
      });
      it('calls serviceProvider.runCommand on the collection with string args', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await collection.mapReduce(mapFn.toString(), reduceFn.toString(), { out: 'map_reduce_example' });
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            mapReduce: collection._name,
            map: mapFn.toString(),
            reduce: reduceFn.toString(),
            out: 'map_reduce_example'
          }
        );
      });

      it('returns whatever serviceProvider.mapReduce returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await collection.mapReduce(mapFn, reduceFn, { out: { inline: 1 } });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.mapReduce rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await collection.mapReduce(mapFn, reduceFn, { out: { inline: 1 } })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if optiosn is an object and options.out is not defined', async() => {
        const error = await collection.mapReduce(mapFn, reduceFn, {}).catch(e => e);
        expect(error).to.be.instanceOf(MongoshInvalidInputError);
        expect(error.message).to.contain('Missing \'out\' option');
        expect(error.code).to.equal(CommonErrors.InvalidArgument);
      });
    });
    describe('getShardVersion', () => {
      it('calls serviceProvider.runCommand on the database with options', async() => {
        await collection.getShardVersion();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            getShardVersion: `${database._name}.${collection._name}`
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await collection.getShardVersion();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommand rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await collection.getShardVersion()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getShardDistribution', () => {
      it('throws when collection is not sharded', async() => {
        const error = await collection.getShardDistribution().catch(e => e);

        expect(error).to.be.instanceOf(MongoshInvalidInputError);
        expect(error.message).to.contain('is not sharded');
        expect(error.code).to.equal(ShellApiErrors.NotConnectedToShardedCluster);
      });
    });

    describe('return information about the collection as metadata', async() => {
      let serviceProviderCursor: StubbedInstance<ServiceProviderCursor>;
      let proxyCursor;

      beforeEach(() => {
        serviceProviderCursor = stubInterface<ServiceProviderCursor>();
        serviceProviderCursor.limit.returns(serviceProviderCursor);
        serviceProviderCursor.tryNext.resolves({ _id: 'abc' });
        proxyCursor = new Proxy(serviceProviderCursor, {
          get: (target, prop): any => {
            if (prop === 'closed') {
              return false;
            }
            return (target as any)[prop];
          }
        });
      });

      it('works for find()', async() => {
        serviceProvider.find.returns(proxyCursor);
        const cursor = await collection.find();
        const result = await toShellResult(cursor);
        expect(result.type).to.equal('Cursor');
        expect(result)
          .to.have.nested.property('printable.documents.length')
          .not.equal(0);
        expect(result).to.have.nested.property(
          'printable.documents[0]._id',
          'abc'
        );
        expect(result.source).to.deep.equal({
          namespace: {
            db: 'db1',
            collection: 'coll1'
          }
        });
      });

      it('works for findOne()', async() => {
        serviceProvider.find.returns(serviceProviderCursor);
        const document = await collection.findOne({ hasBanana: true });
        const result = await toShellResult(document);
        expect(result.type).to.equal('Document');
        expect(result.printable._id).to.equal('abc');
        expect(result.source).to.deep.equal({
          namespace: {
            db: 'db1',
            collection: 'coll1'
          }
        });
      });

      it('works for getIndexes()', async() => {
        const fakeIndex = { v: 2, key: { _id: 1 }, name: '_id_' };
        serviceProvider.getIndexes.resolves([fakeIndex]);

        const indexResult = await collection.getIndexes();
        const result = await toShellResult(indexResult);
        expect(result.type).to.equal(null);
        expect(result.printable).to.deep.equal([ fakeIndex ]);
        expect(result.source).to.deep.equal({
          namespace: {
            db: 'db1',
            collection: 'coll1'
          }
        });
      });
    });
    describe('watch', () => {
      it('calls serviceProvider.watch when given no args', () => {
        collection.watch();
        expect(serviceProvider.watch).to.have.been.calledWith([], {}, {}, collection._database._name, collection._name);
      });
      it('calls serviceProvider.watch when given pipeline arg', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        collection.watch(pipeline);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, {}, {}, collection._database._name, collection._name);
      });
      it('calls serviceProvider.watch when given no args', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        const ops = { batchSize: 1 };
        collection.watch(pipeline, ops);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, ops, {}, collection._database._name, collection._name);
      });

      it('returns whatever serviceProvider.watch returns', () => {
        const expectedResult = { ChangeStreamCursor: 1 } as any;
        const expectedCursor = new ChangeStreamCursor(expectedResult, collection._name, mongo);
        serviceProvider.watch.returns(expectedResult);
        const result = collection.watch();
        expect(result).to.deep.equal(expectedCursor);
        expect(collection._mongo._internalState.currentCursor).to.equal(result);
      });

      it('throws if serviceProvider.watch throws', () => {
        const expectedError = new Error();
        serviceProvider.watch.throws(expectedError);
        try {
          collection.watch();
        } catch (e) {
          expect(e).to.equal(expectedError);
          return;
        }
        expect.fail('Failed to throw');
      });
    });
  });
  describe('with session', () => {
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let collection: Collection;
    let internalSession: StubbedInstance<ServiceProviderSession>;
    const exceptions = {
      renameCollection: { a: ['name'] },
      createIndexes: { a: [[]] },
      runCommand: { a: ['coll', {} ], m: 'runCommandWithCheck', i: 2 },
      findOne: { m: 'find' },
      insert: { m: 'insertMany' },
      update: { m: 'updateOne', i: 4 },
      createIndex: { m: 'createIndexes' },
      ensureIndex: { m: 'createIndexes' },
      getIndexSpecs: { m: 'getIndexes', i: 2 },
      getIndices: { m: 'getIndexes', i: 2 },
      getIndexKeys: { m: 'getIndexes', i: 2 },
      dropIndex: { m: 'runCommandWithCheck', i: 2 },
      dropIndexes: { m: 'runCommandWithCheck', i: 2 },
      convertToCapped: { m: 'runCommandWithCheck', i: 2 },
      dataSize: { m: 'stats', i: 2 },
      storageSize: { m: 'stats', i: 2 },
      totalSize: { m: 'stats', i: 2 },
      totalIndexSize: { a: [], m: 'stats', i: 2 },
      drop: { m: 'dropCollection', i: 2 },
      exists: { m: 'listCollections', i: 2 },
      stats: { m: 'runCommandWithCheck', i: 2 },
      mapReduce: { m: 'runCommandWithCheck', i: 2 },
      validate: { m: 'runCommandWithCheck', i: 2 },
      getShardVersion: { m: 'runCommandWithCheck', i: 2 },
      latencyStats: { m: 'aggregate' },
      initializeOrderedBulkOp: { m: 'initializeBulkOp' },
      initializeUnorderedBulkOp: { m: 'initializeBulkOp' },
      distinct: { i: 4 },
      estimatedDocumentCount: { i: 2 },
      findAndModify: { a: [{ query: {}, update: {} }], m: 'findOneAndReplace', i: 4 },
      findOneAndReplace: { i: 4 },
      findOneAndUpdate: { i: 4 },
      replaceOne: { i: 4 },
      updateMany: { i: 4 },
      updateOne: { i: 4 },
      getIndexes: { i: 2 },
      reIndex: { m: 'runCommandWithCheck', i: 2 },
      hideIndex: { m: 'runCommandWithCheck', i: 2 },
      unhideIndex: { m: 'runCommandWithCheck', i: 2 },
      remove: { m: 'deleteMany' },
    };
    const ignore = [ 'getShardDistribution', 'stats', 'isCapped', 'save' ];
    const args = [ { query: {} }, {}, { out: 'coll' } ];
    beforeEach(() => {
      const bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      internalSession = stubInterface<ServiceProviderSession>();
      serviceProvider.startSession.returns(internalSession);
      serviceProvider.aggregate.returns(stubInterface<ServiceProviderAggregationCursor>());
      serviceProvider.find.returns(stubInterface<ServiceProviderCursor>());
      serviceProvider.getIndexes.resolves([]);
      serviceProvider.createIndexes.resolves(['index_1']);
      serviceProvider.stats.resolves({ storageSize: 1, totalIndexSize: 1 });
      serviceProvider.listCollections.resolves([]);
      serviceProvider.countDocuments.resolves(1);

      serviceProvider.runCommandWithCheck.resolves({ ok: 1, version: 1, bits: 1, commands: 1, users: [], roles: [], logComponentVerbosity: 1 });
      [ 'bulkWrite', 'deleteMany', 'deleteOne', 'insert', 'insertMany',
        'insertOne', 'replaceOne', 'update', 'updateOne', 'updateMany',
        'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate',
        'findAndModify'
      ].forEach(
        k => serviceProvider[k].resolves({ result: {}, value: {} })
      );
      const internalState = new ShellInternalState(serviceProvider, bus);
      const mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      const session = mongo.startSession();
      collection = session.getDatabase('db1').getCollection('coll');
    });
    it('all commands that use the same command in sp', async() => {
      for (const method of Object.getOwnPropertyNames(Collection.prototype).filter(
        k => !ignore.includes(k) && !Object.keys(exceptions).includes(k)
      )) {
        if (!method.startsWith('_') &&
          !method.startsWith('print') &&
          collection[method].returnsPromise) {
          try {
            await collection[method](...args);
          } catch (e) {
            expect.fail(`Collection.${method} failed, error thrown ${e.message}`);
          }
          expect(serviceProvider[method].calledOnce).to.equal(true, `expected sp.${method} to be called but it was not`);
          expect((serviceProvider[method].getCall(-1).args[3] as any).session).to.equal(internalSession);
        }
      }
    });
    it('all commands that use other methods', async() => {
      for (const method of Object.keys(exceptions)) {
        const customA = exceptions[method].a || args;
        const customM = exceptions[method].m || method;
        const customI = exceptions[method].i || 3;
        try {
          await collection[method](...customA);
        } catch (e) {
          expect.fail(`${method} failed, error thrown ${e.stack}`);
        }
        expect(serviceProvider[customM].called).to.equal(true, `expecting sp.${customM} to be called but it was not`);
        const call = serviceProvider[customM].getCall(-1).args[customI];
        if (Array.isArray(call)) {
          for (const k of call) {
            expect(k.session).to.equal(internalSession, `method ${method} supposed to call sp.${customM} with options at arg ${customI}`);
          }
        } else {
          expect(call.session).to.equal(internalSession, `method ${method} supposed to call sp.${customM} with options at arg ${customI}`);
        }
      }
    });
  });
});
