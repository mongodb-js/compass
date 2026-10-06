import type { ParentPort } from 'electron';
import { onPort } from '../ipc.mts';

/**
 * Takes `parentPort` as an argument so a test can call `main` in its own
 * process with a stand-in, instead of forking a utility process.
 */
export function main(parentPort: ParentPort = process.parentPort): void {
  onPort(parentPort, (port) => {
    // ponytail: echo placeholder until the shell runtime lands here
    port.on('message', ({ data }) => port.postMessage(data));
  });
}

if (import.meta.main) {
  main();
}
