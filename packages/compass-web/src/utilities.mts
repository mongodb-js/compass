import {
  errorFromEvent,
  listen,
  utilityPortChannel,
} from '@mongodb-js/compass-utils';
import type { CompassWebLogger } from './logger-and-telemetry.tsx';

const UTILITIES = new Map<string, () => Worker>([
  [
    'hello-world',
    () =>
      new Worker(
        new URL('@mongodb-js/compass-utilities/hello-world', import.meta.url),
        { type: 'module', name: 'hello-world' }
      ),
  ],
]);

export function startUtilities(
  target: Window,
  logger: CompassWebLogger
): Disposable {
  using ds = new DisposableStack();
  const workers = new Map<string, Worker>();

  for (const [name, startWorker] of UTILITIES) {
    const worker = startWorker();
    ds.defer(() => worker.terminate());
    workers.set(utilityPortChannel(name), worker);

    ds.use(
      listen(worker, 'message', ({ data }: MessageEvent) => {
        if (data?.channel === 'compass:log') logger.writeLine(data.data.line);
      })
    );
    ds.use(
      listen(worker, 'error', (event: ErrorEvent) => {
        logger.log.error(
          logger.mongoLogId(1_001_000_453),
          'Utilities',
          'Utility worker failed',
          { name, message: errorFromEvent(event).message }
        );
      })
    );
  }

  ds.use(
    listen(target, 'message', (event: MessageEvent) => {
      if (event.source !== target) return;
      const worker = workers.get(event.data?.type);
      worker?.postMessage(event.data, [...event.ports]);
    })
  );

  return ds.move();
}
