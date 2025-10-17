import type { MongoDBJSONSchema } from 'mongodb-schema';
import { getDirectChildren, getFieldFromSchema } from './schema-traversal';

export function getNewUnusedFieldName(
  jsonSchema: MongoDBJSONSchema,
  parentFieldPath: string[] = []
): string {
  const parentJSONSchema: MongoDBJSONSchema | undefined = getFieldFromSchema({
    jsonSchema,
    fieldPath: parentFieldPath,
  })?.jsonSchema;

  if (!parentJSONSchema) return 'field-1';

  const existingFieldNames = new Set(
    getDirectChildren(parentJSONSchema).map(([name]) => name)
  );

  let i = 1;
  let fieldName = `field-${i}`;

  while (existingFieldNames.has(fieldName)) {
    i++;
    fieldName = `field-${i}`;
  }

  return fieldName;
}
