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
 * ```
 * @param {Object} obj
 * @returns {Object}
 */
export function serialize(obj) {
  return flatten(obj, {
    safe: true, // preserve arrays and their contents
    /**
     * @param {any} value
     * @returns {Boolean}
     * NOTE: lucas: Trying an existing fork that supports this new option:
     * https://github.com/hughsk/flat/pull/93
     */
    ignoreValue: function (value) {
      const t = getTypeDescriptorForValue(value);
      if (t.isBSON) {
        return true;
      }
    },
  });
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
export function deserialize(obj) {
  /**
   * TODO: lucas: bson type support. For now, drop.
   */
  return unflatten(obj);
}

export default { serialize, deserialize };
