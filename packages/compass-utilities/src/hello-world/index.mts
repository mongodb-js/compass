/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import { listen } from '@mongodb-js/compass-utils';
import type { UtilityParentPort } from '../ipc.mts';
import { currentParentPort, onPort } from '../ipc.mts';
import { createUtilityLogger } from '../logging.mts';

export const name = 'hello-world';

/**
 * Smallest possible utility: proves one entry point boots as an Electron
 * utility process in Compass and as a Web Worker in Compass Web. Replies to
 * every message on a port with `{ hello: <message> }`.
 */
export function main(parentPort: UtilityParentPort): Disposable {
  using ds = new DisposableStack();
  createUtilityLogger(parentPort, name);
  ds.use(
    onPort(parentPort, (port) => {
      // Not tracked in `ds`: ports arrive after main() returned; the listener
      // dies with its port
      listen(port, 'message', ({ data }: { data: unknown }) => {
        port.postMessage({ hello: data });
      });
    })
  );

  setInterval(() => {
    try {
      console.log('read', readFileSync('./blah.txt'));
    } catch (e) {
      console.log(e);
    }
    console.log(new Date().toISOString(), 'hello');
  }, 5000);
  return ds.move();
}

const parentPort = currentParentPort();
if (parentPort) {
  main(parentPort);
}
