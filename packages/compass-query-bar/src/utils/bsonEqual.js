import { get, includes } from 'lodash';

const bsonEqual = (value, other) => {
  const bsontype = get(value, '_bsontype', undefined);

  if (bsontype === 'ObjectID') {
    return value.equals(other);
  }
  if (includes(['Decimal128', 'Long'], bsontype)) {
    return value.toString() === other.toString();
  }
  if (includes(['Int32', 'Double'], bsontype)) {
    return value.value === other.value;
  }
  // for all others, use native comparisons
  return undefined;
};

export default bsonEqual;
export { bsonEqual };
