import type { Document } from 'mongodb';

const getArrayKeys = (records: Document[]) => {
  return records
    .map((item) => getObjectKeys(item))
    .flat()
    .filter((x, i, a) => a.indexOf(x) === i)
    .sort();
};

const getObjectKeys = (record: Document) => {
  const keys: string[] = [];

  if (!record) {
    return keys;
  }

  for (const key in record) {
    keys.push(key);
    const value = record[key];

    if (value && typeof value === 'object') {
      const isBson = value._bsontype;
      if (isBson) {
        keys.push(key);
      } else {
        const nestedKeys = Array.isArray(value)
          ? getArrayKeys(value)
          : getObjectKeys(value);
        nestedKeys.forEach((nestedKey) => {
          keys.push(`${key}.${nestedKey}`);
        });
      }
    }
  }

  return keys;
};

export const getSchema = (data: Document[]) => {
  return getArrayKeys(data);
};
