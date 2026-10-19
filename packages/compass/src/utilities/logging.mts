import process from 'node:process';
import type { ParentPort } from 'electron';
import { createGenericLogger } from '@mongodb-js/compass-logging';
import type { Logger } from '@mongodb-js/compass-logging';

/**
 * Same logger the rest of Compass uses (severities, `mongoLogId`, debug
 * output). Lines are formatted here and posted to main over `parentPort`,
 * where they go to the same log writer as main's and the renderer's.
 *
 * `name` is the utility's directory name; its upper-cased form is the log
 * component. Logs one line identifying the process, so every utility's boot
 * shows up the same way.
 */
export function createUtilityLogger(
  parentPort: ParentPort,
  name: string
): Logger {
  const logger = createGenericLogger(name.toUpperCase(), (channel, data) => {
    parentPort.postMessage({ channel, data });
  });
  logger.log.info(logger.mongoLogId(1_001_000_442), 'Utility', 'Started', {
    pid: process.pid,
    ppid: process.ppid,
    startupMs: process.uptime() * 1000,
  });
  return logger;
}
