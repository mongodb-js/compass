import process from 'node:process';
import { createRequire } from 'node:module';

import type { ParentPort } from 'electron';
import { onPort } from '../ipc.mts';
import { createUtilityLogger } from '../logging.mts';
import { ShellSession } from '@mongodb-js/compass-shell/utility';

export const name = 'embedded-shell';

// The worker loads this file itself, so it has to exist on disk outside the
// asar archive (it is unpacked when Compass is packaged)
function resolveWorkerRuntimePath(): string {
  return createRequire(import.meta.url)
    .resolve('@mongosh/node-runtime-worker-thread/dist/worker-runtime.js')
    .replace(/\.asar(?!\.unpacked)/, '.asar.unpacked');
}

export function main(parentPort: ParentPort): Disposable {
  process.on('unhandledRejection', (reason) => {
    throw reason;
  });

  const logger = createUtilityLogger(parentPort, name);

  return onPort(parentPort, (port) => {
    new ShellSession(port, {
      logger,
      workerRuntimePath: resolveWorkerRuntimePath(),
    });
  });
}

if (import.meta.main) {
  main(process.parentPort);
}
