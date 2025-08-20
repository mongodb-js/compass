import type {
  Schema,
  SchemaField,
  SchemaType,
  ArraySchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  ConstantSchemaType,
} from 'mongodb-schema';

// Type guards for mongodb-schema types
function isConstantSchemaType(type: SchemaType): type is ConstantSchemaType {
  return type.name === 'Null' || type.name === 'Undefined';
}

function isArraySchemaType(type: SchemaType): type is ArraySchemaType {
  return type.name === 'Array';
}

function isDocumentSchemaType(type: SchemaType): type is DocumentSchemaType {
  return type.name === 'Document';
}

function isPrimitiveSchemaType(type: SchemaType): type is PrimitiveSchemaType {
  return (
    !isConstantSchemaType(type) &&
    !isArraySchemaType(type) &&
    !isDocumentSchemaType(type)
  );
}
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
    processNamedField(field, '', result);
  }

  return result;
}

/**
 * Processes a schema field and its nested types
 */
function processNamedField(
  field: SchemaField,
  pathPrefix: string,
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

  const currentPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

  // Process based on the type
  processType(primaryType, currentPath, result, field.probability);
}

/**
 * Processes a specific schema type
 */
function processType(
  type: SchemaType,
  currentPath: string,
  result: Record<string, FieldInfo>,
  fieldProbability: number
): void {
  if (isConstantSchemaType(type)) {
    return;
  }

  if (isArraySchemaType(type)) {
    // Array: add [] to path and recurse into element type
    const elementType = getMostFrequentType(type.types || []);

    if (!elementType) {
      return;
    }

    const arrayPath = `${currentPath}[]`;
    processType(elementType, arrayPath, result, fieldProbability);
  } else if (isDocumentSchemaType(type)) {
    // Document: Process nested document fields
    if (type.fields) {
      for (const nestedField of type.fields) {
        processNamedField(nestedField, currentPath, result);
      }
    }
  } else if (isPrimitiveSchemaType(type)) {
    // Primitive: Create entry
    const fieldInfo: FieldInfo = {
      type: type.name,
      sample_values: type.values.slice(0, 10).map((value) => {
        // Convert BSON values to their primitive equivalents, but keep Date objects as-is
        if (value instanceof Date) {
          return value;
        }
        if (value && typeof value === 'object' && 'valueOf' in value) {
          return value.valueOf();
        }
        return value;
      }),
      probability: fieldProbability,
    };

    result[currentPath] = fieldInfo;
  }
}

/**
 * Gets the most probable type from a list of types, excluding constant types (Null/Undefined)
 */
function getMostFrequentType(types: SchemaType[]): SchemaType | null {
  if (!types || types.length === 0) {
    return null;
  }

  // Filter out constant types (Null/Undefined) and sort by probability
  const validTypes = types
    .filter((type) => !isConstantSchemaType(type))
    .sort((a, b) => (b.probability || 0) - (a.probability || 0));

  return validTypes[0] || null;
}
