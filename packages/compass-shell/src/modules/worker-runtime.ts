import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { MongoLogWriter } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { setupLoggingAndTelemetry } from '@mongosh/logging';
import { EventEmitter } from 'events';
import { openUtilityPort } from '@mongodb-js/compass-utils';
import { ShellRuntime } from './shell-runtime';

export function createWorkerRuntime(
  dataService: DataService,
  log: MongoLogWriter,
  track: TrackFunction,
  connectionInfo: ConnectionInfoRef,
  deviceId: string
): ShellRuntime {
  const emitter = new EventEmitter();

  const loggingAndTelemetry = setupLoggingAndTelemetry({
    bus: emitter,
    analytics: {
      identify: () => {
        /* not needed */
      },
      // Prefix Segment events with `Shell ` to avoid event name collisions.
      // We always enable telemetry here, since the track call will
      // already check whether Compass telemetry is enabled or not.
      track: ({ event, properties }) => {
        return track(
          `Shell ${event}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          properties,
          connectionInfo.current
        );
      },
      flush: () => {
        return Promise.resolve(); // not needed
      },
    },
    deviceId,
    userTraits: {
      platform: process.platform,
      arch: process.arch,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports
    mongoshVersion: require('../../package.json').version,
  });

  loggingAndTelemetry.attachLogger(log);

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
    throw new Error(
      'Expected getMongoClientConnectionOptions to return connection options'
    );
  }

  const runtime = new ShellRuntime(
    openUtilityPort('embedded-shell'),
    driverUrl,
    driverOptions,
    cliOptions ?? {},
    {
      name: 'Compass Shell Worker',
    },
    emitter
  );

  return runtime;
}
