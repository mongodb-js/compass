import _parseShellBSON, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { Document } from 'mongodb';
import type { TranslateFn } from '@mongodb-js/compass-components';

// Copied from packages/compass-aggregations/src/modules/pipeline-builder/pipeline-parser/utils.ts
export function parseShellBSON(source: string, t?: TranslateFn): Document[] {
  const parsed = _parseShellBSON(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error(
      t?.(
        'indexes.parseShellBson.invalidDefinition',
        'The provided index definition is invalid.'
      ) ?? 'The provided index definition is invalid.'
    );
  }
  return parsed;
}
