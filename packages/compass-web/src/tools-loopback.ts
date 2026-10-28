import { useCallback, useEffect, useRef } from 'react';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import type { Logger } from '@mongodb-js/compass-logging';
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

export function openToolsLoopback(
  hosts: Set<ToolsHost>,
  logger: Logger
): MessagePort {
  const { openPort, hostPort } = createToolsLoopbackChannel();
  hosts.add(new ToolsHost(hostPort, { logger }));
  return openPort();
}

export function useToolsLoopback(): () => MessagePort {
  const logger = useLogger('TOOLS-CONTROLLER');
  const hosts = useRef(new Set<ToolsHost>());

  const openPort = useCallback(
    () => openToolsLoopback(hosts.current, logger),
    [logger]
  );

  useEffect(() => {
    const live = hosts.current;
    return () => {
      for (const host of live) {
        void host.stop();
      }
      live.clear();
    };
  }, []);

  return openPort;
}
