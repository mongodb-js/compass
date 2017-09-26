import { isPlainObject, has } from 'lodash';

/**
 * returns an array of all distinct values in a field (equality or $in)
 *
 * @param  {Any}  field   the right-hand side of a document field
 * @return {Boolean}      array of values for this field
 */
const getDistinctValues = (field) => {
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
}

export default getDistinctValues;
export { getDistinctValues };
