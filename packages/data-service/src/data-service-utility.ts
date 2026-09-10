/********************
 * ▌ ▌▐  ▗▜ ▗▐      *
 * ▌ ▌▜▀ ▄▐ ▄▜▀ ▌ ▌ *
 * ▌ ▌▐ ▖▐▐ ▐▐ ▖▚▄▌ *
 * ▝▀  ▀ ▀▘▘▀▘▀ ▗▄▘ *
 ********************/

// There should be no changes.

import type { MessagePortMain } from 'electron';
import { DataServiceImpl } from './data-service';

export type UtilityOptions = {
  port: MessagePortMain;
};

export class DataServiceUtility extends DataServiceImpl {
  readonly utilityOptions: UtilityOptions;
  constructor(
    utilityOptions: UtilityOptions,
    ...args: ConstructorParameters<typeof DataServiceImpl>
  ) {
    super(...args);
    this.utilityOptions = utilityOptions;
    this.setupListener(this.utilityOptions.port);
  }

  setupListener(port: MessagePortMain) {
    port.on('message', (message) => {
      // eslint-disable-next-line no-console
      console.log('Received message:', message);
      port.postMessage({ ok: 1 });
    });
    // `.on('message', ...)` queues messages until the port is started;
    // only the `onmessage =` setter auto-starts it.
    port.start();
  }
}
