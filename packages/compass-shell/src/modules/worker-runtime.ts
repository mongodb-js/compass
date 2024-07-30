import { WorkerRuntime } from '../node-runtime-worker-thread';
import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { MongoLogWriter } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { setupLoggerAndTelemetry } from '@mongosh/logging';
import { EventEmitter } from 'events';

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

  if (!driverOptions) {
    throw new Error('No driver options provided for the shell runtime');
  }

  const runtime = new WorkerRuntime(
    driverUrl,
    driverOptions,
    cliOptions ?? {},
    {},
    emitter
  );

  return runtime;
}
