import type {
  Schema,
  SchemaField,
  SchemaType,
  ArraySchemaType,
  DocumentSchemaType,
} from 'mongodb-schema';
import type { FieldInfo } from './schema-analysis-types';

/**
 * Transforms a raw mongodb-schema Schema object into a flat Record<string, FieldInfo>
 * structure suitable for LLM processing and UI display.
 *
 * Uses dot notation for nested fields (e.g., "user.name", "user.scores").
 * For arrays, sets isArray: true, and type represents the element type.
 *
 * Uses recursion with processField function.
 */
export function processSchema(schema: Schema): Record<string, FieldInfo> {
  const result: Record<string, FieldInfo> = {};

  // Helper to recursively process element types (for arrays and documents)
  function processElementType(
    elementType: SchemaType,
    fieldPath: string,
    arrayType?: ArraySchemaType,
    fieldProbability?: number
  ): void {
    if (
      elementType.name === 'Document' ||
      elementType.bsonType === 'Document'
    ) {
      // Create entry for document (leaf level)
      if (arrayType) {
        result[fieldPath] = {
          type: elementType.name || elementType.bsonType || 'Mixed',
          sample_values: extractSampleValues(arrayType),
          probability: fieldProbability || 1.0,
        };
      }

      // Process document fields
      const docType = elementType as DocumentSchemaType;
      if (docType.fields) {
        docType.fields.forEach((nestedField) => {
          processField(nestedField, fieldPath);
        });
      }
    } else if (
      elementType.name === 'Array' ||
      elementType.bsonType === 'Array'
    ) {
      // Process nested arrays recursively with bracket notation
      const nestedArrayType = elementType as ArraySchemaType;
      const innerElementType = getMostFrequentType(nestedArrayType.types || []);

      if (innerElementType) {
        // Add [] to the field path for nested arrays
        const nestedArrayPath = `${fieldPath}[]`;
        processElementType(
          innerElementType,
          nestedArrayPath,
          nestedArrayType,
          fieldProbability
        );
      }
    } else {
      // Primitive type - create entry (leaf level)
      if (arrayType) {
        result[fieldPath] = {
          type: elementType.name || elementType.bsonType || 'Mixed',
          sample_values: extractSampleValues(arrayType),
          probability: fieldProbability || 1.0,
        };
      }
    }
  }

  function processField(field: SchemaField, pathPrefix = ''): void {
    const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;

    const primaryType = getMostFrequentType(field.types || []);
    if (!primaryType) {
      return;
    }

    // Handle arrays
    if (primaryType.name === 'Array' || primaryType.bsonType === 'Array') {
      const arrayType = primaryType as ArraySchemaType;
      const elementType = getMostFrequentType(arrayType.types || []);

      if (elementType) {
        // Create bracket notation path for array elements
        const arrayElementPath = `${fieldPath}[]`;

        // Recursively process nested structures
        processElementType(
          elementType,
          arrayElementPath,
          arrayType,
          field.probability
        );
      }
    }
    // Handle documents (nested objects)
    else if (
      primaryType.name === 'Document' ||
      primaryType.bsonType === 'Document'
    ) {
      // Don't add the document itself to results.
      // We can infer its presence from its children.

      // Process nested fields (children):
      processElementType(primaryType, fieldPath);
    }
    // Handle primitive types
    else {
      result[fieldPath] = {
        type: primaryType.name || primaryType.bsonType || 'Mixed',
        sample_values: extractSampleValues(primaryType),
        probability: field.probability,
      };
    }
  }

  // Process all top-level fields
  schema.fields.forEach((field) => {
    processField(field);
  });

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
 * Extracts sample values from a schema type, limiting to a fixed number
 */
function extractSampleValues(type: SchemaType): unknown[] {
  // Only PrimitiveSchemaType and ArraySchemaType have values
  if ('values' in type && type.values && type.values.length > 0) {
    return type.values.slice(0, 10);
  }

  return [];
}
