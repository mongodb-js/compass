import process from 'node:process';

import type { ParentPort } from 'electron';
import { listen } from '@mongodb-js/compass-utils';
import { ToolsHost } from '@mongodb-js/compass-generative-ai/utility';
import { createUtilityLogger } from '../logging.mts';
import { onPort } from '../ipc.mts';

export const name = 'ai-assistant';

export function main(parentPort: ParentPort): Disposable {
  using ds = new DisposableStack();

  ds.use(
    listen(process, 'unhandledRejection', (reason) => {
      throw reason;
    })
  );

  const logger = createUtilityLogger(parentPort, name);

  const hosts = new Set<ToolsHost>();
  ds.defer(() => {
    for (const host of hosts) {
      void host.stop();
    }
  });

  ds.use(
    onPort(parentPort, (port) => {
      const host = new ToolsHost(port, { logger });
      hosts.add(host);
      listen(
        port,
        'close',
        () => {
          hosts.delete(host);
          void host.stop().catch((error) => {
            logger.log.error(
              logger.mongoLogId(1_001_000_454),
              'ai-assistant',
              'Error when stopping the tools host',
              {
                error: error instanceof Error ? error.message : String(error),
              }
            );
          });
        },
        { once: true }
      );
    })
  );

  return ds.move();
}

if (import.meta.main) {
  main(process.parentPort);
}
