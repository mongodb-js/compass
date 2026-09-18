import type { MessagePortMain } from 'electron';
import { DataServiceUtility } from 'mongodb-data-service';
import { on } from 'node:events';
import process from 'node:process';

// `import.meta.main` is declared by `@types/node` (Node 24.2+); no local
// augmentation needed.

type MainArgs = {
  parentPort: MessagePortMain;
};

/**
 * Entry point of the Electron utility process hosting DataServiceUtility
 * instances. Each message relayed by the main process carries one end of a
 * MessageChannel whose other end is held by a DataServiceRenderer.
 */
export async function main({ parentPort }: MainArgs): Promise<void> {
  setInterval(() => {
    // eslint-disable-next-line no-console
    // console.log(new Date(), 'hello from utility');
  }, 5000);

  const dataServices = new Map<MessagePortMain, DataServiceUtility>();
  for await (const [message] of on(parentPort, 'message')) {
    // eslint-disable-next-line no-console
    console.log(message);
    const {
      data,
      ports: [port],
    } = message as Electron.MessageEvent;
    const { connectionOptions, id, hasDeviceFlowNotify } = data;
    dataServices.set(
      port,
      new DataServiceUtility(
        {
          id,
          port,
          hasDeviceFlowNotify,
          onClose: () => void dataServices.delete(port),
        },
        connectionOptions
      )
    );
  }
}

if (import.meta.main) {
  await main({ parentPort: process.parentPort as MessagePortMain });
}
