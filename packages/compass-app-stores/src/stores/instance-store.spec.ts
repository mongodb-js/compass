import { EventEmitter } from 'events';
import AppRegistry from 'hadron-app-registry';
import { createInstanceStore } from './instance-store';
import { once } from 'events';
import sinon from 'sinon';
import { expect } from 'chai';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

class FakeDataService extends EventEmitter {
  instanceInfo: any;
  getConnectionString() {
    return { hosts: ['localhost:27020'] };
  }
  instance() {
    return Promise.resolve(this.instanceInfo);
  }
  listDatabases() {
    return Promise.resolve([]);
  }
  listCollections() {
    return Promise.resolve([]);
  }
  getLastSeenTopology() {
    return {
      type: 'Unknown',
      servers: [],
      setName: 'foo',
    };
  }
}

function createDataService(
  instanceInfo: any = { build: { version: '1.2.3' }, host: { arch: 'x64' } }
): any {
  const dataService = new FakeDataService();
  dataService.instanceInfo = instanceInfo;
  return dataService;
}

describe('InstanceStore [Store]', function () {
  let globalAppRegistry: AppRegistry;
  let dataService: any;
  let store: ReturnType<typeof createInstanceStore>;

  let emitSpy: any;
  let initialInstanceRefreshedPromise: Promise<unknown>;
  let sandbox: sinon.SinonSandbox;

  const hadronAppBkp = (globalThis as any).hadronApp;

  beforeEach(function () {
    globalAppRegistry = new AppRegistry();
    (globalThis as any).hadronApp = {};
    sandbox = sinon.createSandbox();

    emitSpy = sandbox.spy(globalAppRegistry, 'emit');
    dataService = createDataService();
    const logger = createLoggerAndTelemetry('COMPASS-INSTANCE-STORE');
    initialInstanceRefreshedPromise = once(
      globalAppRegistry,
      'instance-refreshed'
    );

    store = createInstanceStore({
      dataService,
      globalAppRegistry,
      logger,
    });
  });

  afterEach(function () {
    (globalThis as any).hadronApp = hadronAppBkp;
    emitSpy = null;
    sandbox.restore();
    store.deactivate();
  });

  context('when data service connects', function () {
    it('creates instance and makes it globally available through global.hadronApp.instance', function () {
      const instance = store.state.instance;
      expect((instance as any).getType()).to.equal('Instance');
      expect((globalThis as any).hadronApp.instance).to.equal(instance);
    });

    it('emits instance-refreshed event', async function () {
      await initialInstanceRefreshedPromise;
      const events = emitSpy.args.map(([evtName]: any) => evtName);
      expect(events).to.eql(['instance-created', 'instance-refreshed']);
    });
  });

  context('on refresh data', function () {
    beforeEach(async function () {
      sandbox
        .stub(dataService, 'instance')
        .returns({ build: { version: '3.2.1' } });
      await initialInstanceRefreshedPromise;
      expect(store.getState().instance).to.have.nested.property(
        'build.version',
        '1.2.3'
      );
      globalAppRegistry.emit('refresh-data');
      await once(globalAppRegistry, 'instance-refreshed');
    });

    it('calls instance model fetch', function () {
      expect(store.getState().instance).to.have.nested.property(
        'build.version',
        '3.2.1'
      );
    });

    it('emits instance-changed event', function () {
      const events = emitSpy.args.map(([evtName]: any) => evtName);
      expect(events).to.eql([
        'instance-created',
        'instance-refreshed',
        'refresh-data',
        'instance-refreshed',
      ]);
    });
  });

  context('on agg pipeline out', function () {
    beforeEach(async function () {
      sandbox
        .stub(dataService, 'instance')
        .returns({ build: { version: '3.2.1' } });
      await initialInstanceRefreshedPromise;
      expect(store.getState().instance).to.have.nested.property(
        'build.version',
        '1.2.3'
      );
      globalAppRegistry.emit('agg-pipeline-out-executed');
      await once(globalAppRegistry, 'instance-refreshed');
    });

    it('calls instance model fetch', function () {
      expect(store.getState().instance).to.have.nested.property(
        'build.version',
        '3.2.1'
      );
    });

    it('emits instance-changed event', function () {
      const events = emitSpy.args.map(([evtName]: any) => evtName);
      expect(events).to.eql([
        'instance-created',
        'instance-refreshed',
        'agg-pipeline-out-executed',
        'instance-refreshed',
      ]);
    });
  });
});
