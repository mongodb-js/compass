import { assertArgsDefinedType, dataFormat, getPrintableShardStatus } from './helpers';
import { Database, Mongo, ShellInternalState } from './index';
import constructShellBson from './shell-bson';
import { ServiceProvider, bson } from '@mongosh/service-provider-core';
import { CliServiceProvider } from '../../service-provider-server'; // avoid cyclic dep just for test
import { startTestServer } from '../../../testing/integration-testing-hooks';
import { makeFakeConfigDatabase } from '../../../testing/shard-test-fake-data';
import sinon from 'ts-sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

const fakeConfigDb = makeFakeConfigDatabase(constructShellBson(bson, sinon.stub()));

describe('dataFormat', () => {
  it('formats byte amounts', () => {
    expect(dataFormat()).to.equal('0B');
    expect(dataFormat(10)).to.equal('10B');
    expect(dataFormat(4096)).to.equal('4KiB');
    expect(dataFormat(4096 * 4096)).to.equal('16MiB');
    expect(dataFormat(4096 * 4096 * 4096)).to.equal('64GiB');
    expect(dataFormat(4096 * 4096 * 4096 * 1000)).to.equal('64000GiB');
  });
});

describe('assertArgsDefinedType', () => {
  it('allows to specify an argument must be defined', () => {
    try {
      assertArgsDefinedType([1, undefined], [true, true], 'helper.test');
    } catch (e) {
      expect(e.message).to.contain('Missing required argument at position 1');
      expect(e.message).to.contain('helper.test');
      return;
    }
    expect.fail('Expected error');
  });
  it('allows to specify a single argument type', () => {
    [null, 2, {}].forEach(value => {
      try {
        assertArgsDefinedType([1, value], [true, 'string'], 'helper.test');
      } catch (e) {
        expect(e.message).to.contain('Argument at position 1 must be of type string');
        expect(e.message).to.contain('helper.test');
        return;
      }
      expect.fail('Expected error');
    });
    expect(() => assertArgsDefinedType([1, 'test'], [true, 'string'])).to.not.throw;
  });
  it('allows to specify multiple argument types', () => {
    [null, {}].forEach(value => {
      try {
        assertArgsDefinedType([1, value], [true, ['number', 'string']]);
      } catch (e) {
        return expect(e.message).to.contain('Argument at position 1 must be of type number or string');
      }
      expect.fail('Expected error');
    });
    expect(() => assertArgsDefinedType([1, 'test'], [true, ['number', 'string']])).to.not.throw;
    expect(() => assertArgsDefinedType([1, 2], [true, ['number', 'string']])).to.not.throw;
  });
  it('allows to specify an optional argument with type', () => {
    expect(() => assertArgsDefinedType([1, undefined], [true, [undefined, 'string']])).to.not.throw;
    expect(() => assertArgsDefinedType([1, 'test'], [true, [undefined, 'string']])).to.not.throw;
    try {
      assertArgsDefinedType([1, 2], [true, [undefined, 'string']]);
    } catch (e) {
      return expect(e.message).to.contain('Argument at position 1 must be of type string');
    }
    expect.fail('Expected error');
  });
});

describe('getPrintableShardStatus', () => {
  const testServer = startTestServer('shared');

  let mongo: Mongo;
  let database: Database;
  let configDatabase: Database;
  let serviceProvider: ServiceProvider;
  let inBalancerRound = false;

  beforeEach(async() => {
    serviceProvider = await CliServiceProvider.connect(await testServer.connectionString());
    mongo = new Mongo(new ShellInternalState(serviceProvider), undefined, undefined, undefined, serviceProvider);
    database = new Database(mongo, 'db1');
    const origGetSiblingDB = database.getSiblingDB;
    database.getSiblingDB = (dbname) => {
      if (dbname === 'config') {
        dbname = 'config_test';
      }
      return origGetSiblingDB.call(database, dbname);
    };
    configDatabase = database.getSiblingDB('config');
    expect(configDatabase.getName()).to.equal('config_test');

    const origRunCommandWithCheck = serviceProvider.runCommandWithCheck;
    serviceProvider.runCommandWithCheck = async(db, cmd) => {
      if (db === 'admin' && cmd.isMaster) {
        return { ok: 1, msg: 'isdbgrid' };
      }
      if (db === 'admin' && cmd.balancerStatus) {
        return { ok: 1, inBalancerRound };
      }
      return origRunCommandWithCheck.call(serviceProvider, db, cmd);
    };

    await Promise.all(Object.entries(fakeConfigDb).map(async([coll, contents]) => {
      await configDatabase.getCollection(coll).insertMany(contents as any);
    }));
    // The printing method depends on data + the current date, so we provide
    // a fake Date implementation here.
    class FakeDate extends Date {
      constructor(t?: any) { super(t || '2020-12-09T12:59:11.912Z'); }
      static now() { return new FakeDate().getTime(); }
    }
    sinon.replace(global, 'Date', FakeDate as typeof Date);
  });

  afterEach(async() => {
    sinon.restore();
    await configDatabase.dropDatabase();
    await serviceProvider.close(true);
  });

  it('returns an object with sharding information', async() => {
    const status = await getPrintableShardStatus(database, false);
    expect(status.shardingVersion.currentVersion).to.be.a('number');
    expect(status.shards.map(({ host }) => host)).to.include('shard01/localhost:27018,localhost:27019,localhost:27020');
    expect(status['most recently active mongoses']).to.have.lengthOf(1);
    expect(status.autosplit['Currently enabled']).to.equal('yes');
    expect(status.balancer['Currently enabled']).to.equal('yes');
    expect(status.balancer['Failed balancer rounds in last 5 attempts']).to.equal(0);
    expect(status.balancer['Migration Results for the last 24 hours']).to.equal('No recent migrations');
    expect(status.databases).to.have.lengthOf(1);
    expect(status.databases[0].database._id).to.equal('config');
  });

  it('returns whether the balancer is currently running', async() => {
    {
      inBalancerRound = true;
      const status = await getPrintableShardStatus(database, true);
      expect(status.balancer['Currently running']).to.equal('yes');
    }

    {
      inBalancerRound = false;
      const status = await getPrintableShardStatus(database, true);
      expect(status.balancer['Currently running']).to.equal('no');
    }
  });

  it('returns an object with verbose sharding information if requested', async() => {
    const status = await getPrintableShardStatus(database, true);
    expect(status['most recently active mongoses'][0].up).to.be.a('number');
    expect(status['most recently active mongoses'][0].waiting).to.be.a('boolean');
  });

  it('returns active balancer window information', async() => {
    await configDatabase.getCollection('settings').insertOne({
      _id: 'balancer',
      activeWindow: { start: '00:00', stop: '23:59' }
    });
    const status = await getPrintableShardStatus(database, false);
    expect(status.balancer['Balancer active window is set between'])
      .to.equal('00:00 and 23:59 server local time');
  });

  it('reports actionlog error information', async() => {
    await configDatabase.getCollection('actionlog').insertOne({
      details: {
        errorOccured: true,
        errmsg: 'Some error',
      },
      time: new Date('2020-12-07T12:58:53.579Z'),
      what: 'balancer.round',
      ns: ''
    });
    const status = await getPrintableShardStatus(database, false);
    expect(status.balancer['Failed balancer rounds in last 5 attempts']).to.equal(1);
    expect(status.balancer['Last reported error']).to.equal('Some error');
  });

  it('reports currently active migrations', async() => {
    await configDatabase.getCollection('locks').insertOne({
      _id: 'asdf',
      state: 2,
      ts: new bson.ObjectId('5fce116c579db766a198a176'),
      when: new Date('2020-12-07T11:26:36.803Z'),
    });
    const status = await getPrintableShardStatus(database, false);
    expect(status.balancer['Collections with active migrations']).to.have.lengthOf(1);
    expect(status.balancer['Collections with active migrations'].join('')).to.include('asdf');
  });

  it('reports successful migrations', async() => {
    await configDatabase.getCollection('changelog').insertOne({
      time: new Date('2020-12-08T13:26:06.357Z'),
      what: 'moveChunk.from',
      details: { from: 'shard0', to: 'shard1', note: 'success' }
    });
    const status = await getPrintableShardStatus(database, false);
    expect(status.balancer['Migration Results for the last 24 hours'])
      .to.deep.equal({ 1: 'Success' });
  });

  it('reports failed migrations', async() => {
    await configDatabase.getCollection('changelog').insertOne({
      time: new Date('2020-12-08T13:26:07.357Z'),
      what: 'moveChunk.from',
      details: { from: 'shard0', to: 'shard1', errmsg: 'oopsie' }
    });
    const status = await getPrintableShardStatus(database, false);

    expect(status.balancer['Migration Results for the last 24 hours'])
      .to.deep.equal({ 1: "Failed with error 'oopsie', from shard0 to shard1" });
  });

  it('fails when config.version is empty', async() => {
    await configDatabase.getCollection('version').drop();
    try {
      await getPrintableShardStatus(database, false);
    } catch (err) {
      expect(err.name).to.equal('MongoshInvalidInputError');
      return;
    }
    expect.fail('missed exception');
  });
});
