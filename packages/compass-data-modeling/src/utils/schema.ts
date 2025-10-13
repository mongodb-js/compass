import type { MongoDBJSONSchema } from 'mongodb-schema';

export function getNewUnusedFieldName(
  jsonSchema: MongoDBJSONSchema,
  parentFieldPath: string[] = []
): string {
  let parentJSONSchema: MongoDBJSONSchema | undefined = jsonSchema;
  for (const currentField of parentFieldPath) {
    if (!currentField) {
      throw new Error('Invalid field path to get new field name');
    }
    parentJSONSchema = parentJSONSchema?.properties?.[currentField];
  }

  const existingFieldNames = new Set(
    Object.keys(parentJSONSchema?.properties || {})
  );

  let i = 1;
  let fieldName = `field-${i}`;

  while (existingFieldNames.has(fieldName)) {
    i++;
    fieldName = `field-${i}`;
  }

  return fieldName;
}
