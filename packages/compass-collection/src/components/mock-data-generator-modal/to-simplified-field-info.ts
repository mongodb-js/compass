import { FIELD_NAME_SEPARATOR } from '../../transform-schema-to-field-info';
import type { processSchema } from '../../transform-schema-to-field-info';
import type { FieldInfo } from '../../schema-analysis-types';

type UserFriendlyFieldInfoNode =
  | { [field: string]: UserFriendlyFieldInfoNode }
  | FieldInfo['type'];
export type SimplifiedFieldInfoTree = {
  [field: string]: UserFriendlyFieldInfoNode;
};

/**
 * Usage is for display purposes only. The result is derived from the work of `processSchema`,
 * ensuring that the user sees a simplification of what the LLM processes.
 */
export default function toSimplifiedFieldInfo(
  input: ReturnType<typeof processSchema>
): SimplifiedFieldInfoTree {
  // ensure parent nodes are created before their children
  const sortedFieldPaths = Object.keys(input).sort(
    (f1, f2) => countSeparators(f1) - countSeparators(f2)
  );

  const result: SimplifiedFieldInfoTree = {};
  for (const path of sortedFieldPaths) {
    const fieldParts = path.split(FIELD_NAME_SEPARATOR);

    let node = result;
    for (let i = 0; i < fieldParts.length; i++) {
      const part = fieldParts[i];

      if (i === fieldParts.length - 1) {
        node[part] = input[path].type;
        break;
      }

      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {};
      }
      node = node[part];
    }
  }
  return result;
}

function countSeparators(input: string): number {
  return input.split(FIELD_NAME_SEPARATOR).length - 1;
}
