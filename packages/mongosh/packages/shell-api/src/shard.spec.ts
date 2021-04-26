import { expect } from 'chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import Shard from './shard';
import { ADMIN_DB, ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { signatures, toShellResult } from './index';
import Mongo from './mongo';
import { bson, ServiceProvider, FindCursor as ServiceProviderCursor } from '@mongosh/service-provider-core';
import { EventEmitter } from 'events';
import ShellInternalState from './shell-internal-state';
import { UpdateResult } from './result';
import { CliServiceProvider } from '../../service-provider-server';
import { startTestCluster, skipIfServerVersion } from '../../../testing/integration-testing-hooks';
import Database from './database';
import { ObjectId } from 'mongodb';

describe('Shard', () => {
  describe('help', () => {
    const apiClass: any = new Shard({} as any);
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
    it('calls help function for methods', async() => {
      expect((await toShellResult(apiClass.enableSharding.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.enableSharding.help)).type).to.equal('Help');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.Shard.type).to.equal('Shard');
    });
    it('attributes', () => {
      expect(signatures.Shard.attributes.enableSharding).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.Shard.hasAsyncChild).to.equal(true);
    });
  });
  describe('Metadata', () => {
    describe('toShellResult', () => {
      const mongo = { _uri: 'test_uri' } as Mongo;
      const db = { _mongo: mongo, _name: 'test' } as Database;
      const sh = new Shard(db);
      it('value', async() => {
        expect((await toShellResult(sh)).printable).to.equal('Shard class connected to test_uri via db test');
      });
      it('type', async() => {
        expect((await toShellResult(sh)).type).to.equal('Shard');
      });
    });
  });
  describe('unit', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let shard: Shard;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;
    let db: Database;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      db = new Database(mongo, 'testDb');
      shard = new Shard(db);
    });
    describe('enableSharding', () => {
      it('calls serviceProvider.runCommandWithCheck without optional arg', async() => {
        await shard.enableSharding('db.coll');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            enableSharding: 'db.coll'
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await shard.enableSharding('dbname', 'primaryShard');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            enableSharding: 'dbname',
            primaryShard: 'primaryShard'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.enableSharding('dbname');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.enableSharding('dbname')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('shardCollection', () => {
      it('calls serviceProvider.runCommandWithCheck without optional args', async() => {
        await shard.shardCollection('db.coll', { key: 1 } );
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            shardCollection: 'db.coll',
            key: { key: 1 }
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with optional args', async() => {
        await shard.shardCollection('db.coll', { key: 1 }, true, { option1: 1 });
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            shardCollection: 'db.coll',
            key: { key: 1 },
            unique: true,
            option1: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.shardCollection('db.coll', { key: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.shardCollection('db.coll', { key: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('addShard', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.addShard('uri');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            addShard: 'uri'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.addShard('uri');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.addShard('uri')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.addShard('uri')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('addShardToZone', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.addShardToZone('shard', 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            addShardToZone: 'shard',
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.addShardToZone('shard', 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.addShardToZone('shard', 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.addShardToZone('shard', 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('addShardTag', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.addShardTag('shard', 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            addShardToZone: 'shard',
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.addShardTag('shard', 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.addShardTag('shard', 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.addShardTag('shard', 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });

      it('adds version suggestion if command not found', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        (expectedError as any).codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.addShardTag('shard', 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('> 3.4');
      });
    });
    describe('updateZoneKeyRange', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.updateZoneKeyRange('ns', { min: 0 }, { max: 1 }, 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            updateZoneKeyRange: 'ns',
            min: { min: 0 },
            max: { max: 1 },
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.updateZoneKeyRange('ns', {}, {}, 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.updateZoneKeyRange('ns', {}, {}, 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.updateZoneKeyRange('ns', {}, {}, 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('addTagRange', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.addTagRange('ns', { min: 0 }, { max: 1 }, 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            updateZoneKeyRange: 'ns',
            min: { min: 0 },
            max: { max: 1 },
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.addTagRange('ns', {}, {}, 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.addTagRange('ns', {}, {}, 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.addTagRange('ns', {}, {}, 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });

      it('adds version suggestion if command not found', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        (expectedError as any).codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.addTagRange('ns', {}, {}, 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('> 3.4');
      });
    });
    describe('removeRangeFromZone', () => {
      it('calls serviceProvider.runCommandWithChek with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.removeRangeFromZone('ns', { min: 1 }, { max: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            updateZoneKeyRange: 'ns',
            min: {
              min: 1
            },
            max: {
              max: 1
            },
            zone: null
          }
        )
        ;
      });

      it('returns whatever serviceProvider.updateZoneKeyRange returns', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { ok: 1, msg: 'isdbgrid' };
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.removeRangeFromZone('ns', { min: 1 }, { max: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.updateZoneKeyRange rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeRangeFromZone('ns', { min: 1 }, { max: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1, msg: 'isdbgrid' };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.removeRangeFromZone('ns', {}, {})
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('removeTagRange', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.removeTagRange('ns', { min: 1 }, { max: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            updateZoneKeyRange: 'ns',
            min: {
              min: 1
            },
            max: {
              max: 1
            },
            zone: null
          }
        )
        ;
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { ok: 1, msg: 'isdbgrid' };
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.removeTagRange('ns', { min: 1 }, { max: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeTagRange('ns', { min: 1 }, { max: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.removeTagRange('ns', {}, {})
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
      it('adds version suggestion if command not found', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        (expectedError as any).codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeTagRange('ns', {}, {})
          .catch(e => e);
        expect(catchedError.message).to.include('> 3.4');
      });
    });
    describe('removeShardFromZone', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.removeShardFromZone('shard', 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            removeShardFromZone: 'shard',
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.removeShardFromZone('shard', 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeShardFromZone('shard', 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.removeShardFromZone('shard', 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('removeShardTag', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.removeShardTag('shard', 'zone');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            removeShardFromZone: 'shard',
            zone: 'zone'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.removeShardTag('shard', 'zone');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeShardTag('shard', 'zone')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.removeShardTag('shard', 'zone')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
      it('adds version suggestion if command not found', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        (expectedError as any).codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.removeShardTag('shard', 'tag')
          .catch(e => e);
        expect(catchedError.message).to.include('> 3.4');
      });
    });
    describe('enableAutoSplit', () => {
      it('calls serviceProvider.updateOne', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: { _id: 0 },
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        await shard.enableAutoSplit();

        expect(serviceProvider.updateOne).to.have.been.calledWith(
          'config',
          'settings',
          { _id: 'autosplit' },
          { $set: { enabled: true } },
          { upsert: true, writeConcern: { w: 'majority', wtimeout: 30000 } }
        );
      });

      it('returns whatever serviceProvider.updateOne returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const oid = new ObjectId();
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: oid,
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null,
          acknowledged: true
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        const result = await shard.enableAutoSplit();
        expect(result).to.deep.equal(new UpdateResult(true, 1, 1, 1, oid));
      });

      it('throws if serviceProvider.updateOne rejects', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.updateOne.rejects(expectedError);
        const catchedError = await shard.enableAutoSplit()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { acknowledged: 1 } as any;
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.updateOne.resolves(expectedResult);
        const catchedError = await shard.enableAutoSplit()
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('disableAutoSplit', () => {
      it('calls serviceProvider.updateOne', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: { _id: 0 },
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null,
          acknowledged: true
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        await shard.disableAutoSplit();

        expect(serviceProvider.updateOne).to.have.been.calledWith(
          'config',
          'settings',
          { _id: 'autosplit' },
          { $set: { enabled: false } },
          { upsert: true, writeConcern: { w: 'majority', wtimeout: 30000 } }
        );
      });

      it('returns whatever serviceProvider.updateOne returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const oid = new ObjectId();
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: oid,
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null,
          acknowledged: true
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        const result = await shard.disableAutoSplit();
        expect(result).to.deep.equal(new UpdateResult(true, 1, 1, 1, oid));
      });

      it('throws if serviceProvider.updateOne rejects', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.updateOne.rejects(expectedError);
        const catchedError = await shard.disableAutoSplit()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 } as any;
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.updateOne.resolves(expectedResult);
        const catchedError = await shard.disableAutoSplit()
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('splitAt', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.splitAt('ns', { query: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            split: 'ns',
            middle: {
              query: 1
            }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.splitAt('ns', { query: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.splitAt('ns', { query: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('splitFind', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.splitFind('ns', { query: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            split: 'ns',
            find: {
              query: 1
            }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.splitFind('ns', { query: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.splitFind('ns', { query: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('moveChunk', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.moveChunk('ns', { query: 1 }, 'destination');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            moveChunk: 'ns', find: { query: 1 }, to: 'destination'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.moveChunk('ns', { query: 1 }, 'destination');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.moveChunk('ns', { query: 1 }, 'destination')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('balancerCollectionStatus', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await shard.balancerCollectionStatus('ns');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerCollectionStatus: 'ns'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.balancerCollectionStatus('ns');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.balancerCollectionStatus('ns')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('disableBalancing', () => {
      it('calls serviceProvider.updateOne', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: { _id: 0 },
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        await shard.disableBalancing('ns');

        expect(serviceProvider.updateOne).to.have.been.calledWith(
          'config',
          'collections',
          { _id: 'ns' },
          { $set: { noBalance: true } },
          { writeConcern: { w: 'majority', wtimeout: 60000 } }
        );
      });

      it('returns whatever serviceProvider.updateOne returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const oid = new ObjectId();
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: oid,
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null,
          acknowledged: true
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        const result = await shard.disableBalancing('ns');
        expect(result).to.deep.equal(new UpdateResult(true, 1, 1, 1, oid));
      });

      it('throws if serviceProvider.updateOne rejects', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.updateOne.rejects(expectedError);
        const catchedError = await shard.disableBalancing('ns')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 } as any;
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.updateOne.resolves(expectedResult);
        const catchedError = await shard.disableBalancing('ns')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('enableBalancing', () => {
      it('calls serviceProvider.updateOne', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: { _id: 0 },
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        await shard.enableBalancing('ns');

        expect(serviceProvider.updateOne).to.have.been.calledWith(
          'config',
          'collections',
          { _id: 'ns' },
          { $set: { noBalance: false } },
          { writeConcern: { w: 'majority', wtimeout: 60000 } }
        );
      });

      it('returns whatever serviceProvider.updateOne returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const oid = new ObjectId();
        const expectedResult = {
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 1,
          upsertedId: oid,
          result: { ok: 1, n: 1, nModified: 1 },
          connection: null,
          acknowledged: true
        } as any;
        serviceProvider.updateOne.resolves(expectedResult);
        const result = await shard.enableBalancing('ns');
        expect(result).to.deep.equal(new UpdateResult(true, 1, 1, 1, oid));
      });

      it('throws if serviceProvider.updateOne rejects', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.updateOne.rejects(expectedError);
        const catchedError = await shard.enableBalancing('ns')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 } as any;
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.updateOne.resolves(expectedResult);
        const catchedError = await shard.enableBalancing('ns')
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('getBalancerState', () => {
      it('returns whatever serviceProvider.find returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { stopped: true };
        const findCursor = stubInterface<ServiceProviderCursor>();
        findCursor.tryNext.resolves(expectedResult);
        serviceProvider.find.returns(findCursor);
        const result = await shard.getBalancerState();
        expect(serviceProvider.find).to.have.been.calledWith(
          'config',
          'settings',
          { _id: 'balancer' },
          {}
        );
        expect(result).to.deep.equal(!expectedResult.stopped);
      });

      it('throws if serviceProvider.find rejects', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.find.throws(expectedError);
        const catchedError = await shard.getBalancerState()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.find.resolves(expectedResult);
        const catchedError = await shard.getBalancerState()
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('isBalancerRunning', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, msg: 'isdbgrid' });
        await shard.isBalancerRunning();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStatus: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const result = await shard.isBalancerRunning();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'isdbgrid' });
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.onCall(1).rejects(expectedError);
        const catchedError = await shard.isBalancerRunning()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if not mongos', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.onCall(0).resolves({ ok: 1, msg: 'not dbgrid' });
        serviceProvider.runCommandWithCheck.onCall(1).resolves(expectedResult);
        const catchedError = await shard.isBalancerRunning()
          .catch(e => e);
        expect(catchedError.message).to.include('Not connected to a mongos');
      });
    });
    describe('startBalancer', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await shard.startBalancer(10000);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStart: 1, maxTimeMS: 10000
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck with no arg', async() => {
        await shard.startBalancer();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStart: 1, maxTimeMS: 60000
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.startBalancer(10000);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.startBalancer(10000)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('stopBalancer', () => {
      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await shard.stopBalancer(10000);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStop: 1, maxTimeMS: 10000
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck with no arg', async() => {
        await shard.stopBalancer();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStop: 1, maxTimeMS: 60000
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.stopBalancer(10000);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.stopBalancer(10000)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('setBalancerState', () => {
      it('calls serviceProvider.runCommandWithCheck with arg=true', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.setBalancerState(true);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStart: 1, maxTimeMS: 60000
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });
      it('calls serviceProvider.runCommandWithCheck with arg=false', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await shard.setBalancerState(false);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            balancerStop: 1, maxTimeMS: 60000
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await shard.setBalancerState(true)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
  });

  describe('integration', () => {
    let serviceProvider: CliServiceProvider;
    let internalState;
    let sh;
    const dbName = 'test';
    const ns = `${dbName}.coll`;
    const shardId = 'rs-shard0';

    const [ mongos, rs0, rs1 ] = startTestCluster(
      // --sharded 0 creates a setup without any initial shards
      ['--replicaset', '--sharded', '0'],
      ['--replicaset', '--name', `${shardId}-0`, '--shardsvr'],
      ['--replicaset', '--name', `${shardId}-1`, '--shardsvr']
    );

    before(async() => {
      serviceProvider = await CliServiceProvider.connect(await mongos.connectionString());
      internalState = new ShellInternalState(serviceProvider);
      sh = new Shard(internalState.currentDb);

      // check replset uninitialized
      let members = await sh._database.getSiblingDB('config').getCollection('shards').find().sort({ _id: 1 }).toArray();
      expect(members.length).to.equal(0);

      // add new shards
      expect((await sh.addShard(`${shardId}-0/${await rs0.hostport()}`)).shardAdded).to.equal(`${shardId}-0`);
      expect((await sh.addShard(`${shardId}-1/${await rs1.hostport()}`)).shardAdded).to.equal(`${shardId}-1`);
      members = await sh._database.getSiblingDB('config').getCollection('shards').find().sort({ _id: 1 }).toArray();
      expect(members.length).to.equal(2);
      await sh._database.getSiblingDB(dbName).dropDatabase();
    });

    after(() => {
      return serviceProvider.close(true);
    });

    describe('sharding info', () => {
      it('returns the status', async() => {
        const result = await sh.status();
        expect(result.type).to.equal('StatsResult');
        expect(Object.keys(result.value)).to.include.members([
          'shardingVersion', 'shards', 'autosplit', 'balancer', 'databases'
        ]);
        expect(
          Object.keys(result.value).includes('active mongoses') ||
          Object.keys(result.value).includes('most recently active mongoses')).to.be.true;
      });
    });
    describe('turn on sharding', () => {
      it('enableSharding for a db', async() => {
        expect((await sh.status()).value.databases.length).to.equal(1);
        expect((await sh.enableSharding(dbName)).ok).to.equal(1);
        expect((await sh.status()).value.databases.length).to.equal(2);
      });
      it('enableSharding for a collection and modify documents in it', async() => {
        expect(Object.keys((await sh.status()).value.databases[0].collections).length).to.equal(0);
        expect((await sh.shardCollection(ns, { key: 1 })).collectionsharded).to.equal(ns);
        expect((await sh.status()).value.databases[0].collections[ns].shardKey).to.deep.equal({ key: 1 });

        const db = internalState.currentDb.getSiblingDB(dbName);
        await db.coll.insertMany([{ key: 'A', value: 10 }, { key: 'B', value: 20 }]);
        const original = await db.coll.findOneAndUpdate({ key: 'A' }, { $set: { value: 30 } });
        expect(original.key).to.equal('A');
        expect(original.value).to.equal(10);
      });
    });
    describe('autosplit', () => {
      it('disables correctly', async() => {
        expect((await sh.disableAutoSplit()).acknowledged).to.equal(true);
        expect((await sh.status()).value.autosplit['Currently enabled']).to.equal('no');
      });
      it('enables correctly', async() => {
        expect((await sh.enableAutoSplit()).acknowledged).to.equal(true);
        expect((await sh.status()).value.autosplit['Currently enabled']).to.equal('yes');
      });
    });
    describe('tags', () => {
      it('creates a zone', async() => {
        expect((await sh.addShardTag(`${shardId}-1`, 'zone1')).ok).to.equal(1);
        expect((await sh.status()).value.shards[1].tags).to.deep.equal(['zone1']);
        expect((await sh.addShardToZone(`${shardId}-0`, 'zone0')).ok).to.equal(1);
        expect((await sh.status()).value.shards[0].tags).to.deep.equal(['zone0']);
      });
      it('sets a zone key range', async() => {
        expect((await sh.updateZoneKeyRange(ns, { key: 0 }, { key: 20 }, 'zone1')).ok).to.equal(1);
        expect((await sh.status()).value.databases[0].collections[ns].tags[0]).to.deep.equal({
          tag: 'zone1', min: { key: 0 }, max: { key: 20 }
        });
        expect((await sh.addTagRange(ns, { key: 21 }, { key: 40 }, 'zone0')).ok).to.equal(1);
        expect((await sh.status()).value.databases[0].collections[ns].tags[1]).to.deep.equal({
          tag: 'zone0', min: { key: 21 }, max: { key: 40 }
        });
      });
      it('removes a key range', async() => {
        expect((await sh.status()).value.databases[0].collections[ns].tags.length).to.equal(2);
        expect((await sh.removeRangeFromZone(ns, { key: 0 }, { key: 20 })).ok).to.equal(1);
        expect((await sh.status()).value.databases[0].collections[ns].tags.length).to.equal(1);
        expect((await sh.removeTagRange(ns, { key: 21 }, { key: 40 })).ok).to.equal(1);
        expect((await sh.status()).value.databases[0].collections[ns].tags.length).to.equal(0);
      });
      it('removes zones', async() => {
        expect((await sh.removeShardFromZone(`${shardId}-1`, 'zone1')).ok).to.equal(1);
        expect((await sh.status()).value.shards[1].tags).to.deep.equal([]);
        expect((await sh.removeShardTag(`${shardId}-0`, 'zone0')).ok).to.equal(1);
        expect((await sh.status()).value.shards[0].tags).to.deep.equal([]);
      });
    });
    describe('balancer', () => {
      it('reports balancer state', async() => {
        expect(Object.keys(await sh.isBalancerRunning())).to.include.members([
          'mode', 'inBalancerRound', 'numBalancerRounds'
        ]);
      });
      it('stops balancer', async() => {
        expect((await sh.stopBalancer()).ok).to.equal(1);
        expect((await sh.isBalancerRunning()).mode).to.equal('off');
      });
      it('starts balancer', async() => {
        expect((await sh.startBalancer()).ok).to.equal(1);
        expect((await sh.isBalancerRunning()).mode).to.equal('full');
      });
      describe('balancerCollectionStatus', () => {
        skipIfServerVersion(mongos, '< 4.4');
        it('reports state for collection', async() => {
          expect(Object.keys(await sh.balancerCollectionStatus(ns))).to.include('balancerCompliant');
        });
      });
      it('disables balancing', async() => {
        expect((await sh.disableBalancing(ns)).acknowledged).to.equal(true);
        expect((await sh._database.getSiblingDB('config').getCollection('collections').findOne({ _id: ns })).noBalance).to.equal(true);
      });
      it('enables balancing', async() => {
        expect((await sh.enableBalancing(ns)).acknowledged).to.equal(true);
        expect((await sh._database.getSiblingDB('config').getCollection('collections').findOne({ _id: ns })).noBalance).to.equal(false);
      });
    });
    describe('getShardDistribution', () => {
      let db: Database;
      const dbName = 'shard-distrib-test';
      const ns = `${dbName}.test`;

      before(() => {
        db = sh._database.getSiblingDB(dbName);
      });
      afterEach(async() => {
        await db.dropDatabase();
      });
      it('fails when running against an unsharded collection', async() => {
        try {
          await db.getCollection('test').getShardDistribution();
        } catch (err) {
          expect(err.name).to.equal('MongoshInvalidInputError');
          return;
        }
        expect.fail('Missed exception');
      });
      it('gives information about the shard distribution', async() => {
        expect((await sh.enableSharding(dbName)).ok).to.equal(1);
        expect((await sh.shardCollection(ns, { key: 1 })).collectionsharded).to.equal(ns);

        {
          const ret = await db.getCollection('test').getShardDistribution();
          expect(ret.type).to.equal('StatsResult');
          const { Totals } = ret.value as any;
          expect(Totals.data).to.equal('0B');
          expect(Totals.docs).to.equal(0);
          expect(Totals.chunks).to.equal(1);

          const TotalsShardInfoKeys = Object.keys(Totals).filter(key => key.startsWith('Shard'));
          expect(TotalsShardInfoKeys).to.have.lengthOf(1);
          expect(Totals[TotalsShardInfoKeys[0]]).to.deep.equal(
            [ '0 % data', '0 % docs in cluster', '0B avg obj size on shard' ]);

          const ValueShardInfoKeys = Object.keys(ret.value).filter(key => key.startsWith('Shard'));
          expect(ValueShardInfoKeys).to.have.lengthOf(1);
          expect(ret.value[ValueShardInfoKeys[0]]).to.deep.equal({
            data: '0B',
            docs: 0,
            chunks: 1,
            'estimated data per chunk': '0B',
            'estimated docs per chunk': 0
          });
        }

        // Insert a document, then check again
        await db.getCollection('test').insertOne({ foo: 'bar', key: 99 });

        {
          const ret = await db.getCollection('test').getShardDistribution();
          expect(ret.type).to.equal('StatsResult');
          const { Totals } = ret.value as any;
          expect(Totals.docs).to.equal(1);
          expect(Totals.chunks).to.equal(1);

          const TotalsShardInfoKeys = Object.keys(Totals).filter(key => key.startsWith('Shard'));
          expect(TotalsShardInfoKeys).to.have.lengthOf(1);
          expect(Totals[TotalsShardInfoKeys[0]]).to.deep.equal(
            [ '100 % data', '100 % docs in cluster', `${Totals.data} avg obj size on shard` ]);

          const ValueShardInfoKeys = Object.keys(ret.value).filter(key => key.startsWith('Shard'));
          expect(ValueShardInfoKeys).to.have.lengthOf(1);
          expect(ret.value[ValueShardInfoKeys[0]]).to.deep.equal({
            data: Totals.data,
            docs: 1,
            chunks: 1,
            'estimated data per chunk': Totals.data,
            'estimated docs per chunk': 1
          });
        }
      });
    });
    describe('collection.isCapped', () => {
      it('returns true for config.changelog', async() => {
        const ret = await sh._database.getSiblingDB('config').getCollection('changelog').isCapped();
        expect(ret).to.equal(true);
      });
    });
    describe('databases', () => {
      let dbRegular: Database;
      let dbSh: Database;
      const dbRegularName = 'db';
      const dbShName = 'dbSh';
      const collRegularName = 'testRegular';
      const collShName = 'testSh';

      before(() => {
        dbRegular = sh._database.getSiblingDB(dbRegularName);
        dbSh = sh._database.getSiblingDB(dbShName);
      });

      afterEach(async() => {
        await dbRegular.dropDatabase();
        await dbSh.dropDatabase();
      });

      it('the list includes not partitioned databases', async() => {
        await dbRegular.getCollection(collRegularName).insertOne({ foo: 'bar', key: 99 });

        const collSh = dbSh.getCollection(collShName);
        await collSh.insertOne({ name: 'some', zipcode: '11111' });
        await collSh.createIndex({ zipcode: 1 });
        await sh.enableSharding(dbShName);
        await sh.shardCollection(`${dbShName}.${collShName}`, { zipcode: 1 });

        const result = await sh.status();

        const databasesDbItem = result.value.databases.find((item) => (item.database._id === 'db'));
        expect(databasesDbItem.database.partitioned).to.equal(false);
        const databasesDbShItem = result.value.databases.find((item) => (item.database._id === 'dbSh'));
        expect(databasesDbShItem.database.partitioned).to.equal(true);
      });
    });
  });
});
