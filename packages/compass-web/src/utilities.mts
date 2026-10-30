import {
  errorFromEvent,
  listen,
  utilityPortChannel,
} from '@mongodb-js/compass-utils';
import { getMultiplexLink } from './multiplex-link.ts';
import { CrossOriginWorker } from './cross-origin-worker.mts';
import type { CompassWebLogger } from './logger-and-telemetry.tsx';

const UTILITIES: Map<string, () => CrossOriginWorker> = new Map([
  [
    'ai-assistant',
    () =>
      new CrossOriginWorker(
        new URL(
          '../../compass-utilities/src/ai-assistant/index.mts',
          import.meta.url
        )
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
        // The hosted logger is invisible in the browser console, and this is
        // the only place a worker boot failure surfaces, so mirror it.
        // eslint-disable-next-line no-console
        console.error(`Utility worker ${name} failed:`, errorFromEvent(event));
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
      // Workers run in their own module realm and can't see the page's
      // multiplex link, so every port handoff also carries the WebSocket
      // candidates the link uses; the worker's net polyfill builds its own
      // link from them.
      worker?.postMessage(
        { ...event.data, baseUrls: getMultiplexLink()?.urls },
        [...event.ports]
      );
    })
  );

  return ds.move();
}
