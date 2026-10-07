import process from 'node:process';

import type { ParentPort } from 'electron';
import { onPort } from '../ipc.mts';

process.on('unhandledRejection', (reason) => {
  throw reason;
});

export function main(parentPort: ParentPort): Disposable {
  return onPort(parentPort, (port) => {
    // placeholder echo
    port.on('message', ({ data }) => port.postMessage(data));
  });
}

if (import.meta.main) {
  main(process.parentPort);
}
