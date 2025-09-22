import type {
  Schema,
  SchemaField,
  SchemaType,
  ArraySchemaType,
  DocumentSchemaType,
  PrimitiveSchemaType,
  ConstantSchemaType,
} from 'mongodb-schema';
import type { FieldInfo, SampleValue } from './schema-analysis-types';
import type { ArrayLengthMap } from './components/mock-data-generator-modal/script-generation-utils';
import {
  ObjectId,
  Binary,
  BSONRegExp,
  Code,
  Timestamp,
  MaxKey,
  MinKey,
  BSONSymbol,
  Long,
  Decimal128,
} from 'bson';

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
 * Maximum number of sample values to include for each field
 */
const MAX_SAMPLE_VALUES = 10;
export const FIELD_NAME_SEPARATOR = '.';

/**
 * Default array length to use when no specific length information is available
 */
const DEFAULT_ARRAY_LENGTH = 3;

/**
 * Minimum allowed array length
 */
const MIN_ARRAY_LENGTH = 1;

/**
 * Maximum allowed array length
 */
const MAX_ARRAY_LENGTH = 50;

/**
 * Calculate array length from ArraySchemaType, using averageLength with bounds
 */
function calculateArrayLength(arrayType: ArraySchemaType): number {
  const avgLength = arrayType.averageLength ?? DEFAULT_ARRAY_LENGTH;
  return Math.max(
    MIN_ARRAY_LENGTH,
    Math.min(MAX_ARRAY_LENGTH, Math.round(avgLength))
  );
}

/**
 * Result of processing a schema, including both field information and array length configuration
 */
export interface ProcessSchemaResult {
  fieldInfo: Record<string, FieldInfo>;
  arrayLengthMap: ArrayLengthMap;
}

export class ProcessSchemaUnsupportedStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessSchemaUnsupportedStateError';
  }
}

export class ProcessSchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessSchemaValidationError';
  }
}

/**
 * Converts a BSON value to its primitive JavaScript equivalent
 */
function convertBSONToPrimitive(value: unknown): SampleValue {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Keep Date as-is
  if (value instanceof Date) {
    return value;
  }

  // Convert BSON objects to primitives
  if (value instanceof ObjectId) {
    return value.toString();
  }
  if (value instanceof Binary) {
    return value.toString('base64');
  }
  if (value instanceof BSONRegExp) {
    return value.pattern;
  }
  if (value instanceof Code) {
    return value.code;
  }
  if (value instanceof Timestamp) {
    return value.toNumber();
  }
  if (value instanceof MaxKey) {
    return 'MaxKey';
  }
  if (value instanceof MinKey) {
    return 'MinKey';
  }
  if (value instanceof BSONSymbol) {
    return value.toString();
  }
  if (value instanceof Long) {
    return value.toNumber();
  }
  if (value instanceof Decimal128) {
    return parseFloat(value.toString());
  }

  // Handle objects with valueOf method (numeric types)
  if (value && typeof value === 'object' && 'valueOf' in value) {
    const result = (value as { valueOf(): unknown }).valueOf();
    return result as SampleValue;
  }

  return value as SampleValue;
}

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

/**
 * Transforms a raw mongodb-schema Schema into a flat Record<string, FieldInfo>
 * using dot notation for nested fields and bracket notation for arrays.
 * Also extracts array length information for script generation.
 *
 * The result is used for the Mock Data Generator LLM call and script generation.
 */
export function processSchema(schema: Schema): ProcessSchemaResult {
  const fieldInfo: Record<string, FieldInfo> = {};
  const arrayLengthMap: ArrayLengthMap = {};

  if (!schema.fields) {
    return { fieldInfo, arrayLengthMap };
  }

  // Process each top-level field
  for (const field of schema.fields) {
    processNamedField(field, '', fieldInfo, arrayLengthMap);
  }

  // post-processing validation
  for (const fieldPath of Object.keys(fieldInfo)) {
    validateFieldPath(fieldPath);
  }

  return { fieldInfo, arrayLengthMap };
}

/**
 * Processes a schema field and its nested types
 */
function processNamedField(
  field: SchemaField,
  pathPrefix: string,
  result: Record<string, FieldInfo>,
  arrayLengthMap: ArrayLengthMap
): void {
  if (!field.types || field.types.length === 0) {
    return;
  }

  // Use the most frequent type (excluding 'Undefined')
  const primaryType = getMostFrequentType(field.types);
  if (!primaryType) {
    return;
  }

  if (field.name.includes(FIELD_NAME_SEPARATOR)) {
    throw new ProcessSchemaUnsupportedStateError(
      `no support for field names that contain a '${FIELD_NAME_SEPARATOR}' ; field name: '${field.name}'`
    );
  }

  const currentPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

  // Process based on the type
  processType(
    primaryType,
    currentPath,
    result,
    field.probability,
    arrayLengthMap
  );
}

/**
 * Processes a specific schema type
 */
function processType(
  type: SchemaType,
  currentPath: string,
  result: Record<string, FieldInfo>,
  fieldProbability: number,
  arrayLengthMap: ArrayLengthMap
): void {
  if (isConstantSchemaType(type)) {
    return;
  }

  if (isArraySchemaType(type)) {
    // Array: add [] to path and collect array length information
    const elementType = getMostFrequentType(type.types || []);

    if (!elementType) {
      return;
    }

    const arrayPath = `${currentPath}[]`;

    // Collect array length information
    const arrayLength = calculateArrayLength(type);
    arrayLengthMap[arrayPath] = arrayLength;

    // Recurse into element type
    processType(
      elementType,
      arrayPath,
      result,
      fieldProbability,
      arrayLengthMap
    );
  } else if (isDocumentSchemaType(type)) {
    // Document: Process nested document fields
    if (type.fields) {
      for (const nestedField of type.fields) {
        processNamedField(nestedField, currentPath, result, arrayLengthMap);
      }
    }
  } else if (isPrimitiveSchemaType(type)) {
    // Primitive: Create entry
    const fieldInfo: FieldInfo = {
      type: type.name,
      sample_values: type.values
        .slice(0, MAX_SAMPLE_VALUES)
        .map(convertBSONToPrimitive),
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

/**
 * Note: This validation takes a defensive stance. As illustrated by the unit tests, malformed
 * inputs are required to simulate these unlikely errors.
 */
function validateFieldPath(fieldPath: string) {
  const parts = fieldPath.split(FIELD_NAME_SEPARATOR);

  for (const part of parts) {
    if (part === '') {
      throw new ProcessSchemaValidationError(
        `invalid fieldPath '${fieldPath}': field parts cannot be empty`
      );
    }

    if (part.replaceAll('[]', '') === '') {
      throw new ProcessSchemaValidationError(
        `invalid fieldPath '${fieldPath}': field parts must have characters other than '[]'`
      );
    }
  }
}
