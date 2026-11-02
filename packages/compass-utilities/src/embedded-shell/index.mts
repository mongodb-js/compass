import process from 'node:process';
import { createRequire } from 'node:module';

import { listen } from '@mongodb-js/compass-utils';
import { ShellSession } from '@mongodb-js/compass-shell/utility';
import type { UtilityParentPort } from '../ipc.mts';
import { currentParentPort, onPort } from '../ipc.mts';
import { createUtilityLogger } from '../logging.mts';

export const name = 'embedded-shell';

// The worker loads this file itself, so it has to exist on disk outside the
// asar archive (it is unpacked when Compass is packaged)
function resolveWorkerRuntimePath(): string {
  return createRequire(import.meta.url)
    .resolve('@mongosh/node-runtime-worker-thread/worker-runtime')
    .replace(/\.asar(?!\.unpacked)/, '.asar.unpacked');
}

export function main(parentPort: UtilityParentPort): Disposable {
  using ds = new DisposableStack();
  const workerRuntimePath = resolveWorkerRuntimePath();
  const logger = createUtilityLogger(parentPort, name);

  ds.use(
    listen(process, 'unhandledRejection', (reason) => {
      throw reason;
    })
  );

  // Only live sessions are kept, so an ended one can be collected
  const sessions = new Set<ShellSession>();
  ds.defer(() => {
    for (const session of sessions) session[Symbol.dispose]();
  });

  ds.use(
    onPort(parentPort, (port) => {
      const session = new ShellSession(port, { logger, workerRuntimePath });
      sessions.add(session);
      listen(session, 'close', () => sessions.delete(session), { once: true });
    })
  );

  return ds.move();
}

const parentPort = currentParentPort();
if (parentPort) {
  main(parentPort);
}
