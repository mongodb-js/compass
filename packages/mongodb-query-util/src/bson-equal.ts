import { get } from 'lodash';

import type { Double, Int32, ObjectId } from 'bson';

export const bsonEqual = (value: any, other: any): boolean | undefined => {
  const bsontype = get(value, '_bsontype', undefined);

  if (!bsontype || typeof bsontype !== 'string') {
    return undefined;
  }

  if (bsontype === 'ObjectId') {
    return (value as ObjectId).equals(other);
  }

  if (['Decimal128', 'Long'].includes(bsontype)) {
    return value.toString() === other.toString();
  }

  if (['Int32', 'Double'].includes(bsontype)) {
    return (value as Int32 | Double).value === (other as Int32 | Double).value;
  }

  // for all others, use native comparisons
  return undefined;
};
