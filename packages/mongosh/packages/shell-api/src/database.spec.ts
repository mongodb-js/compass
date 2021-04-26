import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { EventEmitter } from 'events';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { signatures, toShellResult } from './index';
import Database from './database';
import Collection from './collection';
import Mongo from './mongo';
import {
  AggregationCursor as ServiceProviderAggCursor,
  ServiceProvider,
  bson,
  ClientSession as ServiceProviderSession
} from '@mongosh/service-provider-core';
import ShellInternalState from './shell-internal-state';
import crypto from 'crypto';
import { ADMIN_DB } from './enums';
import ChangeStreamCursor from './change-stream-cursor';
import { CommonErrors, MongoshDeprecatedError, MongoshInvalidInputError, MongoshRuntimeError, MongoshUnimplementedError } from '@mongosh/errors';
chai.use(sinonChai);

describe('Database', () => {
  const MD5_HASH = crypto.createHash('md5').update('anna:mongo:pwd').digest('hex');
  describe('help', () => {
    const apiClass: any = new Database({} as any, 'name');
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
    it('calls help function for methods', async() => {
      expect((await toShellResult(apiClass.runCommand.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.runCommand.help)).type).to.equal('Help');
    });
  });
  describe('collections', () => {
    it('allows to get a collection as property if is not one of the existing methods', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database.someCollection).to.have.instanceOf(Collection);
      expect(database.someCollection._name).to.equal('someCollection');
    });

    it('reuses collections', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database.someCollection).to.equal(database.someCollection);
    });

    it('does not return a collection starting with _', () => {
    // this is the behaviour in the old shell

      const database: any = new Database({} as any, 'db1');
      expect(database._someProperty).to.equal(undefined);
    });

    it('does not return a collection for symbols', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database[Symbol('someProperty')]).to.equal(undefined);
    });

    it('does not return a collection with invalid name', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database['   ']).to.equal(undefined);
    });

    it('allows to access _name', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database._name).to.equal('db1');
    });

    it('allows to access collections', () => {
      const database: any = new Database({} as any, 'db1');
      expect(database._collections).to.deep.equal({});
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.Database.type).to.equal('Database');
    });
    it('attributes', () => {
      expect(signatures.Database.attributes.aggregate).to.deep.equal({
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
      expect(signatures.Database.hasAsyncChild).to.equal(true);
    });
  });
  describe('Metadata', () => {
    describe('toShellResult', () => {
      const mongo = sinon.spy();
      const db = new Database(mongo as any, 'myDB');
      it('value', async() => {
        expect((await toShellResult(db)).printable).to.equal('myDB');
      });
      it('type', async() => {
        expect((await toShellResult(db)).type).to.equal('Database');
      });
    });
  });
  describe('attributes', () => {
    const mongo = sinon.spy();
    const db = new Database(mongo as any, 'myDB') as any;
    it('creates new collection for attribute', async() => {
      expect((await toShellResult(db.coll)).type).to.equal('Collection');
    });
  });
  describe('commands', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let database: Database;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      database = new Database(mongo, 'db1');
    });
    describe('getCollectionInfos', () => {
      it('returns the result of serviceProvider.listCollections', async() => {
        const filter = { name: 'abc' };
        const options = { nameOnly: true };
        const result = [{ name: 'coll1' }];

        serviceProvider.listCollections.resolves(result);

        expect(await database.getCollectionInfos(
          filter,
          options)).to.deep.equal(result);

        expect(serviceProvider.listCollections).to.have.been.calledOnceWith('db1', filter, options);
      });
    });

    describe('getCollectionNames', () => {
      it('returns the result of serviceProvider.listCollections', async() => {
        const result = [{ name: 'coll1' }];

        serviceProvider.listCollections.resolves(result);

        expect(await database.getCollectionNames()).to.deep.equal(['coll1']);

        expect(serviceProvider.listCollections).to.have.been.calledOnceWith(
          'db1', {}, { nameOnly: true });
      });
    });

    describe('getName', () => {
      it('returns the name of the DB', async() => {
        expect(database.getName()).to.equal('db1');
      });
    });

    describe('getMongo', () => {
      it('returns the name of the DB', async() => {
        expect(database.getMongo()).to.equal(mongo);
      });
    });

    describe('runCommand', () => {
      it('calls serviceProvider.runCommand on the database', async() => {
        await database.runCommand({ someCommand: 'someCollection' });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            someCommand: 'someCollection'
          }
        );
      });

      it('transforms a string argument into the command document', async() => {
        await database.runCommand('isMaster');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            isMaster: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.runCommand({ someCommand: 'someCollection' });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommand rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.runCommand({ someCommand: 'someCollection' })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('adminCommand', () => {
      it('calls serviceProvider.runCommand with the admin database', async() => {
        await database.adminCommand({ someCommand: 'someCollection' });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          'admin',
          {
            someCommand: 'someCollection'
          }
        );
      });

      it('transforms a string argument into the command document', async() => {
        await database.adminCommand('command');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          'admin',
          {
            command: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.adminCommand({ someCommand: 'someCollection' });
        expect(result).to.deep.equal(expectedResult);
      });
      it('throws if serviceProvider.runCommand rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.adminCommand({ someCommand: 'someCollection' })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('aggregate', () => {
      let serviceProviderCursor: StubbedInstance<ServiceProviderAggCursor>;

      beforeEach(() => {
        serviceProviderCursor = stubInterface<ServiceProviderAggCursor>();
      });

      it('calls serviceProvider.aggregateDb with pipleline and options', async() => {
        await database.aggregate(
          [{ $piplelineStage: {} }], { options: true });

        expect(serviceProvider.aggregateDb).to.have.been.calledWith(
          database._name,
          [{ $piplelineStage: {} }],
          { options: true }
        );
      });

      it('returns an AggregationCursor that wraps the service provider one', async() => {
        const toArrayResult = [];
        serviceProviderCursor.toArray.resolves(toArrayResult);
        serviceProvider.aggregateDb.returns(serviceProviderCursor);

        const cursor = await database.aggregate([{ $piplelineStage: {} }]);
        expect(await cursor.toArray()).to.equal(toArrayResult);
      });

      it('throws if serviceProvider.aggregateDb rejects', async() => {
        const expectedError = new Error();
        serviceProvider.aggregateDb.throws(expectedError);

        expect(
          await database.aggregate(
            [{ $piplelineStage: {} }]
          ).catch(e => e)
        ).to.equal(expectedError);
      });

      it('pass readConcern and writeConcern as dbOption', async() => {
        await database.aggregate(
          [],
          { otherOption: true, readConcern: { level: 'majority' }, writeConcern: { w: 1 } }
        );

        expect(serviceProvider.aggregateDb).to.have.been.calledWith(
          database._name,
          [],
          { otherOption: true },
          { readConcern: { level: 'majority' }, w: 1 }
        );
      });

      it('runs explain if explain true is passed', async() => {
        const expectedExplainResult = {};
        serviceProviderCursor.explain.resolves(expectedExplainResult);
        serviceProvider.aggregateDb.returns(serviceProviderCursor as any);

        const explainResult = await database.aggregate(
          [],
          { explain: true }
        );

        expect(explainResult).to.equal(expectedExplainResult);
        expect(serviceProviderCursor.explain).to.have.been.calledOnce;
      });

      it('wont run explain if explain is not passed', async() => {
        serviceProvider.aggregateDb.returns(serviceProviderCursor as any);

        const cursor = await database.aggregate(
          [],
          {}
        );

        expect((await toShellResult(cursor)).type).to.equal('AggregationCursor');
        expect(serviceProviderCursor.explain).not.to.have.been.called;
      });
    });
    describe('getSiblingDB', () => {
      it('returns a database', async() => {
        const otherDb = await database.getSiblingDB('otherdb');
        expect(otherDb).to.be.instanceOf(Database);
        expect(otherDb._name).to.equal('otherdb');
      });

      it('throws if name is not a string', () => {
        expect(() => {
          database.getSiblingDB(undefined);
        }).to.throw('Missing required argument');
      });

      it('throws if name is empty', () => {
        expect(() => {
          database.getSiblingDB('');
        }).to.throw('Database name cannot be empty.');
      });

      it('reuses db instances', () => {
        const otherDb = database.getSiblingDB('otherdb');
        expect(
          database.getSiblingDB('otherdb')
        ).to.equal(otherDb);
      });
    });

    describe('getCollection', () => {
      it('returns a collection for the database', async() => {
        const coll = database.getCollection('coll');
        expect(coll).to.be.instanceOf(Collection);
        expect(coll._name).to.equal('coll');
        expect(coll._database).to.equal(database);
      });

      it('throws if name is not a string', () => {
        expect(() => {
          database.getCollection(undefined);
        }).to.throw('Missing required argument');
      });

      it('throws if name is empty', () => {
        try {
          database.getCollection('');
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('Collection name cannot be empty.');
          expect(e.code).to.equal(CommonErrors.InvalidArgument);
        }
      });

      it('allows to use collection names that would collide with methods', () => {
        const coll = database.getCollection('getCollection');
        expect(coll).to.be.instanceOf(Collection);
        expect(coll._name).to.equal('getCollection');
      });

      it('allows to use collection names that starts with _', () => {
        const coll = database.getCollection('_coll1');
        expect(coll).to.be.instanceOf(Collection);
        expect(coll._name).to.equal('_coll1');
      });

      it('reuses collections', () => {
        expect(
          database.getCollection('coll')
        ).to.equal(database.getCollection('coll'));
      });
    });

    describe('dropDatabase', () => {
      it('calls serviceProvider.dropDatabase on the database', async() => {
        await database.dropDatabase({ w: 1 });

        expect(serviceProvider.dropDatabase).to.have.been.calledWith(
          database._name,
          { writeConcern: { w: 1 } }
        );
      });

      it('returns whatever serviceProvider.dropDatabase returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.dropDatabase.resolves(expectedResult);
        const result = await database.dropDatabase();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.dropDatabase rejects', async() => {
        const expectedError = new Error();
        serviceProvider.dropDatabase.rejects(expectedError);
        const catchedError = await database.dropDatabase()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('createUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields but not digestPassword', async() => {
        await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            createUser: 'anna',
            pwd: 'pwd',
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 }
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and passwordDigestor=server', async() => {
        await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: [],
          passwordDigestor: 'server'
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            createUser: 'anna',
            pwd: 'pwd',
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 },
            digestPassword: true
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and passwordDigestor=client', async() => {
        await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: [],
          passwordDigestor: 'client'
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            createUser: 'anna',
            pwd: MD5_HASH,
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 },
            digestPassword: false
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if roles is not provided', async() => {
        const catchedError = await database.createUser({
          user: 'anna',
          pwd: 'pwd'
        }).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.message).to.contain('Missing required property: "roles"');
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });

      it('throws if password is missing on database other than $external', async() => {
        const catchedError = await database.createUser({
          user: 'anna'
        }).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.message).to.contain('Missing required property: "roles"');
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });

      it('throws if createUser option is provided', async() => {
        const catchedError = await database.createUser({
          user: 'anna',
          pwd: 'pwd',
          createUser: 1,
          roles: []
        }).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.message).to.contain('Cannot set createUser field in helper method');
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });

      context('on $external database', () => {
        beforeEach(() => {
          database = new Database(mongo, '$external');
        });

        it('can create a user without password', async() => {
          await database.createUser({
            user: 'CN=Client,OU=Public-Client,O=MongoDB',
            roles: [
              { role: 'root', db: 'admin' }
            ]
          });
          expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
            database._name,
            {
              createUser: 'CN=Client,OU=Public-Client,O=MongoDB',
              roles: [
                { role: 'root', db: 'admin' }
              ]
            }
          );
        });

        it('throws an error when a password is specified', async() => {
          try {
            await database.createUser({
              user: 'CN=Client,OU=Public-Client,O=MongoDB',
              pwd: 'nope',
              roles: [
                { role: 'root', db: 'admin' }
              ]
            });
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshInvalidInputError);
            expect(e.message).to.contain('Cannot set password');
            return;
          }
          expect.fail('Expected error');
        });
      });
    });
    describe('updateUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and no passwordDigestor', async() => {
        await database.updateUser('anna', {
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateUser: 'anna',
            pwd: 'pwd',
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 }
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and passwordDigestor=client', async() => {
        await database.updateUser('anna', {
          pwd: 'pwd',
          customData: { anything: true },
          roles: [],
          passwordDigestor: 'client'
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateUser: 'anna',
            pwd: MD5_HASH,
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 },
            digestPassword: false
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and passwordDigestor=server', async() => {
        await database.updateUser('anna', {
          pwd: 'pwd',
          customData: { anything: true },
          roles: [],
          passwordDigestor: 'server'
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateUser: 'anna',
            pwd: 'pwd',
            customData: { anything: true },
            roles: [],
            writeConcern: { w: 1 },
            digestPassword: true
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.updateUser('anna', {
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.updateUser('anna', {
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: []
        }, { w: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if an invalid passwordDigestor is provided', async() => {
        const catchedError = await database.updateUser('anna', {
          user: 'anna',
          pwd: 'pwd',
          customData: { anything: true },
          roles: [],
          passwordDigestor: 'whatever'
        }, { w: 1 }).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.message).to.contain('passwordDigestor must be \'client\' or \'server\'');
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });
    });
    describe('changeUserPassword', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields', async() => {
        await database.changeUserPassword('anna', 'pwd');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateUser: 'anna',
            pwd: 'pwd',
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.changeUserPassword('anna', 'pwd');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.changeUserPassword('anna', 'pwd')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('logout', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields', async() => {
        await database.logout();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { logout: 1 }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.logout();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.logout()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('dropUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.dropUser('anna');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { dropUser: 'anna' }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.dropUser('anna');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.dropUser('anna')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('dropAllUsers', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.dropAllUsers();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { dropAllUsersFromDatabase: 1 }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.dropAllUsers();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.dropAllUsers()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('auth', () => {
      it('calls serviceProvider.authenticate on the database when one arg provided', async() => {
        await database.auth({
          user: 'anna',
          pwd: 'pwd',
          mechanism: 'mech'
        });

        expect(serviceProvider.authenticate).to.have.been.calledWith(
          {
            user: 'anna',
            pwd: 'pwd',
            mechanism: 'mech',
            authDb: 'db1'
          }
        );
      });
      it('calls serviceProvider.authenticate on the database when two args provided', async() => {
        await database.auth('anna', 'pwd');

        expect(serviceProvider.authenticate).to.have.been.calledWith(
          {
            user: 'anna',
            pwd: 'pwd',
            authDb: 'db1'
          }
        );
      });

      it('returns whatever serviceProvider.authenticate returns', async() => {
        const expectedResult = { ok: 1 } as any;
        serviceProvider.authenticate.resolves(expectedResult);
        const result = await database.auth('anna', 'pwd');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.authenticate.rejects(expectedError);
        const catchedError = await database.auth('anna', 'pwd')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      [[{}], [{ user: 'anna', pass: 'pwd' }], ['name', 'pwd', 'hmm']].forEach(args => {
        it('throws for invalid arguments', async() => {
          const catchedError = await database.auth(...args as any).catch(e => e);
          expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
          expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
        });
      });

      it('throws if digestPassword is specified', async() => {
        const catchedError = await database.auth({
          user: 'anna',
          pwd: 'pwd',
          digestPassword: 'nope'
        } as any).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshUnimplementedError);
        expect(catchedError.code).to.equal(CommonErrors.NotImplemented);
      });

      it('asks for password if only username is passed', async() => {
        internalState.setEvaluationListener({
          onPrompt: () => 'superSecretPassword'
        });
        const expectedResult = { ok: 1 } as any;
        serviceProvider.authenticate.resolves(expectedResult);
        const result = await database.auth('anna');
        expect(result).to.deep.equal(expectedResult);
        expect(serviceProvider.authenticate).to.have.been.calledWith(
          {
            user: 'anna',
            pwd: 'superSecretPassword',
            authDb: 'db1'
          }
        );
      });
    });
    describe('grantRolesToUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.grantRolesToUser('anna', [ 'role1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { grantRolesToUser: 'anna', roles: ['role1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.grantRolesToUser('anna', [ 'role1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.grantRolesToUser('anna', [ 'role1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('revokeRolesFromUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.revokeRolesFromUser('anna', [ 'role1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { revokeRolesFromUser: 'anna', roles: ['role1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.revokeRolesFromUser('anna', [ 'role1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.revokeRolesFromUser('anna', [ 'role1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getUser', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        const expectedResult = { ok: 1, users: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.getUser('anna');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { usersInfo: { user: 'anna', db: 'db1' } }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        const expectedResult = { ok: 1, users: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.getUser('anna', {
          showCredentials: false,
          showPrivileges: true,
          filter: { f: 1 }
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            usersInfo: { user: 'anna', db: 'db1' },
            showCredentials: false,
            showPrivileges: true,
            filter: { f: 1 }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1, users: [ { user: 'anna' }] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getUser('anna');
        expect(result).to.deep.equal({ user: 'anna' });
      });
      it('returns whatever serviceProvider.runCommandWithCheck returns if user does not exist', async() => {
        const expectedResult = { ok: 1, users: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getUser('anna');
        expect(result).to.deep.equal(null);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getUser('anna')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getUsers', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.getUsers();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { usersInfo: 1 }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.getUsers({
          showCredentials: false,
          filter: {}
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            usersInfo: 1,
            showCredentials: false,
            filter: {}
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getUsers();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getUsers()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('createCollection', () => {
      it('calls serviceProvider.createCollection on the database without options', async() => {
        await database.createCollection('newcoll');

        expect(serviceProvider.createCollection).to.have.been.calledWith(
          database._name,
          'newcoll',
          {}
        );
      });
      it('calls serviceProvider.createCollection on the database with options', async() => {
        await database.createCollection('newcoll', {
          capped: false,
          max: 100,
          writeConcern: { w: 1 }
        });

        expect(serviceProvider.createCollection).to.have.been.calledWith(
          database._name,
          'newcoll',
          {
            capped: false,
            max: 100,
            writeConcern: { w: 1 }
          }
        );
      });

      it('returns whatever serviceProvider.createCollection returns', async() => {
        const expectedResult = { ok: 1 } as any;
        serviceProvider.createCollection.resolves(expectedResult);
        const result = await database.createCollection('newcoll');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.createCollection rejects', async() => {
        const expectedError = new Error();
        serviceProvider.createCollection.rejects(expectedError);
        const catchedError = await database.createCollection('newcoll')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('createView', () => {
      it('calls serviceProvider.createCollection on the database without options', async() => {
        await database.createView('newcoll', 'sourcecoll', [{ $match: { x: 1 } }]);

        expect(serviceProvider.createCollection).to.have.been.calledWith(
          database._name,
          'newcoll',
          {
            viewOn: 'sourcecoll',
            pipeline: [{ $match: { x: 1 } }]
          }
        );
      });
      it('calls serviceProvider.createCollection on the database with options', async() => {
        await database.createView('newcoll', 'sourcecoll', [], { collation: { x: 1 } } as any);

        expect(serviceProvider.createCollection).to.have.been.calledWith(
          database._name,
          'newcoll',
          {
            viewOn: 'sourcecoll',
            pipeline: [],
            collation: { x: 1 }
          }
        );
      });

      it('returns whatever serviceProvider.createCollection returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.createCollection.resolves(expectedResult);
        const result = await database.createView('newcoll', 'sourcecoll', []);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.createCollection rejects', async() => {
        const expectedError = new Error();
        serviceProvider.createCollection.rejects(expectedError);
        const catchedError = await database.createView('newcoll', 'sourcecoll', [])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('createRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields', async() => {
        await database.createRole({
          role: 'anna',
          roles: [ { role: 'clusterAdmin', db: 'db1' }, { role: 'hostManager' }],
          privileges: [ 'remove', 'update', 'find' ],
          authenticationRestrictions: [ 1, 2 ]
        }, { w: 2 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            createRole: 'anna',
            roles: [ { role: 'clusterAdmin', db: 'db1' }, { role: 'hostManager' }],
            privileges: [ 'remove', 'update', 'find' ],
            authenticationRestrictions: [ 1, 2 ],
            writeConcern: { w: 2 }
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database without extra fields', async() => {
        await database.createRole({
          role: 'anna',
          roles: [],
          privileges: []
        }, { w: 3 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            createRole: 'anna',
            roles: [],
            privileges: [],
            writeConcern: { w: 3 }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.createRole({
          role: 'anna',
          roles: [],
          privileges: []
        }, { w: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.createRole({
          role: 'anna',
          roles: [],
          privileges: []
        }, { w: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if createRole is specified', async() => {
        const catchedError = await database.createRole({
          createRole: 1,
          role: 'anna',
          roles: [],
          privileges: []
        }, { w: 1 }).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });
    });
    describe('updateRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with no extra fields', async() => {
        await database.updateRole('anna', {
          roles: []
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateRole: 'anna',
            roles: [],
            writeConcern: { w: 1 }
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with extra fields and passwordDigestor=server', async() => {
        await database.updateRole('anna', {
          roles: [ { role: 'dbAdmin', db: 'db1' }],
          privileges: [ 'find' ],
          authenticationRestrictions: [ 1 ]
        }, { w: 1 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            updateRole: 'anna',
            roles: [ { role: 'dbAdmin', db: 'db1' }],
            privileges: [ 'find' ],
            authenticationRestrictions: [ 1 ],
            writeConcern: { w: 1 }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.updateRole('anna', {
          role: 'anna',
          privileges: [],
          roles: []
        }, { w: 1 });
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.updateRole('anna', {
          role: 'anna',
          privileges: [],
          roles: []
        }, { w: 1 })
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('dropRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.dropRole('anna');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { dropRole: 'anna' }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.dropRole('anna');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.dropRole('anna')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('dropAllRoles', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.dropAllRoles();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { dropAllRolesFromDatabase: 1 }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.dropAllRoles();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.dropAllRoles()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('grantRolesToRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.grantRolesToRole('anna', [ 'role1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { grantRolesToRole: 'anna', roles: ['role1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.grantRolesToRole('anna', [ 'role1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.grantRolesToRole('anna', [ 'role1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('revokeRolesFromRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.revokeRolesFromRole('anna', [ 'role1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { revokeRolesFromRole: 'anna', roles: ['role1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.revokeRolesFromRole('anna', [ 'role1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.revokeRolesFromRole('anna', [ 'role1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('grantPrivilegesToRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.grantPrivilegesToRole('anna', [ 'privilege1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { grantPrivilegesToRole: 'anna', privileges: ['privilege1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.grantPrivilegesToRole('anna', [ 'privilege1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.grantPrivilegesToRole('anna', [ 'privilege1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('revokePrivilegesFromRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        await database.revokePrivilegesFromRole('anna', [ 'privilege1' ]);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { revokePrivilegesFromRole: 'anna', privileges: ['privilege1'] }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.revokePrivilegesFromRole('anna', [ 'privilege1' ]);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.revokePrivilegesFromRole('anna', [ 'privilege1' ])
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getRole', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        const expectedResult = { ok: 1, roles: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.getRole('anna');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { rolesInfo: { role: 'anna', db: 'db1' } }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        const expectedResult = { ok: 1, roles: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.getRole('anna', {
          showBuiltinRoles: false,
          showPrivileges: true
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            rolesInfo: { role: 'anna', db: 'db1' },
            showBuiltinRoles: false,
            showPrivileges: true
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1, roles: [ { role: 'anna' }] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getRole('anna');
        expect(result).to.deep.equal({ role: 'anna' });
      });
      it('returns whatever serviceProvider.runCommandWithCheck returns if role does not exist', async() => {
        const expectedResult = { ok: 1, roles: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getRole('anna');
        expect(result).to.deep.equal(null);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getRole('anna')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getRoles', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.getRoles();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          { rolesInfo: 1 }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.getRoles({
          showCredentials: false,
          filter: {}
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            rolesInfo: 1,
            showCredentials: false,
            filter: {}
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getRoles();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getRoles()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('currentOp', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.currentOp();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          { currentOp: 1 }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.currentOp({
          $ownOps: true,
          $all: true,
          filter: 1
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            currentOp: 1,
            $ownOps: true,
            $all: true,
            filter: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.currentOp();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.currentOp()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('killOp', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.killOp(123);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            killOp: 1, op: 123
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.killOp(123);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.killOp(123)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('shutdownServer', () => {
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.shutdownServer();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          { shutdown: 1 }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.shutdownServer({
          force: true,
          timeoutSecs: 1
        });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            shutdown: 1,
            force: true,
            timeoutSecs: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.shutdownServer();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.shutdownServer()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('fsyncLock', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.fsyncLock();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            fsync: 1, lock: true
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.fsyncLock();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.fsyncLock()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('fsyncUnlock', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.fsyncUnlock();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            fsyncUnlock: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.fsyncUnlock();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.fsyncUnlock()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('version', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        const expectedResult = { ok: 1, version: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.version();
        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            buildInfo: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1, version: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.version();
        expect(result).to.deep.equal(1);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.version()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if runCommand returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const catchedError = await database.version().catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshRuntimeError);
        expect(catchedError.code).to.equal(CommonErrors.CommandFailed);
      });
    });

    describe('serverBits', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        const expectedResult = { ok: 1, bits: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.serverBits();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            buildInfo: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, bits: 3 });
        const result = await database.serverBits();
        expect(result).to.deep.equal(3);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.serverBits()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if runCommand returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const catchedError = await database.serverBits().catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshRuntimeError);
        expect(catchedError.code).to.equal(CommonErrors.CommandFailed);
      });
    });

    describe('isMaster', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.isMaster();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            isMaster: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.isMaster();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.isMaster()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('serverBuildInfo', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.serverBuildInfo();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            buildInfo: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.serverBuildInfo();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.serverBuildInfo()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('stats', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.stats(1);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            dbStats: 1,
            scale: 1
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.stats();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            dbStats: 1,
            scale: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.stats(1);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.stats(1)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('serverStatus', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.serverStatus({ repl: 0, metrics: 0, locks: 0 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            serverStatus: 1, repl: 0, metrics: 0, locks: 0
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database without options', async() => {
        await database.serverStatus();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            serverStatus: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.serverStatus();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.serverStatus()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('hostInfo', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.hostInfo();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            hostInfo: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.hostInfo();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.hostInfo()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('serverCmdLineOpts', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        await database.serverCmdLineOpts();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            getCmdLineOpts: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.serverCmdLineOpts();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.serverCmdLineOpts()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('printCollectionStats', () => {
      it('throws if scale is invalid', async() => {
        const error = await database.printCollectionStats(-1).catch(e => e);
        expect(error).to.be.instanceOf(MongoshInvalidInputError);
        expect(error.code).to.equal(CommonErrors.InvalidArgument);
      });
      it('returns an object with per-collection stats', async() => {
        serviceProvider.listCollections.resolves([{ name: 'abc' }]);
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, totalSize: 1000 });
        const result = await database.printCollectionStats(1);
        expect(result.value.abc).to.deep.equal({ ok: 1, totalSize: 1000 });
      });
    });

    describe('getFreeMonitoringStatus', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.getFreeMonitoringStatus();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            getFreeMonitoringStatus: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getFreeMonitoringStatus();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getFreeMonitoringStatus()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('disableFreeMonitoring', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.disableFreeMonitoring();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            setFreeMonitoring: 1,
            action: 'disable'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.disableFreeMonitoring();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.disableFreeMonitoring()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('enableFreeMonitoring', () => {
      it('throws if serviceProvider isMaster is false', async() => {
        serviceProvider.runCommand.resolves({ ismaster: false });
        const catchedError = await database.enableFreeMonitoring()
          .catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.code).to.equal(CommonErrors.InvalidOperation);
      });

      it('calls serviceProvider.runCommand on the database', async() => {
        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        await database.enableFreeMonitoring();

        expect(serviceProvider.runCommand).to.have.been.calledWith(
          ADMIN_DB,
          {
            setFreeMonitoring: 1,
            action: 'enable'
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns if enabled', async() => {
        const expectedFMState = { ok: 1, state: 'enabled' };

        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        serviceProvider.runCommand.onCall(2).resolves(expectedFMState);
        const result = await database.enableFreeMonitoring();
        expect(result).to.deep.equal(expectedFMState);
      });
      it('returns warning if not enabled', async() => {
        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        serviceProvider.runCommand.onCall(2).resolves({ ok: 1, enabled: false });
        serviceProvider.runCommand.onCall(3).resolves({ cloudFreeMonitoringEndpointURL: 'URL' });
        const result = await database.enableFreeMonitoring();
        expect(result).to.include('URL');
      });

      it('returns warning if returns ok: 0 with auth error', async() => {
        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        serviceProvider.runCommand.onCall(2).resolves({ ok: 0, codeName: 'Unauthorized' });
        const result = await database.enableFreeMonitoring();
        expect(result).to.be.a('string');
        expect(result).to.include('privilege');
      });
      it('returns warning if throws with auth error', async() => {
        const expectedError = new Error();
        (expectedError as any).codeName = 'Unauthorized';
        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        serviceProvider.runCommand.onCall(2).rejects(expectedError);
        const result = await database.enableFreeMonitoring();
        expect(result).to.be.a('string');
        expect(result).to.include('privilege');
      });

      it('throws if throws with non-auth error', async() => {
        serviceProvider.runCommand.onCall(0).resolves({ ismaster: true });
        serviceProvider.runCommand.onCall(1).resolves({ ok: 1 });
        serviceProvider.runCommand.onCall(2).rejects(new Error());

        const error = await database.enableFreeMonitoring().catch(e => e);
        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.code).to.equal(CommonErrors.CommandFailed);
      });

      it('throws if serviceProvider.runCommand rejects without auth error', async() => {
        const expectedError = new Error();
        serviceProvider.runCommand.rejects(expectedError);
        const catchedError = await database.enableFreeMonitoring()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('getProfilingStatus', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.getProfilingStatus();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            profile: -1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getProfilingStatus();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getProfilingStatus()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('setProfilingLevel', () => {
      it('calls serviceProvider.runCommandWithCheck on the database no options', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.setProfilingLevel(1);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            profile: 1
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database w number options', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.setProfilingLevel(1, 100);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            profile: 1,
            slowms: 100
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck on the database w doc options', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.setProfilingLevel(1, { slowms: 100, sampleRate: 0.5 });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            profile: 1,
            slowms: 100,
            sampleRate: 0.5
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.setProfilingLevel(1);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.setProfilingLevel(1)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if profiling level is invalid', async() => {
        const catchedError = await database.setProfilingLevel(4).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });
    });

    describe('setLogLevel', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with no component', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.setLogLevel(2);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            setParameter: 1,
            logComponentVerbosity: { verbosity: 2 }
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck on the database with string component', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
        await database.setLogLevel(2, 'a.b.c');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            setParameter: 1,
            logComponentVerbosity: { a: { b: { c: { verbosity: 2 } } } }
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.setLogLevel(2);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.setLogLevel(2)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });

      it('throws if component is given but not a string', async() => {
        const catchedError = await database.setLogLevel(1, {}).catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });
    });

    describe('getLogComponents', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        serviceProvider.runCommandWithCheck.resolves({ ok: 1, logComponentVerbosity: 1 });
        await database.getLogComponents();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            getParameter: 1,
            logComponentVerbosity: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1, logComponentVerbosity: 100 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.getLogComponents();
        expect(result).to.deep.equal(100);
      });

      it('throws if serviceProvider.runCommandWithCheck returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const catchedError = await database.getLogComponents().catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshRuntimeError);
        expect(catchedError.code).to.equal(CommonErrors.CommandFailed);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.getLogComponents()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('cloneDatabase, cloneCollection, copyDatabase', () => {
      it('throws a helpful exception regarding their removal', () => {
        ['cloneDatabase', 'cloneCollection', 'copyDatabase'].forEach((method) => {
          try {
            database[method]();
            expect.fail('expected error');
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshDeprecatedError);
            expect(e.message).to.contain(`\`${method}()\` was removed because it was deprecated in MongoDB 4.0`);
          }
        });
      });
    });

    describe('commandHelp', () => {
      it('calls serviceProvider.runCommandWithCheck on the database with options', async() => {
        const expectedResult = { ok: 1, help: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.commandHelp('listDatabases');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            listDatabases: 1,
            help: true
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck().help returns', async() => {
        const expectedResult = { ok: 1, help: 'help string' };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.commandHelp('listDatabases');
        expect(result).to.deep.equal('help string');
      });

      it('throws if serviceProvider.runCommandWithCheck returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const catchedError = await database.commandHelp('listDatabases').catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshRuntimeError);
        expect(catchedError.code).to.equal(CommonErrors.CommandFailed);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.commandHelp('listDatabases')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });

    describe('listCommands', () => {
      it('calls serviceProvider.runCommandWithCheck on the database', async() => {
        const expectedResult = { ok: 1, commands: [] };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await database.listCommands();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          database._name,
          {
            listCommands: 1
          }
        );
      });

      it('returns ListCommandsResult', async() => {
        const expectedResult = { ok: 1, commands: { c1: { requiresAuth: false, slaveOk: true, adminOnly: false, help: 'help string' } } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await database.listCommands();
        expect(result.value).to.deep.equal(expectedResult.commands);
        expect(result.type).to.equal('ListCommandsResult');
      });

      it('throws if serviceProvider.runCommandWithCheck returns undefined', async() => {
        serviceProvider.runCommandWithCheck.resolves(undefined);
        const catchedError = await database.listCommands().catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshRuntimeError);
        expect(catchedError.code).to.equal(CommonErrors.CommandFailed);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await database.listCommands()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('getLastError', () => {
      it('calls serviceProvider.runCommand on the database with options', async() => {
        await database.getLastError(1, 100);
        expect(serviceProvider.runCommand).to.have.been.calledWith(
          database._name,
          {
            getlasterror: 1,
            w: 1,
            wtimeout: 100
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1, err: 'message' };
        serviceProvider.runCommand.resolves(expectedResult);
        const result = await database.getLastError();
        expect(result).to.deep.equal('message');
      });

      it('returns what serviceProvider.runCommand rejects', async() => {
        const expectedError = { err: 'message' };
        serviceProvider.runCommand.rejects(expectedError);
        const result = await database.getLastError();
        expect(result).to.deep.equal('message');
      });
    });
    describe('getLastErrorObj', () => {
      it('calls serviceProvider.runCommand on the database with options', async() => {
        await database.getLastErrorObj(1, 100, false);

        expect(serviceProvider.runCommand).to.have.been.calledWith(
          database._name,
          {
            getlasterror: 1,
            w: 1,
            wtimeout: 100,
            j: false
          }
        );
      });

      it('returns whatever serviceProvider.runCommand returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommand.resolves(expectedResult);
        const result = await database.getLastErrorObj();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommand rejects', async() => {
        const expectedError = { err: 'message' };
        serviceProvider.runCommand.rejects(expectedError);
        const result = await database.getLastErrorObj();
        expect(result).to.deep.equal(expectedError);
      });
    });
    describe('watch', () => {
      it('calls serviceProvider.watch when given no args', () => {
        database.watch();
        expect(serviceProvider.watch).to.have.been.calledWith([], {}, {}, database._name);
      });
      it('calls serviceProvider.watch when given pipeline arg', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        database.watch(pipeline);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, {}, {}, database._name);
      });
      it('calls serviceProvider.watch when given no args', () => {
        const pipeline = [{ $match: { operationType: 'insertOne' } }];
        const ops = { batchSize: 1 };
        database.watch(pipeline, ops);
        expect(serviceProvider.watch).to.have.been.calledWith(pipeline, ops, {}, database._name);
      });

      it('returns whatever serviceProvider.watch returns', () => {
        const expectedResult = { ChangeStreamCursor: 1 } as any;
        serviceProvider.watch.returns(expectedResult);
        const result = database.watch();
        expect(result).to.deep.equal(new ChangeStreamCursor(expectedResult, database._name, mongo));
        expect(database._mongo._internalState.currentCursor).to.equal(result);
      });

      it('throws if serviceProvider.watch throws', () => {
        const expectedError = new Error();
        serviceProvider.watch.throws(expectedError);
        try {
          database.watch();
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
    let database: Database;
    let internalSession: StubbedInstance<ServiceProviderSession>;
    const exceptions = {
      getCollectionNames: { m: 'listCollections' },
      getCollectionInfos: { m: 'listCollections' },
      aggregate: { m: 'aggregateDb' },
      dropDatabase: { m: 'dropDatabase', i: 1 },
      createCollection: { m: 'createCollection', a: ['coll'] },
      createView: { m: 'createCollection', a: ['coll', 'source', []] },
      changeUserPassword: { a: ['username', 'pass'] },
      createUser: { a: [{ user: 'a', pwd: 'p', roles: [] }] },
      updateUser: { a: ['username', { roles: [] }] },
      createRole: { a: [{ role: 'a', privileges: [], roles: [] }] },
      updateRole: { a: ['role', {}] },
      getUser: { a: ['username'] },
      getRole: { a: ['rolename'] },
      dropUser: { a: ['username'] },
      dropRole: { a: ['role'] },
      grantRolesToUser: { a: ['username', []] },
      revokeRolesFromUser: { a: ['username', []] },
      grantRolesToRole: { a: ['rolename', []] },
      revokeRolesFromRole: { a: ['rolename', []] },
      grantPrivilegesToRole: { a: ['rolename', []] },
      revokePrivilegesFromRole: { a: ['rolename', []] },
      setLogLevel: { a: [1] },
      setProfilingLevel: { a: [1] },
      killOp: { a: [1] }
    };
    const ignore = [
      'auth',
      'enableFreeMonitoring',
      'cloneDatabase',
      'cloneCollection',
      'copyDatabase',
      'getReplicationInfo',
    ];
    const args = [ {}, {}, {} ];
    beforeEach(() => {
      const bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      internalSession = stubInterface<ServiceProviderSession>();
      serviceProvider.startSession.returns(internalSession);
      serviceProvider.runCommandWithCheck.resolves({ ok: 1, version: 1, bits: 1, commands: 1, users: [], roles: [], logComponentVerbosity: 1 });
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.listCollections.resolves([]);
      const internalState = new ShellInternalState(serviceProvider, bus);
      const mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      const session = mongo.startSession();
      database = session.getDatabase('db1');
    });
    it('all commands that use runCommandWithCheck', async() => {
      for (const method of Object.getOwnPropertyNames(Database.prototype).filter(
        k => !ignore.includes(k) && !Object.keys(exceptions).includes(k)
      )) {
        if (!method.startsWith('_') &&
            !method.startsWith('print') &&
            database[method].returnsPromise) {
          try {
            await database[method](...args);
          } catch (e) {
            expect.fail(`${method} failed, error thrown ${e.message}`);
          }
          expect(serviceProvider.runCommandWithCheck.called).to.be.true;
          expect((serviceProvider.runCommandWithCheck.getCall(-1).args[2] as any).session).to.equal(internalSession);
        }
      }
    });
    it('all commands that use other methods', async() => {
      for (const method of Object.keys(exceptions)) {
        const customA = exceptions[method].a || args;
        const customM = exceptions[method].m || 'runCommandWithCheck';
        const customI = exceptions[method].i || 2;
        try {
          await database[method](...customA);
        } catch (e) {
          expect.fail(`${method} failed, error thrown ${e.message}`);
        }
        expect(serviceProvider[customM].called).to.equal(true, `expecting ${customM} to be called but it was not`);
        expect((serviceProvider[customM].getCall(-1).args[customI] as any).session).to.equal(internalSession);
      }
    });
  });
});

