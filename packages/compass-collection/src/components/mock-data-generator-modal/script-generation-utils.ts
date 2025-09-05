/**
 * Script Generation Utilities for Mock Data Generator
 *
 * Converts processed faker.js schema mappings into executable MongoDB Shell (mongosh) scripts.
 */

// Input types from processed LLM output
export type ProcessedFakerSchema = Record<string, ProcessedFieldMapping>;

export interface ProcessedFieldMapping {
  mongoType: string; // e.g., "String", "Number", "Date", "ObjectId"
  fakerMethod: string; // e.g., "person.fullName", "internet.email", "unrecognized"
  fakerArgs: FakerArg[]; // Array of arguments for the faker method
  probability: number; // 0.0 - 1.0 (skip for now)
}

export type FakerArg =
  | string
  | number
  | boolean
  | { json: string }
  | Record<string, unknown>;

// Hierarchical array length map that mirrors document structure
export type ArrayLengthMap = {
  [fieldName: string]: number | ArrayLengthMap;
};

// Script generation options
export interface ScriptOptions {
  documentCount: number;
  databaseName: string;
  collectionName: string;
  arrayLengthMap: ArrayLengthMap; // Hierarchical map mirroring document structure
}

// Document structure building types
export interface NestedStructure {
  [key: string]: NestedStructureValue;
}

export type NestedStructureValue =
  | ProcessedFieldMapping // Leaf node - actual faker mapping
  | NestedStructure // Branch node - nested object
  | ArrayStructure; // Array node

export interface ArrayStructure {
  type: 'array';
  arrayLevels: number;
  elementStructure: NestedStructureValue;
}

// Script generation result
export interface ScriptGenerationResult {
  script: string;
  success: boolean;
  errors?: string[];
}

/**
 * Converts a single field mapping to faker.js code
 */
export function generateFakerCall(mapping: ProcessedFieldMapping): string {
  const method =
    mapping.fakerMethod === 'unrecognized'
      ? getDefaultFakerMethod(mapping.mongoType)
      : mapping.fakerMethod;

  const args = formatFakerArgs(mapping.fakerArgs);
  return `faker.${method}(${args})`;
}

/**
 * Converts flat field paths to nested object structure
 */
export function buildDocumentStructure(
  schema: ProcessedFakerSchema
): NestedStructure {
  // Group fields by their array parent to handle array elements together
  const arrayGroups = new Map<string, Array<[string, ProcessedFieldMapping]>>();
  const regularFields: Array<[string, ProcessedFieldMapping]> = [];

  // First pass: identify and group array fields
  for (const [fieldPath, mapping] of Object.entries(schema)) {
    // Match array notation: field.subfield[] or field.subfield[][].remaining
    // Ensures [] only appears at the end of a field part (before . or end of string)
    const arrayMatch = fieldPath.match(/^(.+?)(\[\])+(?:\.(.+))?$/);
    if (arrayMatch) {
      const [, arrayPath, brackets, remainingPath] = arrayMatch;
      const arrayKey = arrayPath + brackets;

      if (!arrayGroups.has(arrayKey)) {
        arrayGroups.set(arrayKey, []);
      }
      arrayGroups.get(arrayKey)!.push([remainingPath || '', mapping]);
    } else {
      regularFields.push([fieldPath, mapping]);
    }
  }

  // Sort regular fields by complexity
  const sortedRegularFields = regularFields.sort(
    ([pathA], [pathB]) => countSeparators(pathA) - countSeparators(pathB)
  );

  const result: NestedStructure = {};

  // Process regular fields first
  for (const [fieldPath, mapping] of sortedRegularFields) {
    buildFieldPath(result, fieldPath.split('.'), mapping);
  }

  // Process array groups
  for (const [arrayPath, fields] of arrayGroups) {
    const arrayMatch = arrayPath.match(/^(.+?)(\[\])+$/);
    if (arrayMatch) {
      const [, basePath, brackets] = arrayMatch;
      const arrayLevels = brackets.length / 2;

      // Check if this is a direct array element (no remaining paths)
      const hasDirectElement = fields.some(([remainingPath]) => !remainingPath);

      if (hasDirectElement && fields.length === 1) {
        // Single direct array element (like users[] where users is array of primitives)
        const [, mapping] = fields[0];
        buildFieldPath(result, basePath.split('.'), {
          type: 'array',
          arrayLevels,
          elementStructure: mapping,
        } as ArrayStructure);
      } else {
        // Array of objects or mixed case - build element structure
        const elementStructure: NestedStructure = {};
        for (const [remainingPath, mapping] of fields) {
          if (remainingPath) {
            buildFieldPath(elementStructure, remainingPath.split('.'), mapping);
          } else {
            // This shouldn't happen in well-formed schemas, but handle gracefully
            // Treat as a field named with empty string
            elementStructure[''] = mapping;
          }
        }

        // Add the array structure to the result
        buildFieldPath(result, basePath.split('.'), {
          type: 'array',
          arrayLevels,
          elementStructure,
        } as ArrayStructure);
      }
    }
  }

  return result;
}

/**
 * Helper function to build a field path in a nested structure
 */
function buildFieldPath(
  structure: NestedStructure,
  pathParts: string[],
  value: ProcessedFieldMapping | ArrayStructure
): void {
  let current = structure;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];

    if (i === pathParts.length - 1) {
      // Final part - set the value
      current[part] = value;
    } else {
      // Intermediate part - ensure object exists
      if (
        typeof current[part] !== 'object' ||
        current[part] === null ||
        'type' in current[part]
      ) {
        current[part] = {};
      }
      current = current[part] as NestedStructure;
    }
  }
}

/**
 * Counts separators in a field path (dots and array brackets)
 */
function countSeparators(fieldPath: string): number {
  const dotCount = fieldPath.split('.').length - 1;
  const bracketCount = fieldPath.split('[]').length - 1;
  return dotCount + bracketCount;
}

/**
 * Generates complete mongosh script with faker.js integration
 */
export function generateMongoshScript(
  schema: ProcessedFakerSchema,
  options: ScriptOptions
): ScriptGenerationResult {
  try {
    const documentStructure = buildDocumentStructure(schema);

    const script = `// Mock Data Generator Script
// Generated for collection: ${options.databaseName}.${options.collectionName}
// Document count: ${options.documentCount}

const { faker } = require('@faker-js/faker');

// Connect to database
use('${options.databaseName}');

// Document generation function
function generateDocument() {
  return {
${generateDocumentCode(documentStructure, options.arrayLengthMap, 4)}
  };
}

// Generate and insert documents
const documents = [];
for (let i = 0; i < ${options.documentCount}; i++) {
  documents.push(generateDocument());
}

// Insert documents into collection
db.getCollection('${options.collectionName}').insertMany(documents);

console.log(\`Successfully inserted \${documents.length} documents into ${
      options.databaseName
    }.${options.collectionName}\`);`;

    return {
      script,
      success: true,
    };
  } catch (error) {
    return {
      script: '',
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Generates JavaScript code for document structure
 */
function generateDocumentCode(
  structure: NestedStructure,
  arrayLengthMap: ArrayLengthMap,
  indent: number
): string {
  const spaces = ' '.repeat(indent);
  const lines: string[] = [];

  Object.entries(structure).forEach(([key, value]) => {
    if ('mongoType' in value) {
      // Leaf node - generate faker call
      const fakerCall = generateFakerCall(value as ProcessedFieldMapping);
      const escapedKey = key.replace(/'/g, "\\'");
      lines.push(`${spaces}'${escapedKey}': ${fakerCall},`);
    } else if ('type' in value && value.type === 'array') {
      // Array node - generate array with appropriate length
      const arrayStructure = value as ArrayStructure;
      // Look up array length from hierarchical map
      const arrayLength =
        typeof arrayLengthMap[key] === 'number' ? arrayLengthMap[key] : 3; // default

      // For element generation, pass nested map context
      const nestedArrayLengthMap =
        typeof arrayLengthMap[key] === 'object' ? arrayLengthMap[key] : {};

      const elementCode = generateValueCode(
        arrayStructure.elementStructure,
        nestedArrayLengthMap,
        indent + 2
      );

      // Generate nested arrays correctly
      let arrayCode = elementCode;
      for (let level = 0; level < arrayStructure.arrayLevels; level++) {
        arrayCode = `Array.from({length: ${arrayLength}}, () => ${arrayCode})`;
      }
      const escapedKey = key.replace(/'/g, "\\'");
      lines.push(`${spaces}'${escapedKey}': ${arrayCode},`);
    } else {
      // Nested object
      const escapedKey = key.replace(/'/g, "\\'");
      lines.push(`${spaces}'${escapedKey}': {`);

      // For nested objects, pass the nested map context if it exists
      const nestedArrayLengthMap =
        typeof arrayLengthMap[key] === 'object'
          ? arrayLengthMap[key]
          : arrayLengthMap; // Use current map if no specific nested context

      lines.push(
        generateDocumentCode(
          value as NestedStructure,
          nestedArrayLengthMap,
          indent + 2
        )
      );
      lines.push(`${spaces}},`);
    }
  });

  return lines.join('\n');
}

/**
 * Generates code for a single value (used in arrays and objects)
 */
function generateValueCode(
  value: NestedStructureValue,
  arrayLengthMap: ArrayLengthMap,
  indent: number
): string {
  if ('mongoType' in value) {
    // Leaf node - return faker call
    return generateFakerCall(value as ProcessedFieldMapping);
  } else if ('type' in value && value.type === 'array') {
    // Nested array - this occurs when arrays are elements of other arrays
    const arrayStructure = value as ArrayStructure;
    const arrayLength = 3; // Use default for nested arrays in element generation
    const elementCode = generateValueCode(
      arrayStructure.elementStructure,
      {}, // Empty map for deeply nested arrays
      indent
    );
    // Generate nested arrays correctly
    let arrayCode = elementCode;
    for (let level = 0; level < arrayStructure.arrayLevels; level++) {
      arrayCode = `Array.from({length: ${arrayLength}}, () => ${arrayCode})`;
    }
    return arrayCode;
  } else {
    // Nested object
    return `{\n${generateDocumentCode(
      value as NestedStructure,
      arrayLengthMap,
      indent
    )}\n${' '.repeat(indent - 2)}}`;
  }
}

/**
 * Gets default faker method for unrecognized fields based on MongoDB type
 */
export function getDefaultFakerMethod(mongoType: string): string {
  switch (mongoType.toLowerCase()) {
    case 'string':
      return 'lorem.word';
    case 'number':
    case 'int32':
    case 'int64':
    case 'double':
      return 'number.int';
    case 'date':
      return 'date.recent';
    case 'objectid':
      return 'database.mongodbObjectId';
    case 'boolean':
      return 'datatype.boolean';
    case 'decimal128':
      return 'number.float';
    case 'binary':
      return 'string.hexadecimal';
    default:
      return 'lorem.word';
  }
}

/**
 * Converts faker arguments to JavaScript code
 */
export function formatFakerArgs(fakerArgs: FakerArg[]): string {
  const argParts: string[] = [];

  for (const arg of fakerArgs) {
    if (typeof arg === 'string') {
      // Escape single quotes in strings
      const escapedArg = arg.replace(/'/g, "\\'");
      argParts.push(`'${escapedArg}'`);
    } else if (typeof arg === 'number' || typeof arg === 'boolean') {
      argParts.push(`${arg}`);
    } else if (typeof arg === 'object' && arg !== null && 'json' in arg) {
      const jsonArg = arg as { json: string };
      const parsed = JSON.parse(jsonArg.json);
      if (Array.isArray(parsed)) {
        const arrayArgsStr =
          '[' + parsed.map((item) => `'${String(item)}'`).join(', ') + ']';
        argParts.push(arrayArgsStr);
      } else {
        argParts.push(JSON.stringify(parsed));
      }
    } else if (typeof arg === 'object' && arg !== null) {
      // Handle Record<string, unknown>
      argParts.push(JSON.stringify(arg));
    }
  }

  return argParts.join(', ');
}
