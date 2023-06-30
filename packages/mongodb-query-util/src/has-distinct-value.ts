import { isPlainObject, some, has, isEqualWith } from 'lodash';
import { bsonEqual } from './bson-equal';

/**
 * returns an array of all distinct values in a field (equality or $in)
 *
 * @param  {Any}  field   the right-hand side of a document field
 * @return {Boolean}      array of values for this field
 */
export const getDistinctValues = (field: any | undefined) => {
  // field not present, return empty array
  if (field === undefined) {
    return [];
  }
  // field is object, could be a $in clause or a primitive value
  if (isPlainObject(field)) {
    if (has(field, '$in')) {
      return field.$in;
    }
  }
  // it is not a $in operator, return single value as array
  return [field];
};

/**
 * Determines if a field in the query has a distinct value (equality or $in).
 *
 * @param  {Any}  field   the right-hand side of a document field
 * @param  {Any}  value   the value to check
 * @return {Boolean}      whether or not value is included in field
 */
export const hasDistinctValue = (
  field: { $in: any } | undefined,
  value?: any
) => {
  // field not present, add primitive value
  if (field === undefined) {
    return false;
  }
  // field is object, could be a $in clause or a primitive value
  if (isPlainObject(field)) {
    if (has(field, '$in')) {
      // check if $in array contains the value
      const inArray = field.$in;
      return some(inArray, (other) => {
        return isEqualWith(value, other, bsonEqual);
      });
    }
  }
  // it is not a $in operator, check value directly
  return isEqualWith(field, value, bsonEqual);
};
