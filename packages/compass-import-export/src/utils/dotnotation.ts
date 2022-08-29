import _ from 'lodash';
// @ts-expect-error no types exist for this library
import { flatten, unflatten } from 'flat';
import { getTypeDescriptorForValue } from './bson-csv';
/**
 * TODO: lucas: Some overlap w/ bson-csv but they do
 * have difference! Can't quite name it yet, but something
 * to sort in the future.
 */

/**
 * Converts any nested objects into a single depth object with `dotnotation` keys.
 * @example
 * ```javascript
 * dotnotation.serialize({_id: 'arlo', collar: {size: 14}});
 * >> {_id: 'arlo', 'collar.size': 14}

 * dotnotation.serialize({ foo: { 1: 'one', two: 'two' } });
 * >> { 'foo.1': 'one', 'foo.two': 'two' }

 * dotnotation.serialize({ foo: { 1: 'one', two: 'two' } }, { includeObjects: true });
 * >> { foo: {}, 'foo.1': 'one', 'foo.two': 'two' }
 * ```
 * @param {Object} obj
 * @returns {Object}
 */
export function serialize(
  obj: Record<string, unknown>,
  { includeObjects = false } = {}
): Record<string, unknown> {
  const flattened = flatten(obj, {
    safe: true, // preserve arrays and their contents
    /**
     * @param {any} value
     * @returns {Boolean}
     * NOTE: lucas: Trying an existing fork that supports this new option:
     * https://github.com/hughsk/flat/pull/93
     */
    ignoreValue: function (value: unknown): boolean {
      const t = getTypeDescriptorForValue(value);
      if (t.isBSON) {
        return true;
      }
      return false;
    },
  });

  if (includeObjects) {
    /*
    Make sure that paths to objects exist in the returned value before the paths
    to properties inside those objects.
    ie. for { foo: { 1: 'one', two: 'two' } } we will return
    { foo: {}, 'foo.1': 'one', 'foo.two': 'two' } rather than
    { 'foo.1': 'one', 'foo.two': 'two'}.

    This way when we walk the return value later by the time we encounter
    'foo.1' we already created foo, initialized to {}. Then _.set(result,
    'foo.1', 'one') will not create foo as an array because 1 looks like an
    index. This is because at that point result will already contain { foo: {} }

    The use-case for this came about because paths that end with numbers are
    ambiguous and _.set() will assume it is an array index by default. By
    ensuring that there is already an object at the target the ambiguity is
    removed.
    */
    const withObjects: Record<string, unknown> = {};
    const knownParents: Record<string, true> = {};
    for (const [path, value] of Object.entries(flattened)) {
      let parentPath = path.includes('.')
        ? path.slice(0, path.indexOf('.'))
        : null;
      if (parentPath && !knownParents[parentPath]) {
        knownParents[parentPath] = true;
        // Leave arrays alone because they already got handled by safe: true above.
        if (!Array.isArray(_.get(obj, parentPath))) {
          withObjects[parentPath] = {};
        }

        // Build all of the parent objects that contain the current path.
        // (a.b.c -> a = {} a.b = {})
        while (parentPath && parentPath.includes('.')) {
          knownParents[parentPath] = true;

          // Leave arrays alone because they already got handled by safe: true above.
          if (!Array.isArray(_.get(obj, parentPath))) {
            withObjects[parentPath] = {};
          }

          // Continue to the next parent if there is one.
          parentPath = parentPath.includes('.')
            ? parentPath.slice(0, path.indexOf('.'))
            : null;
        }
      }
      withObjects[path] = value;
    }

    return withObjects;
  }

  return flattened;
}

/**
 * Converts an object using dotnotation to a full, nested object.
 * @example
 * ```javascript
 * dotnotation.deserialize({_id: 'arlo', 'collar.size': 14});
 * >> {_id: 'arlo', collar: {size: 14}}
 * ```
 * @param {Object} obj
 * @returns {Object}
 */
export function deserialize(obj: any): any {
  /**
   * TODO: lucas: bson type support. For now, drop.
   */
  return unflatten(obj);
}

export default { serialize, deserialize };
