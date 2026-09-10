/****************************
 * ▛▀▖        ▌             *
 * ▙▄▘▞▀▖▛▀▖▞▀▌▞▀▖▙▀▖▞▀▖▙▀▖ *
 * ▌▚ ▛▀ ▌ ▌▌ ▌▛▀ ▌  ▛▀ ▌   *
 * ▘ ▘▝▀▘▘ ▘▝▀▘▝▀▘▘  ▝▀▘▘   *
 ****************************/

/**
 * This file contains the implementation of the DataService class in the renderer
 * It should only use IPC to ask the utility Node.js process to perform the action for
 * a given method. We subclass `DataServiceImpl` to make it fully compatible with the current implementation
 * It will incrementally replace each super method with an own definition that does this IPC until we can remove
 * the subclass-ing.
 */

import { omit } from 'lodash';
import { DataServiceImpl } from './data-service';

async function once(evt: EventTarget, name: string) {
  const { promise, resolve } = Promise.withResolvers<any>();
  const handler = ({ data }: any) => {
    // eslint-disable-next-line no-console
    console.log('utility reply', data);
    resolve([data]);
  };
  evt.addEventListener(name, handler, { once: true });
  return promise;
}

export class DataServiceRenderer extends DataServiceImpl {
  /** */
  private portToUtility: MessagePort;

  constructor(...args: ConstructorParameters<typeof DataServiceImpl>) {
    super(...args);
    const channel = new MessageChannel();
    this.portToUtility = channel.port1;
    // `.addEventListener('message', ...)` (used in `send()` below) queues
    // messages until the port is started; only `onmessage =` auto-starts it.
    this.portToUtility.start();

    const bootMessage = {
      type: 'compass:data-service:port',
      // `notifyDeviceFlow` is a function and can't be structured-cloned
      connectionOptions: omit(
        this.getConnectionOptions(),
        'oidc.notifyDeviceFlow'
      ),
    };

    globalThis.postMessage(bootMessage, '*', [channel.port2]);
  }

  private async send(message: any) {
    const reply = once(this.portToUtility, 'message');
    this.portToUtility.postMessage(message);
    const [response] = await reply;
    return response;
  }

  async connect(options?: {
    signal?: AbortSignal;
    productName?: string;
    productDocsLink?: string;
  }) {
    await this.send({ type: 'connect' });
    await super.connect(options);
  }
}
