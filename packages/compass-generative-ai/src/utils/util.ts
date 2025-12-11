import type { AnyAction } from 'redux';
import type { Document } from 'mongodb';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

function processArraySchema(
  types: Document[],
  result: Record<string, string>,
  prefix: string = ''
): Record<string, string> {
  // We only consider the first bsonType for simplicity
  const firstType = types[0];
  if (!firstType) {
    return result;
  }
  if (firstType.bsonType === 'Document') {
    return processDocumentSchema(firstType.fields, result, `${prefix}.`);
  } else if (firstType.bsonType === 'Array') {
    return processArraySchema(firstType.types, result, prefix);
  } else {
    result[prefix] = `${firstType.bsonType}[]`;
  }
  return result;
}

function processDocumentSchema(
  schema: Document,
  result: Record<string, string>,
  prefix: string = ''
): Record<string, string> {
  for (const [key, value] of Object.entries(schema)) {
    const prefixedKey = `${prefix}${key}`;
    // We only consider the first bsonType for simplicity
    const firstType = value.types[0];
    if (!firstType) continue;
    if (firstType.bsonType === 'Document') {
      if (Object.keys(firstType.fields).length === 0) {
        result[prefixedKey] = 'Document';
      } else {
        processDocumentSchema(firstType.fields, result, `${prefixedKey}.`);
      }
    } else if (firstType.bsonType === 'Array') {
      processArraySchema(value.types, result, prefixedKey);
    } else if (firstType.bsonType) {
      result[prefixedKey] = firstType.bsonType;
    }
  }
  return result;
}

export function flattenSchemaToObject(
  schema: Document
): Record<string, string> {
  return processDocumentSchema(schema, {});
}
