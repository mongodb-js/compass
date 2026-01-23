import {
  getDirectChildren,
  getFieldFromSchema,
  traverseSchema,
} from './schema-traversal';
import type { FieldPath } from '../services/data-model-storage';
import type { FieldData } from '../services/data-model-storage';

export function getNewUnusedFieldName(
  jsonSchema: FieldData,
  parentFieldPath: string[] = []
): string {
  const parentJSONSchema: FieldData | undefined =
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

export function extractFieldsFromFieldData(
  parentSchema: FieldData
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
