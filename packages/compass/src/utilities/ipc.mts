import type { MessagePortMain, ParentPort } from 'electron';

/**
 * Main hands a utility its MessagePorts over `parentPort`, one per renderer
 * (or other peer) that wants to talk to it. `handler` attaches its listeners
 * before the port is started, so no message posted ahead of time is dropped.
 */
export function onPort(
  parentPort: ParentPort,
  handler: (port: MessagePortMain) => void
): void {
  parentPort.on('message', ({ ports }) => {
    for (const port of ports) {
      handler(port);
      port.start();
    }
  });
}
