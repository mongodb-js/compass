import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import type { FakerFieldMapping } from './types';
import { prettify } from '@mongodb-js/compass-editor';
import { faker } from '@faker-js/faker/locale/en';

export type FakerArg =
  | string
  | number
  | boolean
  | { json: string }
  | FakerArg[];

const DEFAULT_ARRAY_LENGTH = 3;

// Stores the average array length of each array.
// Examples:
//   "users[]": 5 - users array has 5 elements
//   "users[].posts[]": 3 - each user has 3 posts
//   "matrix[]": 3, "matrix[][]": 4 - matrix has 3 rows, each row has 4 columns
export type ArrayLengthMap = Record<string, number>;

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
    | FakerFieldMapping // Leaf: actual data field
    | DocumentStructure // Object: nested fields
    | ArrayStructure; // Array: repeated elements
};

interface ArrayStructure {
  type: 'array';
  elementType: FakerFieldMapping | DocumentStructure | ArrayStructure;
}

/**
 * Entry point method: Generate the final script
 */
export function generateScript(
  schema: Record<string, FakerFieldMapping>,
  options: ScriptOptions
): ScriptResult {
  try {
    const structure = buildDocumentStructure(schema);

    const documentCode = renderDocumentCode(
      structure,
      options.arrayLengthMap || {}
    );

    // Generate unformatted script
    const unformattedScript = `// Mock Data Generator Script
// Generated for database: ${options.databaseName.replace(
      /[\r\n]/g, // Prevent newlines in names that could break the comment
      ' '
    )}; collection: ${options.collectionName.replace(/[\r\n]/g, ' ')}
// Document count: ${options.documentCount}

const { faker } = require('@faker-js/faker');

// Connect to database
use(${JSON.stringify(options.databaseName)});

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
db.getCollection(${JSON.stringify(
      options.collectionName
    )}).insertMany(documents);

console.log(\`Successfully inserted \${documents.length} documents into ${options.databaseName.replace(
      /[\\`$]/g, // Escape backslashes, backticks and dollar signs
      '\\$&'
    )}.${options.collectionName.replace(/[\\`$]/g, '\\$&')}\`);`;

    // Format the script using prettier
    const script = prettify(unformattedScript, 'javascript');

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
  schema: Record<string, FakerFieldMapping>
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
  mapping: FakerFieldMapping
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
function renderDocumentCode(
  structure: DocumentStructure,
  arrayLengthMap: ArrayLengthMap = {},
  currentPath: string = ''
): string {
  // For each field in structure:
  //   - If FakerFieldMapping: generate faker call
  //   - If DocumentStructure: generate nested object
  //   - If ArrayStructure: generate array

  const documentFields: string[] = [];

  for (const [fieldName, value] of Object.entries(structure)) {
    if ('mongoType' in value) {
      // It's a field mapping
      const mapping = value as FakerFieldMapping;
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
        documentFields.push(
          `...(Math.random() < ${probability} ? { ${formatFieldName(
            fieldName
          )}: ${fakerCall} } : {})`
        );
      } else {
        // Normal field inclusion
        documentFields.push(`${formatFieldName(fieldName)}: ${fakerCall}`);
      }
    } else if ('type' in value && value.type === 'array') {
      // It's an array
      const fieldPath = currentPath
        ? `${currentPath}.${fieldName}[]`
        : `${fieldName}[]`;
      const arrayCode = renderArrayCode(
        value as ArrayStructure,
        fieldName,
        arrayLengthMap,
        fieldPath
      );
      documentFields.push(`${formatFieldName(fieldName)}: ${arrayCode}`);
    } else {
      // It's a nested object: recursive call

      const nestedPath = currentPath
        ? `${currentPath}.${fieldName}`
        : fieldName;

      const nestedCode = renderDocumentCode(
        value as DocumentStructure,
        arrayLengthMap,
        nestedPath
      );
      documentFields.push(`${formatFieldName(fieldName)}: ${nestedCode}`);
    }
  }

  // Handle empty objects
  if (documentFields.length === 0) {
    return '{}';
  }

  return `{${documentFields.join(',')}}`;
}

/**
 * Formats a field name for use in JavaScript object literal syntax.
 * Only quotes field names that need it, using JSON.stringify for proper escaping.
 */
function formatFieldName(fieldName: string): string {
  // If it's a valid JavaScript identifier, don't quote it
  const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(fieldName);

  if (isValidIdentifier) {
    return fieldName;
  } else {
    // Use JSON.stringify for proper escaping of special characters
    return JSON.stringify(fieldName);
  }
}

/**
 * Generate array code
 */
function renderArrayCode(
  arrayStructure: ArrayStructure,
  fieldName: string = '',
  arrayLengthMap: ArrayLengthMap = {},
  currentFieldPath: string = ''
): string {
  const elementType = arrayStructure.elementType;

  // Get array length for this dimension
  let arrayLength = DEFAULT_ARRAY_LENGTH;
  if (currentFieldPath && arrayLengthMap[currentFieldPath] !== undefined) {
    arrayLength = arrayLengthMap[currentFieldPath];
  }

  if ('mongoType' in elementType) {
    // Array of primitives
    const fakerCall = generateFakerCall(elementType as FakerFieldMapping);
    return `Array.from({length: ${arrayLength}}, () => ${fakerCall})`;
  } else if ('type' in elementType && elementType.type === 'array') {
    // Nested array (e.g., matrix[][]) - append another [] to the path
    const fieldPath = currentFieldPath + '[]';
    const nestedArrayCode = renderArrayCode(
      elementType as ArrayStructure,
      fieldName,
      arrayLengthMap,
      fieldPath
    );
    return `Array.from({length: ${arrayLength}}, () => ${nestedArrayCode})`;
  } else {
    const objectCode = renderDocumentCode(
      elementType as DocumentStructure,
      arrayLengthMap,
      currentFieldPath
    );
    return `Array.from({length: ${arrayLength}}, () => (${objectCode}))`;
  }
}

/**
 * Generate faker.js call from field mapping
 */
function generateFakerCall(mapping: FakerFieldMapping): string {
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
export function getDefaultFakerMethod(mongoType: MongoDBFieldType): string {
  switch (mongoType) {
    // String types
    case 'String':
      return 'lorem.word';

    // Numeric types
    case 'Number':
    case 'Int32':
    case 'Long':
      return 'number.int';
    case 'Decimal128':
      return 'number.float';

    // Date and time types
    case 'Date':
    case 'Timestamp':
      return 'date.recent';

    // Object identifier
    case 'ObjectId':
      return 'database.mongodbObjectId';

    // Boolean
    case 'Boolean':
      return 'datatype.boolean';

    // Binary
    case 'Binary':
      return 'string.hexadecimal';

    // Regular expression
    case 'RegExp':
      return 'lorem.word';

    // JavaScript code
    case 'Code':
      return 'lorem.sentence';

    // MinKey and MaxKey
    case 'MinKey':
      return 'number.int';
    case 'MaxKey':
      return 'number.int';

    // Symbol (deprecated)
    case 'Symbol':
      return 'lorem.word';

    // DBRef
    case 'DBRef':
      return 'database.mongodbObjectId';

    // Default fallback
    default:
      return 'lorem.word';
  }
}

/**
 * Converts array of faker arguments to comma separated string for function calls.
 *
 * Serializes various argument types into valid JavaScript syntax:
 * - Strings: Uses JSON.stringify() to handle quotes, newlines, and special characters
 * - Numbers: Validates finite numbers and converts to string representation
 * - Booleans: Converts to 'true' or 'false' literals
 * - Objects with 'json' property: Parses and re-stringifies JSON for validation
 *
 * @param fakerArgs - Array of arguments to convert to JavaScript code
 * @returns Comma-separated string of JavaScript arguments, or empty string if no args
 * @throws Error if arguments contain invalid values (non-finite numbers, malformed JSON)
 *
 * @example
 * formatFakerArgs(['male', 25, true]) // Returns: '"male", 25, true'
 * formatFakerArgs([{json: '{"min": 1}'}]) // Returns: '{"min": 1}'
 */
export function formatFakerArgs(fakerArgs: FakerArg[]): string {
  const stringifiedArgs: string[] = [];

  for (let i = 0; i < fakerArgs.length; i++) {
    const arg = fakerArgs[i];

    if (typeof arg === 'string') {
      stringifiedArgs.push(JSON.stringify(arg));
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

type Document = Record<string, unknown>;

/**
 * Generates documents for the PreviewScreen component.
 * Executes faker methods to create actual document objects.
 */
export function generateDocument(
  fakerSchema: Record<string, FakerFieldMapping>,
  arrayLengthMap: ArrayLengthMap = {}
): Document {
  const structure = buildDocumentStructure(fakerSchema);
  return constructDocumentValues(structure, arrayLengthMap);
}

/**
 * Construct actual document values from document structure.
 * Mirrors renderDocumentCode but executes faker calls instead of generating code.
 */
function constructDocumentValues(
  structure: DocumentStructure,
  arrayLengthMap: ArrayLengthMap = {},
  currentPath: string = ''
): Document {
  const result: Document = {};

  for (const [fieldName, value] of Object.entries(structure)) {
    try {
      if ('mongoType' in value) {
        // It's a field mapping
        const mapping = value as FakerFieldMapping;

        // Default to 1.0 for invalid probability values
        let probability = 1.0;
        if (
          typeof mapping.probability === 'number' &&
          mapping.probability >= 0 &&
          mapping.probability <= 1
        ) {
          probability = mapping.probability;
        }

        const shouldIncludeField =
          probability >= 1.0 || Math.random() < probability;
        const fakerValue = generateFakerValue(mapping);
        if (fakerValue !== undefined && shouldIncludeField) {
          result[fieldName] = fakerValue;
        }
      } else if ('type' in value && value.type === 'array') {
        // It's an array
        const fieldPath = currentPath
          ? `${currentPath}.${fieldName}[]`
          : `${fieldName}[]`;
        const arrayValue = constructArrayValues(
          value as ArrayStructure,
          fieldName,
          arrayLengthMap,
          fieldPath
        );
        result[fieldName] = arrayValue;
      } else {
        // It's a nested object: recursive call
        const nestedPath = currentPath
          ? `${currentPath}.${fieldName}`
          : fieldName;
        const nestedValue = constructDocumentValues(
          value as DocumentStructure,
          arrayLengthMap,
          nestedPath
        );
        result[fieldName] = nestedValue;
      }
    } catch {
      continue;
    }
  }

  return result;
}

/**
 * Construct array values from array structure.
 * Mirrors renderArrayCode but executes faker calls instead of generating code.
 */
function constructArrayValues(
  arrayStructure: ArrayStructure,
  fieldName: string = '',
  arrayLengthMap: ArrayLengthMap = {},
  currentFieldPath: string = ''
): unknown[] {
  const elementType = arrayStructure.elementType;

  // Get array length for this dimension
  let arrayLength = DEFAULT_ARRAY_LENGTH;
  if (currentFieldPath && arrayLengthMap[currentFieldPath] !== undefined) {
    arrayLength = arrayLengthMap[currentFieldPath];
  }

  const result: unknown[] = [];

  for (let i = 0; i < arrayLength; i++) {
    try {
      if ('mongoType' in elementType) {
        // Array of primitives
        const mapping = elementType as FakerFieldMapping;
        const value = generateFakerValue(mapping);
        if (value !== undefined) {
          result.push(value);
        }
      } else if ('type' in elementType && elementType.type === 'array') {
        // Nested array (e.g., matrix[][]) - append another [] to the path
        const fieldPath = currentFieldPath + '[]';
        const nestedArrayValue = constructArrayValues(
          elementType as ArrayStructure,
          fieldName,
          arrayLengthMap,
          fieldPath
        );
        result.push(nestedArrayValue);
      } else {
        // Array of objects
        const objectValue = constructDocumentValues(
          elementType as DocumentStructure,
          arrayLengthMap,
          currentFieldPath
        );
        result.push(objectValue);
      }
    } catch {
      continue;
    }
  }

  return result;
}

/**
 * Prepare faker arguments for execution.
 * Converts FakerArg[] to actual values that can be passed to faker methods.
 */
function prepareFakerArgs(fakerArgs: FakerArg[]): unknown[] {
  const preparedArgs: unknown[] = [];

  for (const arg of fakerArgs) {
    if (
      typeof arg === 'string' ||
      typeof arg === 'number' ||
      typeof arg === 'boolean'
    ) {
      preparedArgs.push(arg);
    } else if (typeof arg === 'object' && arg !== null && 'json' in arg) {
      // Parse JSON objects
      try {
        const jsonArg = arg as { json: string };
        preparedArgs.push(JSON.parse(jsonArg.json));
      } catch {
        // Skip invalid JSON
        continue;
      }
    }
  }

  return preparedArgs;
}

/**
 * Execute faker method to generate actual values.
 * Mirrors generateFakerCall but executes the call instead of generating code.
 */
function generateFakerValue(
  mapping: FakerFieldMapping
): string | number | boolean | Date | null | undefined {
  const method =
    mapping.fakerMethod === 'unrecognized'
      ? getDefaultFakerMethod(mapping.mongoType)
      : mapping.fakerMethod;

  try {
    // Navigate to the faker method
    const methodParts = method.split('.');
    let fakerMethod: unknown = faker;
    for (const part of methodParts) {
      fakerMethod = (fakerMethod as Record<string, unknown>)[part];
      if (!fakerMethod) {
        throw new Error(`Faker method not found: ${method}`);
      }
    }

    // Prepare arguments
    const args = prepareFakerArgs(mapping.fakerArgs);

    // Call the faker method
    const result = (fakerMethod as (...args: unknown[]) => unknown).apply(
      faker,
      args
    );

    return result as string | number | boolean | Date | null | undefined;
  } catch {
    return undefined;
  }
}
