import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

type FakerFieldMapping = MockDataSchemaResponse['content']['fields'][number];

type FakerCall = `faker.${string}(${string})`;
type FakerCallNode = { [field: string]: FakerCallNode } | FakerCall;

/**
 * Intermediary representation of a faker factory function that can be readily
 * rendered to its pure string representation by {@link toFakerCallTreeString}.
 *
 * e.g.,
 *
 * ```json
 * {
 *   "user_name": "faker.name.fullName()",
 *   "associate": {
 *     "name": "faker.name.fullName()"
 *   }
 * }
 * ```
 */
export type FakerCallTree = { [field: string]: FakerCallNode };

export function parseFakerMappings(schema: {
  fields: Array<FakerFieldMapping>;
}): FakerCallTree {
  for (const field of schema.fields) {
    validateFieldPathParts(field);
    validateOnlySquareBracketsEndFinalPart(field);
  }
  return constructFakerCallTree(schema.fields);
}

/**
 * Assumptions:
 * - Input does not hold conflicts between overlapping paths like "venue.ticket.is_discounted" is a boolean but "venue.ticket" is also a primitive
 */
function constructFakerCallTree(
  fields: Array<FakerFieldMapping>
): FakerCallTree {
  // ensures parent nodes are created before their children
  const sortedFields = [...fields].sort(
    (f1, f2) => countSeparators(f1.fieldPath) - countSeparators(f2.fieldPath)
  );

  const result: FakerCallTree = {};
  for (const mapping of sortedFields) {
    const fieldParts = mapping.fieldPath.split('.');

    if (mapping.isArray) {
      const finalPart = fieldParts[fieldParts.length - 1];
      if (!finalPart.endsWith('[]')) {
        throw Error('expected the array-type field to end with []');
      }

      const partName = finalPart.replace('[]', '');
      if (!partName.length) {
        throw Error('expected fieldPath to be non-empty part before "[]"');
      }

      fieldParts[fieldParts.length - 1] = partName;
    }

    let node = result;
    for (let i = 0; i < fieldParts.length; i++) {
      if (i === fieldParts.length - 1) {
        const fakerCall: FakerCall = `faker.${
          mapping.fakerMethod
        }(${handleFieldArguments(mapping.fakerArgs)})`;
        node[fieldParts[i]] = fakerCall;
        continue;
      }

      const part = fieldParts[i];
      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {};
      }
      node = node[part];
    }
  }

  return result;
}

function handleFieldArguments(
  fieldArgs: FakerFieldMapping['fakerArgs']
): string {
  const argParts: string[] = [];

  for (const i of fieldArgs) {
    if (typeof i === 'string') {
      argParts.push(`'${i}'`);
    } else if (typeof i === 'number' || typeof i === 'boolean' || i === null) {
      argParts.push(`${i}`);
    } else if (i.json) {
      const subargs = JSON.parse(i.json);

      if (Array.isArray(subargs)) {
        const arrayArgsStr =
          '[' + subargs.map((sa) => `'${sa}'`).join(', ') + ']';
        argParts.push(arrayArgsStr);
      } else {
        argParts.push(JSON.stringify(subargs));
      }
    } else {
      argParts.push(`${JSON.parse(i.json)}`);
    }
  }

  return argParts.join(', ');
}

/**
 * note: assumes {@link validateOnlySquareBracketsEndFinalPart} has been called on the input schema's faker field mappings
 */
function countSeparators(input: string): number {
  const c1 = input.split('.').length - 1;
  const c2 = input.split('[]').length - 1;
  return c1 + c2;
}

export function renderFakerCallTree(input: FakerCallTree): string {
  let result = '\n';

  function inner(data: FakerCallTree, indent: number): string {
    const entries = Object.entries(data);
    let innerContent = '';

    entries.forEach(([key, value], index) => {
      let line = `${'\t'.repeat(indent)}'${key}': `;

      if (typeof value === 'string') {
        // base case
        line += value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // recursive case
        line += '{\n';
        line += inner(value, indent + 1);
        line += `${'\t'.repeat(indent)}}`;
      } else {
        throw Error(
          'expected intermediary field value to be a string or plain object'
        );
      }

      if (index !== entries.length - 1) {
        line += ',';
      }

      line += '\n';
      innerContent += line;
    });

    return innerContent;
  }

  result += inner(input, 1);

  return '{' + result + '}';
}

function validateOnlySquareBracketsEndFinalPart(mapping: FakerFieldMapping) {
  const parts = mapping.fieldPath.split('.');
  for (const part of parts) {
    const idx = part.indexOf('[]');
    if (idx !== -1 && idx !== part.length - 2) {
      throw new Error(
        `Invalid fieldPath "${mapping.fieldPath}": "[]" can only appear at the very end of the \`fieldPath\``
      );
    }
  }
}

function validateFieldPathParts(mapping: FakerFieldMapping) {
  const fieldParts = mapping.fieldPath.split('.');

  if (fieldParts.length === 0) {
    throw Error('expected `fieldPath` to be non-empty');
  }

  for (const part of fieldParts) {
    if (part.trim().length === 0) {
      throw Error('expected part in `fieldPath` to be non-empty');
    }

    if (part.includes('\0')) {
      throw Error(
        'fieldPath part contains null character, which is not allowed in MongoDB field names'
      );
    }

    if (part.startsWith('$')) {
      throw Error(
        "fieldPath part starts with '$', which is not allowed in MongoDB field names"
      );
    }

    if (part.includes('.')) {
      throw Error(
        "fieldPath part contains '.', which is not allowed in MongoDB field names"
      );
    }
  }
}
