import TypeChecker from 'hadron-type-checker';
import { sortedUniqBy, sortBy } from 'lodash';

import type { TypeCastTypes } from 'hadron-type-checker';
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

const getSchemaForObject = (document: Document): DocumentSchema => {
  const schema: DocumentSchema = [];
  for (const key in document) {
    const value = document[key];
    schema.push({
      name: key,
      type: TypeChecker.type(value),
    });

    if (Array.isArray(value)) {
      const valueSchema = getSchemaForArray(value).map(
        toFieldSchemaWithPrefix(key)
      );
      schema.push(...valueSchema);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !value._bsontype
    ) {
      const valueSchema = getSchemaForObject(value).map(
        toFieldSchemaWithPrefix(key)
      );
      schema.push(...valueSchema);
    }
  }
  return schema;
};

const getSchemaForArray = (records: Document[]): DocumentSchema => {
  const schema: DocumentSchema = [];

  for (const record of records) {
    if (Array.isArray(record)) {
      schema.push(...getSchemaForArray(record));
    } else if (
      typeof record === 'object' &&
      record !== null &&
      !record._bsontype
    ) {
      schema.push(...getSchemaForObject(record));
    }
  }

  return schema;
};

export const getSchema = (records: Document[]): DocumentSchema => {
  const schema = getSchemaForArray(records);
  const sortedSchema = sortBy(schema, 'name');
  return sortedUniqBy(sortedSchema, 'name');
};
