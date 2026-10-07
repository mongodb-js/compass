import type { MessagePortMain } from 'electron';
import { on } from 'node:events';
import process from 'node:process';

// `import.meta.main` is declared by `@types/node` (Node 24.2+); no local
// augmentation needed.

type MainArgs = {
  parentPort: MessagePortMain;
};

// Strict unhandled-rejection handling — same as the data-service utility.
process.on('unhandledRejection', (reason) => {
  throw reason;
});

/**
 * Entry point of the Electron utility process hosting the Atlas auth
 * (OIDC) service. Skeleton: just receives messages on the parent port
 * and logs them. The actual OIDC plugin logic moves here later.
 */
export async function main({ parentPort }: MainArgs): Promise<void> {
  for await (const [message] of on(parentPort, 'message')) {
    // eslint-disable-next-line no-console
    console.log('[atlas-service utility]', message);
  }
}

if (import.meta.main) {
  await main({ parentPort: process.parentPort as MessagePortMain });
}
