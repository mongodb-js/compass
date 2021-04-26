import { expect } from 'chai';
import Mongo from './mongo';
import { ADMIN_DB, ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { signatures, toShellResult } from './index';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import {
  bson,
  ReadConcern,
  ReadPreference,
  ServiceProvider,
  WriteConcern
} from '@mongosh/service-provider-core';
import Database from './database';
import { EventEmitter } from 'events';
import ShellInternalState from './shell-internal-state';
import Collection from './collection';
import Cursor from './cursor';
import ChangeStreamCursor from './change-stream-cursor';
import NoDatabase from './no-db';
import { MongoshDeprecatedError, MongoshInternalError, MongoshUnimplementedError } from '@mongosh/errors';
import { CliServiceProvider } from '../../service-provider-server';
import { startTestServer, skipIfServerVersion } from '../../../testing/integration-testing-hooks';

const sampleOpts = {
  causalConsistency: false,
  readConcern: { level: 'majority' } as ReadConcern,
  writeConcern: { w: 1, j: false, wtimeout: 0 } as WriteConcern,
  readPreference: { mode: 'primary', tagSet: [] } as unknown as ReadPreference
};

describe('Mongo', () => {
  describe('help', () => {
    const apiClass = new Mongo({} as any, '');
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.Mongo.type).to.equal('Mongo');
    });
    it('attributes', () => {
      expect(signatures.Mongo.attributes.show).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { attributes: {}, type: 'unknown' },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.Mongo.hasAsyncChild).to.equal(true);
    });
  });
  describe('Metadata', () => {
    describe('toShellResult', () => {
      const mongo = new Mongo({} as any, 'localhost:37017');
      it('value', async() => {
        expect((await toShellResult(mongo)).printable).to.equal('mongodb://localhost:37017/test?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('type', async() => {
        expect((await toShellResult(mongo)).type).to.equal('Mongo');
      });
    });
  });
  describe('commands', () => {
    const driverSession = { driverSession: 1 };
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let database: StubbedInstance<Database>;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.startSession.returns({ driverSession: 1 } as any);
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      database = stubInterface<Database>();
      internalState.currentDb = database;
    });
    describe('show', () => {
      ['databases', 'dbs'].forEach((t) => {
        describe(t, () => {
          it('calls serviceProvider.listDatabases on the admin database', async() => {
            const expectedResult = { ok: 1, databases: [] };
            serviceProvider.listDatabases.resolves(expectedResult);
            await mongo.show(t);
            expect(serviceProvider.listDatabases).to.have.been.calledWith(
              ADMIN_DB
            );
          });

          it('returns ShowDatabasesResult CommandResult', async() => {
            const expectedResult = { ok: 1, databases: ['a', 'b'] };
            serviceProvider.listDatabases.resolves(expectedResult);
            const result = await mongo.show(t);
            expect(result.value).to.deep.equal(expectedResult.databases);
            expect(result.type).to.equal('ShowDatabasesResult');
          });

          it('throws if serviceProvider.listCommands rejects', async() => {
            const expectedError = new Error();
            serviceProvider.listDatabases.rejects(expectedError);
            const catchedError = await mongo.show(t)
              .catch(e => e);
            expect(catchedError).to.equal(expectedError);
          });
        });
      });
      ['collections', 'tables'].forEach((t) => {
        describe(t, () => {
          it('calls database.getCollectionNames', async() => {
            const expectedResult = ['a', 'b'];
            database._getCollectionNames.resolves(expectedResult);
            await mongo.show(t);
            expect(database._getCollectionNames).to.have.been.calledWith({
              readPreference: 'primaryPreferred'
            });
          });

          it('returns ShowCollectionsResult CommandResult', async() => {
            const expectedResult = ['a', 'b'];
            database._getCollectionNames.resolves(expectedResult);
            const result = await mongo.show(t);
            expect(result.value).to.deep.equal(expectedResult);
            expect(result.type).to.equal('ShowCollectionsResult');
          });

          it('throws if database.getCollectionNames rejects', async() => {
            const expectedError = new Error();
            database._getCollectionNames.rejects(expectedError);
            const catchedError = await mongo.show(t)
              .catch(e => e);
            expect(catchedError).to.equal(expectedError);
          });
        });
      });
      describe('users', () => {
        it('calls database.getUsers', async() => {
          const expectedResult = { ok: 1, users: [] };
          database.getUsers.resolves(expectedResult);
          await mongo.show('users');
          expect(database.getUsers).to.have.been.calledWith(

          );
        });

        it('returns ShowResult CommandResult', async() => {
          const expectedResult = { ok: 1, users: ['a', 'b'] };
          database.getUsers.resolves(expectedResult);
          const result = await mongo.show('users');
          expect(result.value).to.deep.equal(expectedResult.users);
          expect(result.type).to.equal('ShowResult');
        });

        it('throws if database.getUsers rejects', async() => {
          const expectedError = new Error();
          database.getUsers.rejects(expectedError);
          const catchedError = await mongo.show('users')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
      });
      describe('roles', () => {
        it('calls database.getRoles', async() => {
          const expectedResult = { ok: 1, roles: [] };
          database.getRoles.resolves(expectedResult);
          await mongo.show('roles');
          expect(database.getRoles).to.have.been.calledWith(
            { showBuiltinRoles: true }
          );
        });

        it('returns ShowResult CommandResult', async() => {
          const expectedResult = { ok: 1, roles: ['a', 'b'] };
          database.getRoles.resolves(expectedResult);
          const result = await mongo.show('roles');
          expect(result.value).to.deep.equal(expectedResult.roles);
          expect(result.type).to.equal('ShowResult');
        });

        it('throws if database.getRoles rejects', async() => {
          const expectedError = new Error();
          database.getRoles.rejects(expectedError);
          const catchedError = await mongo.show('roles')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
      });
      describe('log', () => {
        it('calls database.adminCommand without arg', async() => {
          const expectedResult = { ok: 1, log: [] };
          database.adminCommand.resolves(expectedResult);
          await mongo.show('log');
          expect(database.adminCommand).to.have.been.calledWith(
            { getLog: 'global' }
          );
        });
        it('calls database.adminCommand with arg', async() => {
          const expectedResult = { ok: 1, log: [] };
          database.adminCommand.resolves(expectedResult);
          await mongo.show('log', 'other');
          expect(database.adminCommand).to.have.been.calledWith(
            { getLog: 'other' }
          );
        });

        it('returns ShowResult CommandResult', async() => {
          const expectedResult = { ok: 1, log: ['a', 'b'] };
          database.adminCommand.resolves(expectedResult);
          const result = await mongo.show('log');
          expect(result.value).to.deep.equal(expectedResult.log);
          expect(result.type).to.equal('ShowResult');
        });

        it('throws if database.adminCommand rejects', async() => {
          const expectedError = new Error();
          database.adminCommand.rejects(expectedError);
          const catchedError = await mongo.show('log')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
      });
      describe('logs', () => {
        it('calls database.adminCommand', async() => {
          const expectedResult = { ok: 1, names: [] };
          database.adminCommand.resolves(expectedResult);
          await mongo.show('logs');
          expect(database.adminCommand).to.have.been.calledWith(
            { getLog: '*' }
          );
        });

        it('returns ShowResult CommandResult', async() => {
          const expectedResult = { ok: 1, names: ['a', 'b'] };
          database.adminCommand.resolves(expectedResult);
          const result = await mongo.show('logs');
          expect(result.value).to.deep.equal(expectedResult.names);
          expect(result.type).to.equal('ShowResult');
        });

        it('throws if database.adminCommand rejects', async() => {
          const expectedError = new Error();
          database.adminCommand.rejects(expectedError);
          const catchedError = await mongo.show('logs')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
      });
      describe('profile', () => {
        it('calls database.count but not find when count < 1', async() => {
          const syscoll = stubInterface<Collection>();
          database.getCollection.returns(syscoll);
          syscoll.countDocuments.resolves(0);
          syscoll.find.rejects(new Error());
          const result = await mongo.show('profile');
          expect(database.getCollection).to.have.been.calledWith('system.profile');
          expect(syscoll.countDocuments).to.have.been.calledWith({});
          expect(result.type).to.equal('ShowProfileResult');
          expect(result.value).to.deep.equal({ count: 0 });
        });
        it('calls database.count and find when count > 0', async() => {
          const expectedResult = [{ a: 'a' }, { b: 'b' }];
          const syscoll = stubInterface<Collection>();
          const cursor = stubInterface<Cursor>();
          cursor.sort.returns(cursor);
          cursor.limit.returns(cursor);
          cursor.toArray.resolves(expectedResult);
          database.getCollection.returns(syscoll);
          syscoll.countDocuments.resolves(1);
          syscoll.find.returns(cursor);
          const result = await mongo.show('profile');
          expect(database.getCollection).to.have.been.calledWith('system.profile');
          expect(syscoll.countDocuments).to.have.been.calledWith({});
          expect(cursor.sort).to.have.been.calledWith({ $natural: -1 });
          expect(cursor.limit).to.have.been.calledWith(5);
          expect(cursor.toArray).to.have.been.calledWith();
          expect(result.type).to.equal('ShowProfileResult');
          expect(result.value).to.deep.equal({ count: 1, result: expectedResult });
        });

        it('throws if collection.find throws', async() => {
          const syscoll = stubInterface<Collection>();
          database.getCollection.returns(syscoll);
          syscoll.countDocuments.resolves(1);
          const expectedError = new Error();
          syscoll.find.throws(expectedError);
          const catchedError = await mongo.show('profile')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
        it('throws if collection.countDocuments rejects', async() => {
          const syscoll = stubInterface<Collection>();
          database.getCollection.returns(syscoll);
          const expectedError = new Error();
          syscoll.countDocuments.rejects(expectedError);
          const catchedError = await mongo.show('profile')
            .catch(e => e);
          expect(catchedError).to.equal(expectedError);
        });
      });
      describe('invalid command', () => {
        it('throws an error', async() => {
          const caughtError = await mongo.show('aslkdjhekjghdskjhfds')
            .catch(e => e);
          expect(caughtError.name).to.equal('MongoshInvalidInputError');
        });
      });
    });
    describe('getReadPrefMode', () => {
      it('calls serviceProvider.getReadPreference', () => {
        const expectedResult = { mode: 'primary', tagSet: [] } as any;
        serviceProvider.getReadPreference.returns(expectedResult);
        const res = mongo.getReadPrefMode();
        expect(serviceProvider.getReadPreference).to.have.been.calledWith();
        expect(res).to.equal(expectedResult.mode);
      });
    });
    describe('getReadPref', () => {
      it('calls serviceProvider.getReadPreference', () => {
        const expectedResult = { mode: 'primary', tagSet: [] } as any;
        serviceProvider.getReadPreference.returns(expectedResult);
        const res = mongo.getReadPref();
        expect(serviceProvider.getReadPreference).to.have.been.calledWith();
        expect(res).to.equal(expectedResult);
      });
    });
    describe('getReadPrefTagSet', () => {
      it('calls serviceProvider.getReadPreference', () => {
        const expectedResult = { mode: 'primary', tagSet: [] } as any;
        serviceProvider.getReadPreference.returns(expectedResult);
        const res = mongo.getReadPrefTagSet();
        expect(serviceProvider.getReadPreference).to.have.been.calledWith();
        expect(res).to.equal(expectedResult.tags);
      });
    });
    describe('getReadConcern', () => {
      it('calls serviceProvider.getReadConcern', async() => {
        const expectedResult = { level: 'majority' };
        serviceProvider.getReadConcern.returns(expectedResult as any);
        const res = await mongo.getReadConcern();
        expect(serviceProvider.getReadConcern).to.have.been.calledWith();
        expect(res).to.equal('majority');
      });

      it('returns undefined if not set', async() => {
        serviceProvider.getReadConcern.returns(undefined);
        const res = await mongo.getReadConcern();
        expect(serviceProvider.getReadConcern).to.have.been.calledWith();
        expect(res).to.equal(undefined);
      });

      it('throws InternalError if getReadConcern errors', async() => {
        const expectedError = new Error();
        serviceProvider.getReadConcern.throws(expectedError);
        try {
          mongo.getReadConcern();
        } catch (catchedError) {
          return expect(catchedError).to.be.instanceOf(MongoshInternalError);
        }
        expect.fail();
      });
    });
    describe('setReadPref', () => {
      it('calls serviceProvider.restConnectionOptions', async() => {
        serviceProvider.resetConnectionOptions.resolves();
        serviceProvider.readPreferenceFromOptions.callsFake(input => input as any);
        await mongo.setReadPref('primaryPreferred', []);
        expect(serviceProvider.resetConnectionOptions).to.have.been.calledWith({
          readPreference: {
            readPreference: 'primaryPreferred',
            readPreferenceTags: [],
            hedge: undefined
          }
        });
      });

      it('throws if resetConnectionOptions errors', async() => {
        const expectedError = new Error();
        serviceProvider.resetConnectionOptions.throws(expectedError);
        try {
          await mongo.setReadPref('primary');
        } catch (catchedError) {
          return expect(catchedError).to.equal(expectedError);
        }
        expect.fail();
      });
    });
    describe('setReadConcern', () => {
      it('calls serviceProvider.restConnectionOptions', async() => {
        serviceProvider.resetConnectionOptions.resolves();
        await mongo.setReadConcern('majority');
        expect(serviceProvider.resetConnectionOptions).to.have.been.calledWith({
          readConcern: {
            level: 'majority'
          }
        });
      });

      it('throws if resetConnectionOptions errors', async() => {
        const expectedError = new Error();
        serviceProvider.resetConnectionOptions.throws(expectedError);
        try {
          await mongo.setReadConcern('majority');
        } catch (catchedError) {
          return expect(catchedError).to.equal(expectedError);
        }
        expect.fail();
      });
    });
    describe('startSession', () => {
      beforeEach(() => {
        serviceProvider.startSession.returns(driverSession as any);
      });
      it('calls serviceProvider.startSession', () => {
        const opts = { causalConsistency: false };
        const s = mongo.startSession(opts);
        const driverOpts = { ...opts };
        expect(serviceProvider.startSession).to.have.been.calledWith(driverOpts);
        expect(s._session).to.deep.equal(driverSession);
        expect(s._options).to.deep.equal(driverOpts);
      });

      it('throws if startSession errors', () => {
        const expectedError = new Error();
        serviceProvider.startSession.throws(expectedError);
        try {
          mongo.startSession();
        } catch (catchedError) {
          return expect(catchedError).to.equal(expectedError);
        }
        expect.fail();
      });

      it('calls startSession without args', () => {
        const result = mongo.startSession();
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({});
        expect(result._session).to.equal(driverSession);
      });
      it('can set default transaction options readconcern', () => {
        const result = mongo.startSession({
          readConcern: sampleOpts.readConcern
        });
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({
          defaultTransactionOptions: {
            readConcern: sampleOpts.readConcern
          }
        });
        expect(result._session).to.equal(driverSession);
      });
      it('can set default transaction options writeConcern', () => {
        const result = mongo.startSession({
          writeConcern: sampleOpts.writeConcern
        });
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({
          defaultTransactionOptions: {
            writeConcern: sampleOpts.writeConcern
          }
        });
        expect(result._session).to.equal(driverSession);
      });
      it('can set default transaction options readPreference', () => {
        const result = mongo.startSession({
          readPreference: sampleOpts.readPreference as any
        });
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({
          defaultTransactionOptions: {
            readPreference: sampleOpts.readPreference
          }
        });
        expect(result._session).to.equal(driverSession);
      });
      it('can set causalConsistency', () => {
        const result = mongo.startSession({
          causalConsistency: false
        });
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({
          causalConsistency: false
        });
        expect(result._session).to.equal(driverSession);
      });
      it('sets everything', () => {
        const result = mongo.startSession(sampleOpts as any);
        expect(serviceProvider.startSession).to.have.been.calledOnceWith({
          causalConsistency: sampleOpts.causalConsistency,
          defaultTransactionOptions: {
            readPreference: sampleOpts.readPreference,
            readConcern: sampleOpts.readConcern,
            writeConcern: sampleOpts.writeConcern
          }
        });
        expect(result._session).to.equal(driverSession);
      });
    });
    describe('setCausalConsistency', () => {
      it('throws because it is unsupported by the driver', () => {
        try {
          mongo.setCausalConsistency();
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshUnimplementedError);
          expect(e.metadata?.driverCaused).to.equal(true);
          expect(e.metadata?.api).to.equal('Mongo.setCausalConsistency');
        }
      });
    });
    describe('isCausalConsistency', () => {
      it('throws because it is unsupported by the driver', () => {
        try {
          mongo.isCausalConsistency();
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshUnimplementedError);
          expect(e.metadata?.driverCaused).to.equal(true);
          expect(e.metadata?.api).to.equal('Mongo.isCausalConsistency');
        }
      });
    });
    describe('use', () => {
      it('sets the current db', () => {
        const msg = mongo.use('moo');
        expect(msg).to.equal('switched to db moo');
        expect(internalState.context.db.getName()).to.equal('moo');
      });
      it('reports if no db switch has taken place', () => {
        mongo.use('moo1');
        const msg = mongo.use('moo1');
        expect(msg).to.equal('already on db moo1');
        expect(internalState.context.db.getName()).to.equal('moo1');
      });
      it('reports if db has the same name but different Mongo objects', () => {
        internalState.context.db = new Mongo(internalState, undefined, undefined, undefined, serviceProvider).getDB('moo1');
        expect(internalState.context.db.getName()).to.equal('moo1');
        const msg = mongo.use('moo1');
        expect(msg).to.equal('switched to db moo1');
        expect(internalState.context.db.getName()).to.equal('moo1');
      });
      it('works if previously there was no db', () => {
        internalState.context.db = new NoDatabase();
        const msg = mongo.use('moo1');
        expect(msg).to.equal('switched to db moo1');
        expect(internalState.context.db.getName()).to.equal('moo1');
      });
    });
    describe('deprecated mongo methods', () => {
      ['setSlaveOk', 'setSecondaryOk'].forEach((t) => {
        it(t, () => {
          try {
            mongo[t]();
          } catch (e) {
            return expect(e).to.be.instanceOf(MongoshDeprecatedError);
          }
          expect.fail();
        });
      });
    });
    describe('watch', () => {
      it('calls serviceProvider.watch when given no args', () => {
        mongo.watch();
        expect(serviceProvider.watch).to.have.been.calledWith([], {});
      });
      it('calls serviceProvider.watch when given pipeline arg', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        mongo.watch(pipeline);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, {});
      });
      it('calls serviceProvider.watch when given no args', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        const ops = { batchSize: 1 };
        mongo.watch(pipeline, ops);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, ops);
      });

      it('returns whatever serviceProvider.watch returns', () => {
        const expectedResult = { ChangeStreamCursor: 1 } as any;
        serviceProvider.watch.returns(expectedResult);
        const result = mongo.watch();
        expect(result).to.deep.equal(new ChangeStreamCursor(expectedResult, 'mongodb://localhost/?directConnection=true&serverSelectionTimeoutMS=2000', mongo));
        expect(mongo._internalState.currentCursor).to.equal(result);
      });

      it('throws if serviceProvider.watch throws', () => {
        const expectedError = new Error();
        serviceProvider.watch.throws(expectedError);
        try {
          mongo.watch();
        } catch (e) {
          expect(e).to.equal(expectedError);
          return;
        }
        expect.fail('Failed to throw');
      });
    });
    describe('getClientEncryption()', () => {
      it('throws an error if no FLE options were provided', () => {
        try {
          mongo.getClientEncryption();
        } catch (e) {
          expect(e.name).to.equal('MongoshInvalidInputError');
          return;
        }
        expect.fail('Failed to throw');
      });
    });
  });

  describe('integration', () => {
    const testServer = startTestServer('shared');
    let serviceProvider;
    let internalState;
    let uri: string;

    beforeEach(async() => {
      uri = await testServer.connectionString();
      serviceProvider = await CliServiceProvider.connect(uri);
      internalState = new ShellInternalState(serviceProvider);
    });

    afterEach(async() => {
      await internalState.close(true);
    });

    describe('versioned API', () => {
      context('pre-4.4', () => {
        skipIfServerVersion(testServer, '> 4.4');

        it('errors if an API version is specified', async() => {
          // eslint-disable-next-line new-cap
          const mongo = await internalState.shellApi.Mongo(uri, null, {
            api: { version: '1' }
          });
          expect(mongo._apiOptions).to.deep.equal({ version: '1' });
          try {
            await mongo.getDB('test').getCollection('coll').find().toArray();
            expect.fail('missed exception');
          } catch (err) {
            expect(err.message).to.include("Unrecognized field 'apiVersion'");
          }
        });
      });

      context('post-4.4', () => {
        skipIfServerVersion(testServer, '<= 4.4');

        it('can specify an API version', async() => {
          // eslint-disable-next-line new-cap
          const mongo = await internalState.shellApi.Mongo(uri, null, {
            api: { version: '1' }
          });
          expect(mongo._apiOptions).to.deep.equal({ version: '1' });
          // Does not throw, unlike the 4.4 test case above:
          await mongo.getDB('test').getCollection('coll').find().toArray();
        });
      });
    });
  });
});
