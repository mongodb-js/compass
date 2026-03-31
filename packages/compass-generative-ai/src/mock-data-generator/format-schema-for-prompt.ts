import { toJSString } from 'mongodb-query-parser';

import type { RawSchema } from './schema';

/**
 * Formats the schema input into the user prompt format expected by the LLM.
 */
export function formatSchemaForPrompt(
  databaseName: string,
  collectionName: string,
  documentSchema: RawSchema,
  validationRules?: Record<string, unknown> | null
): string {
  const schemaStr = toJSString(documentSchema) ?? '{}';

  let validationRulesPhrase = '';
  if (validationRules !== null && validationRules !== undefined) {
    const validationStr = toJSString(validationRules) ?? '{}';
    validationRulesPhrase =
      '\n\n' +
      'Please also include the following MongoDB schema validation rules that are applied' +
      ' to each document:\n\n' +
      '```\n' +
      validationStr +
      '\n```';
  }

  return `Generate a JSON Schema for a faker-js factory function for the following collection's schema.

The database name is \`${databaseName}\`
The collection name is \`${collectionName}\`

Documents in the collection are described by the following schema:

\`\`\`
${schemaStr}
\`\`\`

${validationRulesPhrase}
`;
}
