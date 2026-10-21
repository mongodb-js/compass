import process from 'node:process';

import type { ParentPort } from 'electron';
import { listen } from '@mongodb-js/compass-utils';
import { createUtilityLogger } from '../logging.mts';
import { onPort } from '../ipc.mts';
import { ToolsHost } from '@mongodb-js/compass-generative-ai/utility';

export const name = 'ai-assistant';

export function main(parentPort: ParentPort): Disposable {
  using ds = new DisposableStack();

  ds.use(
    listen(process, 'unhandledRejection', (reason) => {
      throw reason;
    })
  );

  const logger = createUtilityLogger(parentPort, name);

  ds.use(
    onPort(parentPort, (port) => {
      // One host per renderer: it owns the MCP server and the driver
      // connections for that renderer's tool calls. When the renderer goes
      // away (crash included), its port closes and the host is torn down.
      // Not tracked in `ds`: ports arrive after main() returned and the
      // stack moved out; the listener dies with its closed port.
      const host = new ToolsHost(port, { logger });
      listen(port, 'close', () => {
        host.stop();
      });
    })
  );

  return ds.move();
}

if (import.meta.main) {
  main(process.parentPort);
}
