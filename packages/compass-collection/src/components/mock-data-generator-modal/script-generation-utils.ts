export interface FieldMapping {
  mongoType: string;
  fakerMethod: string;
  fakerArgs: any[]; // TODO: type this properly later
}

export interface ScriptOptions {
  documentCount: number;
  databaseName: string;
  collectionName: string;
  // TODO: array lengths - for now use fixed length
}

export interface ScriptResult {
  script: string;
  success: boolean;
  error?: string;
}

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
      }
    } else if (char === '[' && fieldPath[i + 1] === ']') {
      if (current) {
        parts.push(current);
        current = '';
      }
      parts.push('[]');
      i++; // Skip the ]
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
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
    // This shouldn't happen
    // TODO: log error
    return;
  }

  // Base case: insert root-level field mapping
  if (pathParts.length === 1) {
    const part = pathParts[0];
    if (part === '[]') {
      // This shouldn't happen - array without field name
      // TODO: log error
      return;
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
 * Generate the final script
 */
export function generateScript(
  schema: Record<string, FieldMapping>,
  options: ScriptOptions
): ScriptResult {
  try {
    const structure = buildDocumentStructure(schema);

    const documentCode = generateDocumentCode(structure);

    // Escape ' and ` in database/collection names for template literals
    const escapedDbName = options.databaseName
      .replace(/'/g, "\\'")
      .replace(/`/g, '\\`');
    const escapedCollectionName = options.collectionName
      .replace(/'/g, "\\'")
      .replace(/`/g, '\\`');

    // Validate document count
    const documentCount = Math.max(
      1,
      Math.min(10000, Math.floor(options.documentCount))
    );

    const script = `// Mock Data Generator Script
// Generated for collection: ${escapedDbName}.${escapedCollectionName}
// Document count: ${documentCount}

const { faker } = require('@faker-js/faker');

// Connect to database
use('${escapedDbName}');

// Document generation function
function generateDocument() {
  return ${documentCode};
}

// Generate and insert documents
const documents = [];
for (let i = 0; i < ${documentCount}; i++) {
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
      script: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate JavaScript object code from document structure
 */
function generateDocumentCode(structure: DocumentStructure): string {
  // For each field in structure:
  //   - If FieldMapping: generate faker call
  //   - If DocumentStructure: generate nested object
  //   - If ArrayStructure: generate array

  const parts: string[] = [];

  for (const [fieldName, value] of Object.entries(structure)) {
    if ('mongoType' in value) {
      // It's a field mapping
      const fakerCall = generateFakerCall(value as FieldMapping);
      parts.push(`  ${fieldName}: ${fakerCall}`);
    } else if ('type' in value && value.type === 'array') {
      // It's an array
      const arrayCode = generateArrayCode(value as ArrayStructure);
      parts.push(`  ${fieldName}: ${arrayCode}`);
    } else {
      // It's a nested object: recursive call
      const nestedCode = generateDocumentCode(value as DocumentStructure);
      parts.push(`  ${fieldName}: ${nestedCode}`);
    }
  }

  return `{\n${parts.join(',\n')}\n}`;
}

/**
 * Generate array code
 */
function generateArrayCode(arrayStructure: ArrayStructure): string {
  const elementType = arrayStructure.elementType;

  // Fixed length for now - TODO: make configurable
  const arrayLength = 3;

  if ('mongoType' in elementType) {
    // Array of primitives
    const fakerCall = generateFakerCall(elementType as FieldMapping);
    return `Array.from({length: ${arrayLength}}, () => ${fakerCall})`;
  } else if ('type' in elementType && elementType.type === 'array') {
    // Nested array (e.g., matrix[][])
    const nestedArrayCode = generateArrayCode(elementType as ArrayStructure);
    return `Array.from({length: ${arrayLength}}, () => ${nestedArrayCode})`;
  } else {
    // Array of objects
    const objectCode = generateDocumentCode(elementType as DocumentStructure);
    return `Array.from({length: ${arrayLength}}, () => ${objectCode})`;
  }
}

/**
 * Generate faker.js call from field mapping
 */
function generateFakerCall(mapping: FieldMapping): string {
  // TODO: Handle arguments properly
  return `faker.${mapping.fakerMethod}()`;
}
