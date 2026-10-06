import type { ParentPort } from 'electron';
import process from 'node:process';
import { onPort } from '../ipc.mts';

/**
 * Takes `parentPort` as an argument so a test can call `main` in its own
 * process with a stand-in, instead of forking a utility process.
 */
export function main(parentPort: ParentPort): Disposable {
  return onPort(parentPort, (port) => {
    // ponytail: echo placeholder until the shell runtime lands here
    port.on('message', ({ data }) => port.postMessage(data));
  });
}

if (import.meta.main) {
  main(process.parentPort);
}
