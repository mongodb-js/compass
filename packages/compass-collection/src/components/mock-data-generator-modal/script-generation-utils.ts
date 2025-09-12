export type FakerArg = string | number | boolean | { json: string };

const DEFAULT_ARRAY_LENGTH = 3;
const INDENT_SIZE = 2;

export interface FieldMapping {
  mongoType: string;
  fakerMethod: string;
  fakerArgs: FakerArg[];
  probability?: number; // 0.0 - 1.0 frequency of field (defaults to 1.0)
}

// Array length configuration for different array types
export type ArrayLengthMap = {
  [fieldName: string]:
    | number[] // Multi-dimensional: [2, 3, 4]
    | ArrayObjectConfig; // Array of objects
};

export interface ArrayObjectConfig {
  length?: number; // Length of the parent array (optional for nested object containers)
  elements: ArrayLengthMap; // Configuration for nested arrays
}

export interface ScriptOptions {
  documentCount: number;
  databaseName: string;
  collectionName: string;
  arrayLengthMap?: ArrayLengthMap;
}

export type ScriptResult =
  | { script: string; success: true }
  | { error: string; success: false };

type DocumentStructure = {
  [fieldName: string]:
    | FieldMapping // Leaf: actual data field
    | DocumentStructure // Object: nested fields
    | ArrayStructure; // Array: repeated elements
};

interface ArrayStructure {
  type: 'array';
  elementType: FieldMapping | DocumentStructure | ArrayStructure;
}

/**
 * Entry point method: Generate the final script
 */
export function generateScript(
  schema: Record<string, FieldMapping>,
  options: ScriptOptions
): ScriptResult {
  try {
    const structure = buildDocumentStructure(schema);

    const documentCode = generateDocumentCode(
      structure,
      INDENT_SIZE * 2, // 4 spaces: 2 for function body + 2 for inside return statement
      options.arrayLengthMap
    );

    // Escape ' and ` in database/collection names for template literals
    const escapedDbName = options.databaseName
      .replace(/'/g, "\\'")
      .replace(/`/g, '\\`');
    const escapedCollectionName = options.collectionName
      .replace(/'/g, "\\'")
      .replace(/`/g, '\\`');

    const script = `// Mock Data Generator Script
// Generated for collection: ${escapedDbName}.${escapedCollectionName}
// Document count: ${options.documentCount}

const { faker } = require('@faker-js/faker');

// Connect to database
use('${escapedDbName}');

// Document generation function
function generateDocument() {
  return ${documentCode};
}

// Generate and insert documents
const documents = [];
for (let i = 0; i < ${options.documentCount}; i++) {
  documents.push(generateDocument());
}

// Insert documents into collection
db.getCollection('${escapedCollectionName}').insertMany(documents);

console.log(\`Successfully inserted \${documents.length} documents into ${escapedDbName}.${escapedCollectionName}\`);`;

    return {
      script,
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse a field path into simple parts
 *
 * Examples:
 * "name" → ["name"]
 * "user.email" → ["user", "email"]
 * "tags[]" → ["tags", "[]"]
 * "users[].name" → ["users", "[]", "name"]
 * "matrix[][]" → ["matrix", "[]", "[]"]
 */
function parseFieldPath(fieldPath: string): string[] {
  const parts: string[] = [];
  let current = '';

  for (let i = 0; i < fieldPath.length; i++) {
    const char = fieldPath[i];

    if (char === '.') {
      if (current) {
        parts.push(current);
        current = '';
      } else if (parts.length > 0 && parts[parts.length - 1] === '[]') {
        // This is valid: "users[].name" - dot after array notation
        // Continue parsing
      } else {
        throw new Error(
          `Invalid field path "${fieldPath}": empty field name before dot`
        );
      }
    } else if (char === '[' && fieldPath[i + 1] === ']') {
      // Only treat [] as array notation if it's at the end, followed by a dot, or followed by another [
      const isAtEnd = i + 2 >= fieldPath.length;
      const isFollowedByDot =
        i + 2 < fieldPath.length && fieldPath[i + 2] === '.';
      const isFollowedByBracket =
        i + 2 < fieldPath.length && fieldPath[i + 2] === '[';

      if (isAtEnd || isFollowedByDot || isFollowedByBracket) {
        // This is array notation
        if (current) {
          parts.push(current);
          current = '';
        }
        parts.push('[]');
        i++; // Skip the ]
      } else {
        // This is just part of the field name
        current += char;
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  if (parts.length === 0) {
    throw new Error(
      `Invalid field path "${fieldPath}": no valid field names found`
    );
  }

  return parts;
}

/**
 * Build the document structure from all field paths
 */
function buildDocumentStructure(
  schema: Record<string, FieldMapping>
): DocumentStructure {
  const result: DocumentStructure = {};

  // Process each field path
  for (const [fieldPath, mapping] of Object.entries(schema)) {
    const pathParts = parseFieldPath(fieldPath);
    insertIntoStructure(result, pathParts, mapping);
  }

  return result;
}

/**
 * Insert a field mapping into the structure at the given path
 */
function insertIntoStructure(
  structure: DocumentStructure,
  pathParts: string[],
  mapping: FieldMapping
): void {
  if (pathParts.length === 0) {
    throw new Error('Cannot insert field mapping: empty path parts array');
  }

  // Base case: insert root-level field mapping
  if (pathParts.length === 1) {
    const part = pathParts[0];
    if (part === '[]') {
      throw new Error(
        'Invalid field path: array notation "[]" cannot be used without a field name'
      );
    }
    structure[part] = mapping;
    return;
  }

  // Recursive case
  const [firstPart, secondPart, ...remainingParts] = pathParts;

  if (secondPart === '[]') {
    // This is an array field
    // Initialize array structure if it doesn't exist yet
    if (
      !structure[firstPart] ||
      typeof structure[firstPart] !== 'object' ||
      !('type' in structure[firstPart]) ||
      structure[firstPart].type !== 'array'
    ) {
      structure[firstPart] = {
        type: 'array',
        elementType: {},
      };
    }

    const arrayStructure = structure[firstPart] as ArrayStructure;

    if (remainingParts.length === 0) {
      // Terminal case: Array of primitives (e.g., "tags[]")
      // Directly assign the field mapping as the element type
      arrayStructure.elementType = mapping;
    } else if (remainingParts[0] === '[]') {
      // Nested array case: Multi-dimensional arrays (e.g., "matrix[][]")
      // Build nested array structure
      let currentArray = arrayStructure;
      let i = 0;

      // Process consecutive [] markers to build nested array structure
      // Each iteration creates one array dimension (eg. matrix[][] = 2 iterations)
      while (i < remainingParts.length && remainingParts[i] === '[]') {
        // Create the next array dimension
        currentArray.elementType = {
          type: 'array',
          elementType: {},
        };

        // Move to the next nesting level
        currentArray = currentArray.elementType;
        i++;
      }

      if (i < remainingParts.length) {
        // This is an multi-dimensional array of documents (e.g., "matrix[][].name")
        // Ensure we have a document structure for the remaining fields
        if (
          typeof currentArray.elementType !== 'object' ||
          'mongoType' in currentArray.elementType ||
          'type' in currentArray.elementType
        ) {
          currentArray.elementType = {};
        }
        // Recursively build the document
        insertIntoStructure(
          currentArray.elementType,
          remainingParts.slice(i),
          mapping
        );
      } else {
        // Pure multi-dimensional array - assign the mapping
        currentArray.elementType = mapping;
      }
    } else {
      // Object case: Array of documents with fields (e.g., "users[].name", "users[].profile.email")
      // Only initialize if elementType isn't already a proper object structure
      if (
        typeof arrayStructure.elementType !== 'object' ||
        'mongoType' in arrayStructure.elementType ||
        'type' in arrayStructure.elementType
      ) {
        arrayStructure.elementType = {};
      }

      // Recursively build the object structure for array elements
      insertIntoStructure(arrayStructure.elementType, remainingParts, mapping);
    }
  } else {
    // This is a regular object field
    // Only initialize if it doesn't exist or isn't a plain object
    if (
      !structure[firstPart] ||
      typeof structure[firstPart] !== 'object' ||
      'type' in structure[firstPart] ||
      'mongoType' in structure[firstPart]
    ) {
      structure[firstPart] = {};
    }

    insertIntoStructure(
      structure[firstPart],
      [secondPart, ...remainingParts],
      mapping
    );
  }
}

/**
 * Generate JavaScript object code from document structure
 */
function generateDocumentCode(
  structure: DocumentStructure,
  indent: number = INDENT_SIZE,
  arrayLengthMap: ArrayLengthMap = {}
): string {
  // For each field in structure:
  //   - If FieldMapping: generate faker call
  //   - If DocumentStructure: generate nested object
  //   - If ArrayStructure: generate array

  const fieldIndent = ' '.repeat(indent);
  const closingBraceIndent = ' '.repeat(indent - INDENT_SIZE);
  const rootLevelFields: string[] = [];

  for (const [fieldName, value] of Object.entries(structure)) {
    if ('mongoType' in value) {
      // It's a field mapping
      const mapping = value as FieldMapping;
      const fakerCall = generateFakerCall(mapping);
      // Default to 1.0 for invalid probability values
      let probability = 1.0;
      if (
        mapping.probability !== undefined &&
        typeof mapping.probability === 'number' &&
        mapping.probability >= 0 &&
        mapping.probability <= 1
      ) {
        probability = mapping.probability;
      }

      if (probability < 1.0) {
        // Use Math.random for conditional field inclusion
        rootLevelFields.push(
          `${fieldIndent}...(Math.random() < ${probability} ? { ${fieldName}: ${fakerCall} } : {})`
        );
      } else {
        // Normal field inclusion
        rootLevelFields.push(`${fieldIndent}${fieldName}: ${fakerCall}`);
      }
    } else if ('type' in value && value.type === 'array') {
      // It's an array
      const arrayCode = generateArrayCode(
        value as ArrayStructure,
        indent + INDENT_SIZE,
        fieldName,
        arrayLengthMap,
        0 // Start at dimension 0
      );
      rootLevelFields.push(`${fieldIndent}${fieldName}: ${arrayCode}`);
    } else {
      // It's a nested object: recursive call

      // Get nested array length map for this field,
      // including type validation and fallback for malformed maps
      const arrayInfo = arrayLengthMap[fieldName];
      const nestedArrayLengthMap =
        arrayInfo && !Array.isArray(arrayInfo) && 'elements' in arrayInfo
          ? arrayInfo.elements
          : {};

      const nestedCode = generateDocumentCode(
        value as DocumentStructure,
        indent + INDENT_SIZE,
        nestedArrayLengthMap
      );
      rootLevelFields.push(`${fieldIndent}${fieldName}: ${nestedCode}`);
    }
  }

  // Handle empty objects
  if (rootLevelFields.length === 0) {
    return '{}';
  }

  return `{\n${rootLevelFields.join(',\n')}\n${closingBraceIndent}}`;
}

/**
 * Generate array code
 */
function generateArrayCode(
  arrayStructure: ArrayStructure,
  indent: number = INDENT_SIZE,
  fieldName: string = '',
  arrayLengthMap: ArrayLengthMap = {},
  dimensionIndex: number = 0
): string {
  const elementType = arrayStructure.elementType;

  // Get array length for this dimension
  const arrayInfo = arrayLengthMap[fieldName];
  let arrayLength = DEFAULT_ARRAY_LENGTH;

  if (Array.isArray(arrayInfo)) {
    // single or multi-dimensional array: eg. [2, 3, 4] or [6]
    arrayLength = arrayInfo[dimensionIndex] ?? DEFAULT_ARRAY_LENGTH; // Fallback for malformed array map
  } else if (arrayInfo && 'length' in arrayInfo) {
    // Array of objects/documents
    arrayLength = arrayInfo.length ?? DEFAULT_ARRAY_LENGTH;
  }

  if ('mongoType' in elementType) {
    // Array of primitives
    const fakerCall = generateFakerCall(elementType as FieldMapping);
    return `Array.from({length: ${arrayLength}}, () => ${fakerCall})`;
  } else if ('type' in elementType && elementType.type === 'array') {
    // Nested array (e.g., matrix[][]) - keep same fieldName, increment dimension
    const nestedArrayCode = generateArrayCode(
      elementType as ArrayStructure,
      indent,
      fieldName,
      arrayLengthMap,
      dimensionIndex + 1 // Next dimension
    );
    return `Array.from({length: ${arrayLength}}, () => ${nestedArrayCode})`;
  } else {
    // Array of objects
    const nestedArrayLengthMap =
      arrayInfo && !Array.isArray(arrayInfo) && 'elements' in arrayInfo
        ? arrayInfo.elements
        : {}; // Fallback to empty map for malformed array map
    const objectCode = generateDocumentCode(
      elementType as DocumentStructure,
      indent,
      nestedArrayLengthMap
    );
    return `Array.from({length: ${arrayLength}}, () => ${objectCode})`;
  }
}

/**
 * Generate faker.js call from field mapping
 */
function generateFakerCall(mapping: FieldMapping): string {
  const method =
    mapping.fakerMethod === 'unrecognized'
      ? getDefaultFakerMethod(mapping.mongoType)
      : mapping.fakerMethod;

  const args = formatFakerArgs(mapping.fakerArgs);
  return `faker.${method}(${args})`;
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
      return 'number.int';
    case 'double':
    case 'decimal128':
      return 'number.float';
    case 'date':
      return 'date.recent';
    case 'objectid':
      return 'database.mongodbObjectId';
    case 'boolean':
      return 'datatype.boolean';
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
  const stringifiedArgs: string[] = [];

  for (let i = 0; i < fakerArgs.length; i++) {
    const arg = fakerArgs[i];

    if (typeof arg === 'string') {
      // Escape single quotes for JS strings (and backticks for security)
      const escapedArg = arg.replace(/[`']/g, '\\$&');
      stringifiedArgs.push(`'${escapedArg}'`);
    } else if (typeof arg === 'number') {
      if (!Number.isFinite(arg)) {
        throw new Error(
          `Invalid number argument at index ${i}: must be a finite number`
        );
      }
      stringifiedArgs.push(`${arg}`);
    } else if (typeof arg === 'boolean') {
      stringifiedArgs.push(`${arg}`);
    } else if (typeof arg === 'object' && arg !== null && 'json' in arg) {
      // Pre-serialized JSON objects
      const jsonArg = arg as { json: string };
      stringifiedArgs.push(jsonArg.json);
    } else {
      throw new Error(
        `Invalid argument type at index ${i}: expected string, number, boolean, or {json: string}`
      );
    }
  }

  return stringifiedArgs.join(', ');
}
