import { flatten, unflatten } from 'flat';

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
  /**
   * TODO: lucas: bson type support. For now, drop.
   */
  return flatten(obj);
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
