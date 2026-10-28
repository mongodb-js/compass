import { useEffect, useMemo } from 'react';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { ToolsHost } from '@mongodb-js/compass-generative-ai/utility';

/**
 * The channel between the renderer and the in-page host. Both ends listen
 * through `addEventListener`, and a MessagePort only dispatches queued messages
 * once started, so both have to be started here: the desktop equivalents do it
 * in `openUtilityPort` and `onPort`.
 */
export function createToolsLoopbackChannel(): {
  openPort: () => MessagePort;
  hostPort: MessagePort;
} {
  const channel = new MessageChannel();
  channel.port1.start();
  channel.port2.start();
  return { openPort: () => channel.port1, hostPort: channel.port2 };
}

/**
 * The browser has no utility process, so the assistant's tools host runs in
 * the page instead: the same host and the same protocol as the desktop build,
 * with the driver polyfills compass-web already provides, on the other end of
 * a plain MessageChannel.
 */
export function useToolsLoopback(): () => MessagePort {
  const logger = useLogger('TOOLS-CONTROLLER');

  const { openPort, host } = useMemo(() => {
    const { openPort, hostPort } = createToolsLoopbackChannel();
    return {
      openPort,
      host: new ToolsHost(hostPort, { logger }),
    };
  }, [logger]);

  useEffect(() => {
    return () => {
      // Nothing else releases the in-page host: on desktop the utility does
      // this when the port closes.
      void host.stop();
    };
  }, [host]);

  return openPort;
}
