import process from 'node:process';

import type { ParentPort } from 'electron';
import { onPort } from '../ipc.mts';
import { createUtilityLogger } from '../logging.mts';

export const name = 'embedded-shell';

export function main(parentPort: ParentPort): Disposable {
  process.on('unhandledRejection', (reason) => {
    throw reason;
  });

  const logger = createUtilityLogger(parentPort, name);

  return onPort(parentPort, (port) => {
    port.on('message', ({ data }) => {
      logger.debug('echoing', data);
      port.postMessage(data);
    });
  });
}

if (import.meta.main) {
  main(process.parentPort);
}
