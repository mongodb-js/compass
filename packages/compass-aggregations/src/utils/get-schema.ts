import TypeChecker from 'hadron-type-checker';
import { sortedUniqBy, sortBy } from 'lodash';

import { type TypeCastTypes, getBsonType } from 'hadron-type-checker';
import type { Document } from 'mongodb';

export type FieldSchema = {
  name: string;
  type: TypeCastTypes;
};

export type DocumentSchema = FieldSchema[];

/**
 * Mapper function that maps a FieldSchema with the name prefixed with the
 * provided prefix, separated by a dot
 * */
const toFieldSchemaWithPrefix = (prefix: string) => {
  return (fieldSchema: FieldSchema): FieldSchema => ({
    name: `${prefix}.${fieldSchema.name}`,
    type: fieldSchema.type,
  });
};

const getSchemaForObject = (
  document: Document,
  seen = new WeakSet()
): DocumentSchema => {
  const schema: DocumentSchema = [];

  if (seen.has(document)) {
    return schema;
  }

  seen.add(document);

  for (const key in document) {
    const value = document[key];

    schema.push({
      name: key,
      type: TypeChecker.type(value),
    });

    if (Array.isArray(value)) {
      const valueSchema = getSchemaForArray(value, seen).map(
        toFieldSchemaWithPrefix(key)
      );
      schema.push(...valueSchema);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !getBsonType(value)
    ) {
      const valueSchema = getSchemaForObject(value, seen).map(
        toFieldSchemaWithPrefix(key)
      );
      schema.push(...valueSchema);
    }
  }
  return schema;
};

const getSchemaForArray = (
  records: Document[],
  seen = new WeakSet()
): DocumentSchema => {
  const schema: DocumentSchema = [];

  for (const record of records) {
    if (Array.isArray(record)) {
      schema.push(...getSchemaForArray(record, seen));
    } else if (
      typeof record === 'object' &&
      record !== null &&
      !getBsonType(record)
    ) {
      schema.push(...getSchemaForObject(record, seen));
    }
  }

  return schema;
};

export const getSchema = (records: Document[]): DocumentSchema => {
  const schema = getSchemaForArray(records);
  const sortedSchema = sortBy(schema, 'name');
  return sortedUniqBy(sortedSchema, 'name');
};
