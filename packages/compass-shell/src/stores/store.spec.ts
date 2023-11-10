import { EventEmitter } from 'events';
import { expect } from 'chai';

import { WorkerRuntime } from '../modules/worker-runtime';
import CompassShellStore from './';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

function createMockDataService() {
  return {
    getMongoClientConnectionOptions() {
      return {
        url: 'mongodb://nodb/',
        options: {},
        cliOptions: { nodb: true },
      };
    },
  };
}

describe('CompassShellStore [Store]', function () {
  let store: CompassShellStore;
  let appRegistry: EventEmitter;
  let deactivate: () => void;

  const getRuntimeState = () => store.reduxStore.getState().runtime;

  beforeEach(function () {
    store = new CompassShellStore();
    appRegistry = new EventEmitter();
    deactivate = store.onActivated({
      globalAppRegistry: appRegistry,
      logger: createLoggerAndTelemetry('COMPASS-SHELL'),
      dataService: createMockDataService(),
    } as any);
  });

  afterEach(async function () {
    const { runtime } = getRuntimeState();

    await runtime?.terminate();
  });

  describe('appRegistry', function () {
    it('sets the global appRegistry', function () {
      expect(store.reduxStore.getState().runtime.appRegistry).to.not.equal(
        null
      );
      expect(store.reduxStore.getState().runtime.appRegistry).to.be.instanceOf(
        EventEmitter
      );
    });
  });

  describe('runtime', function () {
    it('sets runtime on data-service-connected', function () {
      let runtimeState = getRuntimeState();

      expect(runtimeState.error).to.equal(null);
      expect(runtimeState.runtime).to.be.instanceOf(WorkerRuntime);

      store.onEnableShellChanged(false);
      runtimeState = getRuntimeState();

      expect(runtimeState.error).to.equal(null);
      expect(runtimeState.runtime).to.equal(null);
    });

    it('emits mongosh events to the appRegistry', async function () {
      store.onEnableShellChanged(true);
      let eventReceived = false;
      appRegistry.on('mongosh:setCtx', () => {
        eventReceived = true;
      });

      const runtimeState = getRuntimeState();

      // Any command will do, just making sure we waited for the runtime to
      // become available
      await runtimeState.runtime?.evaluate('help');

      expect(eventReceived).to.equal(true);
    });

    it('does not change state if dataService is the same', function () {
      const fakeDataService = createMockDataService();

      appRegistry.emit('data-service-connected', null, fakeDataService);
      const runtimeState1 = getRuntimeState();

      appRegistry.emit('data-service-connected', null, fakeDataService);
      const runtimeState2 = getRuntimeState();

      expect(runtimeState1).to.deep.equal(runtimeState2);
    });

    it('resets the runtime on deactivate', function () {
      deactivate();
      const runtimeState = getRuntimeState();

      expect(runtimeState.runtime).to.equal(null);
    });
  });
});
