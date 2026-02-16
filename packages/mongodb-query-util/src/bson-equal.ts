import { getBsonType } from 'hadron-type-checker';

import type { Double, Int32, ObjectId } from 'bson';

export const bsonEqual = (value: any, other: any): boolean | undefined => {
  const bsontype = getBsonType(value);

  if (!bsontype || typeof bsontype !== 'string') {
    return undefined;
  }

  if (!getBsonType(other)) {
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
