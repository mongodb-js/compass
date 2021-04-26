import sinon, { SinonStubbedInstance } from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const { expect } = chai;

import { CliServiceProvider } from '@mongosh/service-provider-server';
import { bson } from '@mongosh/service-provider-core';
import { ElectronRuntime } from './electron-runtime';
import { EventEmitter } from 'events';
import { RuntimeEvaluationListener } from '@mongosh/browser-runtime-core';

describe('Electron runtime', function() {
  let serviceProvider: SinonStubbedInstance<CliServiceProvider>;
  let messageBus: SinonStubbedInstance<EventEmitter>;
  let evaluationListener: SinonStubbedInstance<RuntimeEvaluationListener>;
  let electronRuntime: ElectronRuntime;

  beforeEach(async() => {
    serviceProvider = sinon.createStubInstance(CliServiceProvider);
    serviceProvider.bsonLibrary = bson;
    serviceProvider.getConnectionInfo.resolves({ extraInfo: { uri: '' } } as any);
    messageBus = sinon.createStubInstance(EventEmitter);
    evaluationListener = sinon.createStubInstance(class FakeListener {});
    evaluationListener.onPrint = sinon.stub();
    electronRuntime = new ElectronRuntime(serviceProvider, messageBus);
    electronRuntime.setEvaluationListener(evaluationListener as any);
  });

  it('can evaluate simple js', async() => {
    const result = await electronRuntime.evaluate('2 + 2');
    expect(result.printable).to.equal(4);
  });
  it('prints BSON help correctly', async() => {
    const result = await electronRuntime.evaluate('ObjectId().help');
    expect(result.type).to.equal('Help');
  });

  it('allows do declare variables', async() => {
    await electronRuntime.evaluate('var x = 2');
    expect((await electronRuntime.evaluate('x')).printable).to.equal(2);
    await electronRuntime.evaluate('let y = 2');
    expect((await electronRuntime.evaluate('y')).printable).to.equal(2);
    await electronRuntime.evaluate('const z = 2');
    expect((await electronRuntime.evaluate('z')).printable).to.equal(2);
  });

  it('allows do declare functions', async() => {
    await electronRuntime.evaluate('function f() { return 2; }');
    expect((await electronRuntime.evaluate('f()')).printable).to.equal(2);
  });

  it('can run help', async() => {
    const result = await electronRuntime.evaluate('help');
    expect(result.type).to.equal('Help');
  });

  it('can run show', async() => {
    serviceProvider.listDatabases.resolves({
      databases: []
    });

    const result = await electronRuntime.evaluate('show dbs');
    expect(result.type).to.equal('ShowDatabasesResult');
  });

  it('allows to use require', async() => {
    const result = await electronRuntime.evaluate('require("util").types.isDate(new Date())');
    expect(result.printable).to.equal(true);
  });

  it('can switch database', async() => {
    expect(
      (await electronRuntime.evaluate('db')).printable
    ).not.to.equal('db1');

    await electronRuntime.evaluate('use db1');

    expect(
      (await electronRuntime.evaluate('db')).printable
    ).to.equal('db1');
  });

  it('allows to receive telemetry event passing a message bus', async() => {
    await electronRuntime.evaluate('use db1');
    expect(messageBus.emit).to.have.been.calledWith('mongosh:use');
  });

  describe('onPrint', () => {
    it('allows getting the output of print() statements', async() => {
      await electronRuntime.evaluate('print("foo");');
      expect(evaluationListener.onPrint).to.have.been.calledWithMatch(
        sinon.match((array) => (
          array.length === 1 &&
          array[0].type === null &&
          array[0].printable === 'foo')));
    });

    it('allows getting the output of console.log() statements', async() => {
      await electronRuntime.evaluate('console.log("foo");');
      expect(evaluationListener.onPrint).to.have.been.calledWithMatch(
        sinon.match((array) => (
          array.length === 1 &&
          array[0].type === null &&
          array[0].printable === 'foo')));
    });

    it('allows getting the output of multi-arg console.log() statements', async() => {
      await electronRuntime.evaluate('console.log("foo", "bar");');
      expect(evaluationListener.onPrint).to.have.been.calledWithMatch(
        sinon.match((array) => (
          array.length === 2 &&
          array[0].type === null &&
          array[0].printable === 'foo' &&
          array[1].type === null &&
          array[1].printable === 'bar')));
      expect(evaluationListener.onPrint).to.have.been.calledOnce;
    });
  });
});
