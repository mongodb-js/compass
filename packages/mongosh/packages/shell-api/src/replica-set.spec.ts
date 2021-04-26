import { CommonErrors, MongoshInvalidInputError, MongoshRuntimeError } from '@mongosh/errors';
import { bson, FindCursor as ServiceProviderCursor, ServiceProvider } from '@mongosh/service-provider-core';
import chai, { expect } from 'chai';
import { EventEmitter } from 'events';
import sinonChai from 'sinon-chai';
import { StubbedInstance, stubInterface } from 'ts-sinon';
import { ensureMaster } from '../../../testing/helpers';
import { MongodSetup, skipIfServerVersion, startTestCluster } from '../../../testing/integration-testing-hooks';
import { CliServiceProvider } from '../../service-provider-server';
import Database from './database';
import {
  ADMIN_DB,
  ALL_PLATFORMS,
  ALL_SERVER_VERSIONS,
  ALL_TOPOLOGIES
} from './enums';
import { signatures, toShellResult } from './index';
import Mongo from './mongo';
import ReplicaSet from './replica-set';
import ShellInternalState from './shell-internal-state';
chai.use(sinonChai);

describe('ReplicaSet', () => {
  describe('help', () => {
    const apiClass: any = new ReplicaSet({} as any);

    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });

    it('calls help function for methods', async() => {
      expect((await toShellResult(apiClass.initiate.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.initiate.help)).type).to.equal('Help');
    });
  });

  describe('signatures', () => {
    it('type', () => {
      expect(signatures.ReplicaSet.type).to.equal('ReplicaSet');
    });

    it('attributes', () => {
      expect(signatures.ReplicaSet.attributes.initiate).to.deep.equal({
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
      expect(signatures.ReplicaSet.hasAsyncChild).to.equal(true);
    });
  });

  describe('unit', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let rs: ReplicaSet;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;
    let db: Database;

    const findResolvesWith = (expectedResult): void => {
      const findCursor = stubInterface<ServiceProviderCursor>();
      findCursor.tryNext.resolves(expectedResult);
      serviceProvider.find.returns(findCursor);
    };

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.runCommand.resolves({ ok: 1 });
      serviceProvider.runCommandWithCheck.resolves({ ok: 1 });
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      db = new Database(mongo, 'testdb');
      rs = new ReplicaSet(db);
    });

    describe('initiate', () => {
      const configDoc = {
        _id: 'my_replica_set',
        members: [
          { _id: 0, host: 'rs1.example.net:27017' },
          { _id: 1, host: 'rs2.example.net:27017' },
          { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
        ]
      };

      it('calls serviceProvider.runCommandWithCheck without optional arg', async() => {
        await rs.initiate();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetInitiate: {}
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await rs.initiate(configDoc);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetInitiate: configDoc
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.initiate(configDoc);

        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const caughtError = await rs.initiate(configDoc)
          .catch(e => e);

        expect(caughtError).to.equal(expectedError);
      });
    });

    describe('config', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        await rs.config();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetGetConfig: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        // not using the full object for expected result, as we should check this in an e2e test.
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.config();

        expect(result).to.deep.equal(expectedResult.config);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedResult = { config: { version: 1, members: [], settings: {} } };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const caughtError = await rs.config()
          .catch(e => e);

        expect(caughtError).to.equal(expectedError);
      });

      it('calls find if serviceProvider.runCommandWithCheck rejects with command not found', async() => {
        const expectedError = new Error() as any;
        expectedError.codeName = 'CommandNotFound';
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const expectedResult = { res: true };
        const findCursor = stubInterface<ServiceProviderCursor>();
        findCursor.tryNext.resolves(expectedResult);
        serviceProvider.find.returns(findCursor);

        const conf = await rs.config();
        expect(serviceProvider.find).to.have.been.calledWith(
          'local', 'system.replset', {}, {}
        );
        expect(conf).to.deep.equal(expectedResult);
      });
    });

    describe('reconfig', () => {
      const configDoc = {
        _id: 'my_replica_set',
        members: [
          { _id: 0, host: 'rs1.example.net:27017' },
          { _id: 1, host: 'rs2.example.net:27017' },
          { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
        ]
      };

      it('calls serviceProvider.runCommandWithCheck without optional arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ config: { version: 1, protocolVersion: 1 } });
        await rs.reconfig(configDoc);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              _id: 'my_replica_set',
              members: [
                { _id: 0, host: 'rs1.example.net:27017' },
                { _id: 1, host: 'rs2.example.net:27017' },
                { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
              ],
              version: 2,
              protocolVersion: 1
            }
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        serviceProvider.runCommandWithCheck.resolves({ config: 1, protocolVersion: 1 });
        await rs.reconfig(configDoc, { force: true });

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              _id: 'my_replica_set',
              members: [
                { _id: 0, host: 'rs1.example.net:27017' },
                { _id: 1, host: 'rs2.example.net:27017' },
                { _id: 2, host: 'rs3.example.net', arbiterOnly: true },
              ],
              version: 1,
              protocolVersion: 1
            },
            force: true
          }
        );
      });
    });
    describe('status', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.status();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetGetStatus: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.status();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.status()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('isMaster', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.isMaster();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            isMaster: 1
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.isMaster();
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.isMaster()
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('add', () => {
      it('calls serviceProvider.runCommandWithCheck with no arb and string hostport', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = 'localhost:27017';
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.add(hostname);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              version: 2,
              members: [
                { _id: 0 },
                { _id: 1 },
                { _id: 2, host: hostname }
              ]
            }
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });
      it('calls serviceProvider.runCommandWithCheck with arb and string hostport', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = 'localhost:27017';
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.add(hostname, true);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              version: 2,
              members: [
                { _id: 0 },
                { _id: 1 },
                { _id: 2, arbiterOnly: true, host: hostname }
              ]
            }
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });

      it('calls serviceProvider.runCommandWithCheck with no arb and obj hostport', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = {
          host: 'localhost:27017'
        };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.add(hostname);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              version: 2,
              members: [
                { _id: 0 },
                { _id: 1 },
                { _id: 2, host: hostname.host }
              ]
            }
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });

      it('calls serviceProvider.runCommandWithCheck with no arb and obj hostport, uses _id', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = {
          host: 'localhost:27017', _id: 10
        };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.add(hostname);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              version: 2,
              members: [
                { _id: 0 },
                { _id: 1 },
                hostname
              ]
            }
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws with arb and object hostport', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = { host: 'localhost:27017' };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);

        const error = await rs.add(hostname, true).catch(e => e);
        expect(error).to.be.instanceOf(MongoshInvalidInputError);
        expect(error.code).to.equal(CommonErrors.InvalidArgument);
      });
      it('throws if local.system.replset.count <= 1', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        const hostname = { host: 'localhost:27017' };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(2);
        const error = await rs.add(hostname, true).catch(e => e);
        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.code).to.equal(CommonErrors.CommandFailed);
      });
      it('throws if local.system.replset.findOne has no docs', async() => {
        const hostname = { host: 'localhost:27017' };
        findResolvesWith(null);
        serviceProvider.countDocuments.resolves(1);
        const error = await rs.add(hostname, true).catch(e => e);
        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.code).to.equal(CommonErrors.CommandFailed);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const configDoc = { version: 1, members: [{ _id: 0 }, { _id: 1 }] };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.add('hostname')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('remove', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        const configDoc = { version: 1, members: [{ _id: 0, host: 'localhost:0' }, { _id: 1, host: 'localhost:1' }] };
        const hostname = 'localhost:0';
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.remove(hostname);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetReconfig: {
              version: 2,
              members: [
                { _id: 1, host: 'localhost:1' }
              ]
            }
          }
        );
        expect(result).to.deep.equal(expectedResult);
      });
      it('throws with object hostport', async() => {
        const hostname = { host: 'localhost:27017' } as any;
        const error = await rs.remove(hostname).catch(e => e);
        expect(error.name).to.equal('MongoshInvalidInputError');
      });
      it('throws if local.system.replset.count <= 1', async() => {
        const configDoc = { version: 1, members: [{ _id: 0, host: 'localhost:0' }, { _id: 1, host: 'lcoalhost:1' }] };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(0);
        const error = await rs.remove('').catch(e => e);
        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.code).to.equal(CommonErrors.CommandFailed);
      });
      it('throws if local.system.replset.count <= 1', async() => {
        findResolvesWith(null);
        serviceProvider.countDocuments.resolves(1);
        const error = await rs.remove('').catch(e => e);
        expect(error).to.be.instanceOf(MongoshRuntimeError);
        expect(error.code).to.equal(CommonErrors.CommandFailed);
      });
      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const configDoc = { version: 1, members: [{ _id: 0, host: 'localhost:0' }, { _id: 1, host: 'localhost:1' }] };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.remove('localhost:1')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
      it('throws if hostname not in members', async() => {
        const configDoc = { version: 1, members: [{ _id: 0, host: 'localhost:0' }, { _id: 1, host: 'lcoalhost:1' }] };
        findResolvesWith(configDoc);
        serviceProvider.countDocuments.resolves(1);
        const catchedError = await rs.remove('localhost:2')
          .catch(e => e);
        expect(catchedError).to.be.instanceOf(MongoshInvalidInputError);
        expect(catchedError.code).to.equal(CommonErrors.InvalidArgument);
      });
    });
    describe('freeze', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.freeze(100);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetFreeze: 100
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.freeze(100);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.freeze(100)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('syncFrom', () => {
      it('calls serviceProvider.runCommandWithCheck', async() => {
        await rs.syncFrom('localhost:27017');

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetSyncFrom: 'localhost:27017'
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.syncFrom('localhost:27017');
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.syncFrom('localhost:27017')
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
    describe('stepDown', () => {
      it('calls serviceProvider.runCommandWithCheck without any arg', async() => {
        await rs.stepDown();

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetStepDown: 60
          }
        );
      });
      it('calls serviceProvider.runCommandWithCheck without second optional arg', async() => {
        await rs.stepDown(10);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetStepDown: 10
          }
        );
      });

      it('calls serviceProvider.runCommandWithCheck with arg', async() => {
        await rs.stepDown(10, 30);

        expect(serviceProvider.runCommandWithCheck).to.have.been.calledWith(
          ADMIN_DB,
          {
            replSetStepDown: 10,
            secondaryCatchUpPeriodSecs: 30
          }
        );
      });

      it('returns whatever serviceProvider.runCommandWithCheck returns', async() => {
        const expectedResult = { ok: 1 };
        serviceProvider.runCommandWithCheck.resolves(expectedResult);
        const result = await rs.stepDown(10);
        expect(result).to.deep.equal(expectedResult);
      });

      it('throws if serviceProvider.runCommandWithCheck rejects', async() => {
        const expectedError = new Error();
        serviceProvider.runCommandWithCheck.rejects(expectedError);
        const catchedError = await rs.stepDown(10)
          .catch(e => e);
        expect(catchedError).to.equal(expectedError);
      });
    });
  });

  describe('integration', () => {
    const replId = 'rs0';

    const [ srv0, srv1, srv2, srv3 ] = startTestCluster(
      ['--single', '--replSet', replId],
      ['--single', '--replSet', replId],
      ['--single', '--replSet', replId],
      ['--single', '--replSet', replId]
    );

    type ReplSetConfig = {
      _id: string;
      members: {_id: number, host: string, priority: number}[];
      protocolVersion?: number;
    };
    let cfg: ReplSetConfig;
    let additionalServer: MongodSetup;
    let serviceProvider: CliServiceProvider;
    let internalState;
    let rs;

    before(async function() {
      this.timeout(100_000);
      cfg = {
        _id: replId,
        members: [
          { _id: 0, host: `${await srv0.hostport()}`, priority: 1 },
          { _id: 1, host: `${await srv1.hostport()}`, priority: 0 },
          { _id: 2, host: `${await srv2.hostport()}`, priority: 0 }
        ]
      };
      additionalServer = srv3;

      serviceProvider = await CliServiceProvider.connect(`${await srv0.connectionString()}?directConnection=true`);
      internalState = new ShellInternalState(serviceProvider);
      rs = new ReplicaSet(internalState.currentDb);

      // check replset uninitialized
      try {
        await rs.status();
        expect.fail();
      } catch (error) {
        expect(error.message).to.include('no replset config');
      }
      const result = await rs.initiate(cfg);
      expect(result.ok).to.equal(1);
      // https://jira.mongodb.org/browse/SERVER-55371
      // expect(result.$clusterTime).to.not.be.undefined;
    });

    beforeEach(async() => {
      await ensureMaster(rs, 1000, await srv0.hostport());
      expect((await rs.conf()).members.length).to.equal(3);
    });

    after(() => {
      return serviceProvider.close(true);
    });

    describe('replica set info', () => {
      it('returns the status', async() => {
        const result = await rs.status();
        expect(result.set).to.equal(replId);
      });
      it('returns the config', async() => {
        const result = await rs.conf();
        expect(result._id).to.equal(replId);
      });
      it('is connected to master', async() => {
        const result = await rs.isMaster();
        expect(result.ismaster).to.be.true;
      });
      it('returns StatsResult for print secondary replication info', async() => {
        const result = await rs.printSecondaryReplicationInfo();
        expect(result.type).to.equal('StatsResult');
      });
      it('returns StatsResult for print replication info', async() => {
        const result = await rs.printReplicationInfo();
        expect(result.type).to.equal('StatsResult');
      });
      it('returns data for db.getReplicationInfo', async() => {
        const result = await rs._database.getReplicationInfo();
        expect(Object.keys(result)).to.include('logSizeMB');
      });
    });
    describe('reconfig', () => {
      it('reconfig with one less secondary', async() => {
        const newcfg: ReplSetConfig = {
          _id: replId,
          members: [ cfg.members[0], cfg.members[1] ]
        };
        const version = (await rs.conf()).version;
        const result = await rs.reconfig(newcfg);
        expect(result.ok).to.equal(1);
        const status = await rs.conf();
        expect(status.members.length).to.equal(2);
        expect(status.version).to.equal(version + 1);
      });
      afterEach(async() => {
        await rs.reconfig(cfg);
        const status = await rs.conf();
        expect(status.members.length).to.equal(3);
      });
    });

    describe('add member', () => {
      // TODO: Fix these tests? They are currently failing with
      // MongoError: Cannot run replSetReconfig because the node is currently updating its configuration
      skipIfServerVersion(srv0, '> 4.4');
      it('adds a regular member to the config', async() => {
        const version = (await rs.conf()).version;
        const result = await rs.add(`${await additionalServer.hostport()}`);
        expect(result.ok).to.equal(1);
        const conf = await rs.conf();
        expect(conf.members.length).to.equal(4);
        expect(conf.version).to.equal(version + 1);
      });
      it('adds a arbiter member to the config', async() => {
        const version = (await rs.conf()).version;
        const result = await rs.addArb(`${await additionalServer.hostport()}`);
        expect(result.ok).to.equal(1);
        const conf = await rs.conf();
        expect(conf.members.length).to.equal(4);
        expect(conf.members[3].arbiterOnly).to.equal(true);
        expect(conf.version).to.equal(version + 1);
      });
      afterEach(async() => {
        await rs.reconfig(cfg);
        const status = await rs.conf();
        expect(status.members.length).to.equal(3);
      });
    });

    describe('remove member', () => {
      // TODO: Fix these tests? They are currently failing with
      // MongoError: Cannot run replSetReconfig because the node is currently updating its configuration
      skipIfServerVersion(srv0, '> 4.4');
      it('removes a member of the config', async() => {
        const version = (await rs.conf()).version;
        const result = await rs.remove(cfg.members[2].host);
        expect(result.ok).to.equal(1);
        const conf = await rs.conf();
        expect(conf.members.length).to.equal(2);
        expect(conf.version).to.equal(version + 1);
      });
      afterEach(async() => {
        await rs.reconfig(cfg);
        const status = await rs.conf();
        expect(status.members.length).to.equal(3);
      });
    });
  });
});
