import _parseShellBSON, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { BSONObject } from '../stores/insert';

// Copied from packages/compass-aggregations/src/modules/pipeline-builder/pipeline-parser/utils.ts
export function parseShellBSON(source: string): BSONObject | BSONObject[] {
  const parsed = _parseShellBSON(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('The provided definition is invalid.');
  }
  return parsed as BSONObject | BSONObject[];
}
