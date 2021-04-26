import CompassShellStore from 'stores';
import { EventEmitter } from 'events';
import { WorkerRuntime } from '../modules/worker-runtime';

function createMockDataService() {
  return {
    getConnectionOptions() {
      return {
        url: 'mongodb://nodb/',
        options: {},
        cliOptions: { nodb: true },
      };
    },
    client: {
      client: {},
    },
  };
}

describe('CompassShellStore [Store]', () => {
  let store;
  let appRegistry;

  const getRuntimeState = () => store.reduxStore.getState().runtime;

  beforeEach(() => {
    store = new CompassShellStore();
    appRegistry = new EventEmitter();
    store.onActivated(appRegistry);
  });

  afterEach(async() => {
    const { runtime } = getRuntimeState();

    if (runtime && runtime.terminate) {
      await runtime.terminate();
    }
  });

  describe('appRegistry', () => {
    it('sets the global appRegistry', () => {
      expect(store.reduxStore.getState().appRegistry).to.not.equal(null);
      expect(store.reduxStore.getState().appRegistry.globalAppRegistry).to.be.instanceOf(EventEmitter);
    });
  });

  describe('runtime', () => {
    it('has initialized runtime state', () => {
      const runtimeState = getRuntimeState();

      expect(runtimeState.error).to.equal(null);
      expect(runtimeState.runtime).to.equal(null);
    });

    it('sets runtime on data-service-connected', () => {
      appRegistry.emit('data-service-connected', null, createMockDataService());

      const runtimeState = getRuntimeState();

      expect(runtimeState.error).to.equal(null);
      expect(runtimeState.runtime).to.be.instanceOf(WorkerRuntime);
    });

    it('emits mongosh events to the appRegistry', async() => {
      appRegistry.emit('data-service-connected', null, createMockDataService());
      let eventRecieved = false;
      appRegistry.on('mongosh:setCtx', () => {
        eventRecieved = true;
      });

      const runtimeState = getRuntimeState();

      // Any command will do, just making sure we waited for the runtime to
      // become available
      await runtimeState.runtime.evaluate('help');

      expect(eventRecieved).to.equal(true);
    });

    it('sets error if data-service-connected has one', () => {
      const error = new Error();
      appRegistry.emit('data-service-connected', error, null);

      const runtimeState = getRuntimeState();

      expect(runtimeState.error).to.equal(error);
      expect(runtimeState.runtime).to.equal(null);
    });

    it('does not change state if dataService is the same', () => {
      const fakeDataService = createMockDataService();

      appRegistry.emit('data-service-connected', null, fakeDataService);
      const runtimeState1 = getRuntimeState();

      appRegistry.emit('data-service-connected', null, fakeDataService);
      const runtimeState2 = getRuntimeState();

      expect(runtimeState1).to.equal(runtimeState2);
    });

    it('resets the runtime on data-service-disconnected', () => {
      appRegistry.emit('data-service-disconnected');
      const runtimeState = getRuntimeState();

      expect(runtimeState.runtime).to.equal(null);
    });
  });
});
