import process from 'node:process';
import { createGenericLogger } from '@mongodb-js/compass-logging';
import type { Logger } from '@mongodb-js/compass-logging';
import type { UtilityParentPort } from './ipc.mts';

/**
 * Same logger the rest of Compass uses (severities, `mongoLogId`, debug
 * output). Lines are formatted here and posted to the host over `parentPort`:
 * main in Compass, which writes them with its own and the renderer's, or the
 * page in Compass Web, which hands them to its logger.
 *
 * `name` is the utility's directory name; its upper-cased form is the log
 * component. Logs one line identifying the process, so every utility's boot
 * shows up the same way.
 */
export function createUtilityLogger(
  parentPort: UtilityParentPort,
  name: string
): Logger {
  const logger = createGenericLogger(name.toUpperCase(), (channel, data) => {
    parentPort.postMessage({ channel, data });
  });
  logger.log.info(logger.mongoLogId(1_001_000_442), 'Utility', 'Started', {
    pid: process.pid,
    ppid: process.ppid,
    startupMs: performance.now(),
  });
  return logger;
}
