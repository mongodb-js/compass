import type { MongoDBJSONSchema } from 'mongodb-schema';
import {
  getDirectChildren,
  getFieldFromSchema,
  traverseSchema,
} from './schema-traversal';
import type { FieldPath } from '../services/data-model-storage';

export function getNewUnusedFieldName(
  jsonSchema: MongoDBJSONSchema,
  parentFieldPath: string[] = []
): string {
  const parentJSONSchema: MongoDBJSONSchema | undefined =
    parentFieldPath.length > 0
      ? getFieldFromSchema({
          jsonSchema,
          fieldPath: parentFieldPath,
        })?.jsonSchema
      : jsonSchema;

  if (!parentJSONSchema) return 'field-1';

  const existingFieldNames = new Set(
    (function* () {
      for (const [name] of getDirectChildren(parentJSONSchema)) yield name;
    })()
  );

  let i = 1;
  let fieldName = `field-${i}`;

  while (existingFieldNames.has(fieldName)) {
    i++;
    fieldName = `field-${i}`;
  }

  return fieldName;
}

export function extractFieldsFromSchema(
  parentSchema: MongoDBJSONSchema
): FieldPath[] {
  const fields: FieldPath[] = [];
  traverseSchema({
    jsonSchema: parentSchema,
    visitor: ({ fieldPath }) => {
      fields.push(fieldPath);
    },
  });
  return fields;
}
