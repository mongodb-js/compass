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

export function addFieldToJSONSchema(
  jsonSchema: MongoDBJSONSchema,
  fieldPath: string[],
  newFieldSchema: MongoDBJSONSchema
): MongoDBJSONSchema {
  if (fieldPath.length === 0) {
    throw new Error('Invalid field to add to schema');
  }

  if (fieldPath.length === 1) {
    return {
      ...jsonSchema,
      properties: {
        ...jsonSchema.properties,
        [fieldPath[0]]: newFieldSchema,
      },
    };
  }

  const schemaToAddFieldTo = jsonSchema.properties?.[fieldPath[0]];
  if (!schemaToAddFieldTo) {
    throw new Error('Field path to add new field to does not exist');
  }

  return {
    ...jsonSchema,
    properties: {
      ...jsonSchema.properties,
      [fieldPath[0]]: addFieldToJSONSchema(
        schemaToAddFieldTo,
        fieldPath.slice(1),
        newFieldSchema
      ),
    },
  };
}
