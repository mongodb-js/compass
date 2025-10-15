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
import type {
  ObjectId,
  BSONRegExp,
  Code,
  Timestamp,
  BSONSymbol,
  Long,
  Decimal128,
  BSONValue,
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
const MAX_SAMPLE_VALUES = 5;

/**
 * Maximum length for individual sample values (to prevent massive payloads)
 * 300 chars allows for meaningful text samples while keeping payloads manageable
 */
const MAX_STRING_SAMPLE_VALUE_LENGTH = 300;

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
 * Type guard to check if a value is a BSON object using _bsontype property
 */
function isBSONValue(value: unknown): value is BSONValue {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    '_bsontype' in value &&
    typeof (value as { _bsontype: unknown })._bsontype === 'string'
  );
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

  // Convert BSON objects to primitives using _bsontype
  if (isBSONValue(value)) {
    switch (value._bsontype) {
      case 'ObjectId':
        return (value as ObjectId).toString();
      case 'Binary':
        // Binary data should never be processed because sample values are skipped for binary fields
        throw new ProcessSchemaUnsupportedStateError(
          'Binary data encountered in sample value conversion. Binary fields should be excluded from sample value processing.'
        );
      case 'BSONRegExp':
        return (value as BSONRegExp).pattern;
      case 'Code':
        return (value as Code).code;
      case 'Timestamp':
        return (value as Timestamp).toNumber();
      case 'MaxKey':
        return 'MaxKey';
      case 'MinKey':
        return 'MinKey';
      case 'BSONSymbol':
        return (value as BSONSymbol).toString();
      case 'Long':
        return (value as Long).toNumber();
      case 'Decimal128':
        return parseFloat((value as Decimal128).toString());
      default:
        // Unknown BSON type, continue to other checks
        break;
    }
  }

  // Handle objects with valueOf method (numeric types)
  if (value && typeof value === 'object' && 'valueOf' in value) {
    const result = (value as { valueOf(): unknown }).valueOf();
    return result as SampleValue;
  }

  // Truncate very long strings to prevent massive payloads
  if (
    typeof value === 'string' &&
    value.length > MAX_STRING_SAMPLE_VALUE_LENGTH
  ) {
    return value.substring(0, MAX_STRING_SAMPLE_VALUE_LENGTH) + '...';
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
    Math.round(field.probability * 100) / 100, // Round to 2 decimal places
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
      probability: fieldProbability,
    };

    // Only add sampleValues if not Binary (to avoid massive payloads from embeddings)
    if (type.name !== 'Binary') {
      fieldInfo.sampleValues = type.values
        .slice(0, MAX_SAMPLE_VALUES)
        .map(convertBSONToPrimitive);
    }

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
