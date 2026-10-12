import process from 'node:process';

import type { ParentPort } from 'electron';
import { onPort } from '../ipc.mts';
import { createUtilityLogger } from '../logging.mts';
import { listen } from '@mongodb-js/compass-utils';

export const name = 'embedded-shell';

export function main(parentPort: ParentPort): Disposable {
  using ds = new DisposableStack();

  ds.use(
    listen(process, 'unhandledRejection', (reason) => {
      throw reason;
    })
  );

  createUtilityLogger(parentPort, name);

  ds.use(
    onPort(parentPort, () => {
      // Sessions arrive with the embedded shell implementation
    })
  );

  return ds.move();
}

if (import.meta.main) {
  main(process.parentPort);
}
