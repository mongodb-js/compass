import { processSchema } from '../../transform-schema-to-field-info';
import type { FieldInfo } from '../../schema-analysis-types';

type UserFriendlyFieldInfoNode =
  | { [field: string]: UserFriendlyFieldInfoNode }
  | FieldInfo['type'];
export type UserFriendlyFieldInfoTree = {
  [field: string]: UserFriendlyFieldInfoNode;
};

/**
 * Usage is for display purposes only. The result is derived from the work of `processSchema`,
 * instead of directly derived from the `Schema` type from `mongodb-schema`, ensuring that what
 * the user sees in `RawSchemaConfirmationScreen` is constrained to what the LLM processes.
 */
export default function toUserFriendlyFieldInfo(
  input: ReturnType<typeof processSchema>
): UserFriendlyFieldInfoTree {
  // ensure parent nodes are created before their children
  const sortedFieldPaths = Object.keys(input).sort(
    (f1, f2) => countSeparators(f1) - countSeparators(f2)
  );

  // Assumes "." and "[]" placement is valid
  const result: UserFriendlyFieldInfoTree = {};
  for (const path of sortedFieldPaths) {
    const fieldParts = path.split('.');

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

/**
 * note: assumes `processSchema` constructs field paths in this manner:
 * - 1+ "[]" can only appear at the end of field paths
 * - field keys do not contain "." or "[]"
 */
function countSeparators(input: string): number {
  const c1 = input.split('.').length - 1;
  const c2 = input.split('[]').length - 1;
  return c1 + c2;
}
