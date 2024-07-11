import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { MongoLogWriter } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { setupLoggerAndTelemetry } from '@mongosh/logging';
import { EventEmitter } from 'events';

declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

// Workaround for webpack require that overrides global require
function getRealRequire() {
  // eslint-disable-next-line camelcase
  return typeof __webpack_require__ === 'function'
    ? // eslint-disable-next-line camelcase, no-undef
      __non_webpack_require__
    : require;
}

/**
 * @type {{ WorkerRuntime: .WorkerRuntime }}
 */
const { WorkerRuntime } = (() => {
  const require = getRealRequire();
  const realModulePath = require.resolve('@mongosh/node-runtime-worker-thread');
  // Runtime needs to be outside the asar bundle to function properly, so if we
  // resolved it inside of one, we will try to import it from outside (and hard
  // fail if this didn't work)
  if (/\.asar(?!\.unpacked)/.test(realModulePath)) {
    try {
      return require(realModulePath.replace('.asar', '.asar.unpacked'));
    } catch (e: any) {
      e.message +=
        '\n\n@mongosh/node-runtime-worker-thread module and all its dependencies needs to be unpacked before it can be used';
      throw e;
    }
  }

  return require(realModulePath);
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
})() as typeof import('@mongosh/node-runtime-worker-thread');

export { WorkerRuntime };

export function createWorkerRuntime(
  dataService: DataService,
  log: MongoLogWriter,
  track: TrackFunction,
  connectionInfo: ConnectionInfoAccess
): typeof WorkerRuntime['prototype'] {
  const emitter = new EventEmitter();

  setupLoggerAndTelemetry(
    emitter,
    log,
    {
      identify: () => {
        /* not needed */
      },
      // Prefix Segment events with `Shell ` to avoid event name collisions.
      // We always enable telemetry here, since the track call will
      // already check whether Compass telemetry is enabled or not.
      track: ({ event, properties }) => {
        return track(
          `Shell ${event}`,
          properties,
          connectionInfo.getCurrentConnectionInfo()
        );
      },
      flush: () => {
        return Promise.resolve(); // not needed
      },
    },
    {
      platform: process.platform,
      arch: process.arch,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires
    require('../../package.json').version
  );

  // We also don't need to pass a proper user id, since that is
  // handled by the Compass tracking code.
  emitter.emit('mongosh:new-user', '<compass user>');

  const {
    url: driverUrl,
    options: driverOptions,
    // Not really provided by dataService, used only for testing purposes
    cliOptions,
  } = {
    cliOptions: {},
    url: '',
    ...dataService.getMongoClientConnectionOptions(),
  };

  const runtime = new WorkerRuntime(
    driverUrl,
    driverOptions,
    cliOptions ?? {},
    {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      serialization: 'advanced',
    },
    emitter
  );

  return runtime;
}
