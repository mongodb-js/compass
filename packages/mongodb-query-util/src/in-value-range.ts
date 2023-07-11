import {
  curryRight,
  every,
  forOwn,
  get,
  isEqualWith,
  isPlainObject,
  map,
  some,
  uniq,
} from 'lodash';

import { bsonEqual } from './bson-equal';

/**
 * returns whether a value is fully or partially covered by a range,
 * specified with $gt(e)/$lt(e). Ranges can be open ended on either side,
 * and can also be single equality queries, e.g. {"field": 16}.
 *
 * @examples
 * inValueRange(15, {value: 15, dx: 0})                    => 'yes'
 * inValueRange({$gte: 15, $lt: 30}, {value: 20, dx: 5})   => 'yes'
 * inValueRange({$gte: 15, $lt: 30}, {value: 15, dx: 5})   => 'yes'
 * inValueRange(15, {value: 15, dx: 1})                    => 'partial'
 * inValueRange({$gt: 15, $lt: 30}, {value: 15, dx: 5})    => 'partial'
 * inValueRange({$gte: 15, $lt: 30}, {value: 20, dx: 20})  => 'partial'
 * inValueRange({$gte: 15, $lt: 30}, {value: 10, dx: 10})  => 'partial'
 * inValueRange({$gte: 15, $lt: 30}, {value: 10, dx: 5})   => 'partial'
 * inValueRange({$gt: 15, $lt: 30}, {value: 10, dx: 5})    => 'no'
 * inValueRange({$gte: 15, $lt: 30}, {value: 10, dx: 4})   => 'no'
 *
 * @param  {Object|number} field   the field value (range or number)
 * @param  {Object} d              object with a `value` and `dx` field if
 *                                 the value represents a binned range itself
 * @return {String}                'yes', 'partial', 'no'
 */
export const inValueRange = (
  field: any,
  d: { value: any; dx?: number; bson?: any }
) => {
  const compOperators: Record<string, (a: number, b: number) => boolean> = {
    $gte: function (a: number, b: number) {
      return a >= b;
    },
    $gt: function (a: number, b: number) {
      return a > b;
    },
    $lte: function (a: number, b: number) {
      return a <= b;
    },
    $lt: function (a: number, b: number) {
      return a < b;
    },
    $exists: function (a: any, b: any) {
      return a || b;
    },
    $eq: function (a: any, b: any) {
      return a === b;
    },
  };

  const conditions: any[] | null | undefined = [];
  const edgeCase = [];

  if (!isPlainObject(field)) {
    // add an equality condition
    conditions.push(function (a: any) {
      return isEqualWith(a, field, bsonEqual);
    });
    edgeCase.push(field);
  } else {
    forOwn(field, function (value, key) {
      const comparator = compOperators[key];
      if (comparator) {
        // add comparison condition(s), right-curried with the value of the query
        conditions.push(curryRight(comparator)(value));
        edgeCase.push(value);
      }
    });
  }
  const dx = get(d, 'dx', null);

  // extract bound(s): if a dx value is set, create a 2-element array of
  // upper and lower bound. otherwise create a single value array of the
  // original bson type (if available) or the extracted value.

  // NOTE: this package is a copy of https://github.com/mongodb-js/mongodb-query-util/tree/main.
  // Once we converted the code to typescript, eslint started to complain about the fact
  // that the sum is not happening always between numbers.
  // From tests, it seems expected for d.value to also be a BSON type, and the sum
  // here may not make sense.
  // Potentially there could be bugs deriving from it, but tests are passing and
  // is not easy to tell what is the original intent here, so we suppress the eslint warning.
  //
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const bounds = dx ? uniq([d.value, d.value + dx]) : [d.bson || d.value];

  /*
   * Logic to determine if the query covers the value (or value range)
   *
   * if all bounds pass all conditions, the value is fully covered in the range (yes)
   * if one of two bounds passes all conditions, the value is partially covered (partial)
   * if none of the bounds pass all conditions, the value is not covered (no)
   *
   * Since the upper bound of a bar represents the exclusive bound
   * (i.e. lower <= x < upper) we need to use a little hack to adjust for
   * the math. This means that if someone adjusts the query bound manually by
   * less than 1 millionth of the value, one of the bars may appear half
   * selected instead of not/fully selected. The error is purely visual.
   */
  const results = map(bounds, function (bound, i) {
    // adjust the upper bound slightly as it represents an exclusive bound
    // getting this perfectly right would require a lot more code to check for
    // all 4 edge cases.
    if (i > 0) {
      bound -= 0.00001 * Math.abs(bound) + 0.00001;
    }
    return every(
      map(conditions, function (cond) {
        return cond(bound);
      })
    );
  });

  if (every(results)) {
    return 'yes';
  }
  if (some(results)) {
    return 'partial';
  }
  // check for edge case where range wraps around query on both ends
  if (
    every(edgeCase, function (val) {
      return val > bounds[0] && val < bounds[bounds.length - 1];
    })
  ) {
    return 'partial';
  }
  return 'no';
};
