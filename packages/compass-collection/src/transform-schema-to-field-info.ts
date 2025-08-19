import type {
  Schema,
  SchemaField,
  SchemaType,
  ArraySchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
} from 'mongodb-schema';
import type { FieldInfo } from './schema-analysis-types';

/**
 * This module transforms mongodb-schema output into a flat, LLM-friendly format using
 * dot notation for nested fields and bracket notation for arrays.
 *
 * Algorithm Overview:
 * - Start with top-level fields.
 * - For each field (processNamedField), process based on type (processType):
 *   - Primitives: Create result entry
 *   - Documents: Add parent field name to path using dot notation, recurse into nested fields (processNamedField)
 *   - Arrays: Add [] to path, recurse into element type (processType)
 *
 * Notation examples:
 * - Nested documents: user.profile.name (dot notation)
 * - Array: users[] (bracket notation)
 * - Nested arrays: matrix[][] (multiple brackets)
 * - Nested array of documents fields: users[].name (brackets + dots)
 */

/**
 * Transforms a raw mongodb-schema Schema into a flat Record<string, FieldInfo>
 * using dot notation for nested fields and bracket notation for arrays.
 */
export function processSchema(schema: Schema): Record<string, FieldInfo> {
  const result: Record<string, FieldInfo> = {};

  if (!schema.fields) {
    return result;
  }

  // Process each top-level field
  for (const field of schema.fields) {
    processNamedField(field, [], result);
  }

  return result;
}

/**
 * Processes a schema field and its nested types
 */
function processNamedField(
  field: SchemaField,
  pathPrefix: string[],
  result: Record<string, FieldInfo>
): void {
  if (!field.types || field.types.length === 0) {
    return;
  }

  // Use the most frequent type (excluding 'Undefined')
  const primaryType = getMostFrequentType(field.types);
  if (!primaryType) {
    return;
  }

  const currentPath = [...pathPrefix, field.name];

  // Process based on the type
  processType(primaryType, currentPath, result, field.probability);
}

/**
 * Processes a specific schema type
 */
function processType(
  type: SchemaType,
  currentPath: string[],
  result: Record<string, FieldInfo>,
  fieldProbability?: number,
  arraySampleValues?: unknown[]
): void {
  if (type.name === 'Array' || type.bsonType === 'Array') {
    // Array: add [] to path and recurse into element type (while passing down array sample values)
    const arrayType = type as ArraySchemaType;
    const elementType = getMostFrequentType(arrayType.types || []);

    if (!elementType) {
      return;
    }

    const arrayPath = [...currentPath, '[]'];
    const sampleValues = arraySampleValues || getSampleValues(arrayType);

    processType(elementType, arrayPath, result, fieldProbability, sampleValues);
  } else if (type.name === 'Document' || type.bsonType === 'Document') {
    // Process nested document fields (and clear array sample values for nested processing)

    // TODO: Consider
    // if (arraySampleValues) {
    //   // We're in an array of documents - create the array entry
    //   const fieldPath = buildFieldPath(currentPath);
    //   result[fieldPath] = {
    //     type: type.name || type.bsonType || 'Document',
    //     sample_values: arraySampleValues,
    //     probability: fieldProbability || 1.0,
    //   };
    // }

    const docType = type as DocumentSchemaType;
    if (docType.fields) {
      for (const nestedField of docType.fields) {
        processNamedField(nestedField, currentPath, result);
      }
    }
  } else {
    // Primitive: create entry (with passed-down array sample values if we have them)
    const fieldPath = buildFieldPath(currentPath);
    result[fieldPath] = {
      type: type.name || type.bsonType || 'Mixed',
      sample_values: arraySampleValues || getSampleValues(type),
      probability:
        fieldProbability || (type as PrimitiveSchemaType).probability || 1.0,
    };
  }
}

/**
 * Builds a field path from path segments, handling bracket notation correctly
 */
function buildFieldPath(pathSegments: string[]): string {
  let result = '';

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];

    if (segment === '[]') {
      // Bracket notation - append directly
      result += '[]';
    } else {
      // Regular field name
      if (result && !result.endsWith('[]')) {
        result += '.';
      } else if (result && result.endsWith('[]')) {
        // Add dot after brackets for nested fields
        result += '.';
      }
      result += segment;
    }
  }

  return result;
}

/**
 * Gets the most probable type from a list of types, excluding 'Undefined'
 */
function getMostFrequentType(types: SchemaType[]): SchemaType | null {
  if (!types || types.length === 0) {
    return null;
  }

  // Filter out undefined types and sort by probability
  const validTypes = types
    .filter((type) => type.name !== 'Undefined')
    .sort((a, b) => (b.probability || 0) - (a.probability || 0));

  return validTypes[0] || null;
}

/**
 * Extracts sample values from a schema type, limiting to 10 items
 */
function getSampleValues(type: SchemaType): unknown[] {
  // Only PrimitiveSchemaType and ArraySchemaType have values
  if ('values' in type && type.values && type.values.length > 0) {
    return type.values.slice(0, 10);
  }

  return [];
}
