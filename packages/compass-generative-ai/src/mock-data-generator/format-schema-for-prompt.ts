import type { RawSchema } from './schema';

/**
 * Formats the schema input into the user prompt format expected by the LLM.
 * Ported from MockDataSchemaGenerationPrompt.buildUserPrompt()
 */
export function formatSchemaForPrompt(
  databaseName: string,
  collectionName: string,
  documentSchema: RawSchema,
  validationRules?: Record<string, unknown> | null
): string {
  const schemaJson = JSON.stringify(documentSchema, null, 2);

  let validationRulesPhrase = '';
  if (validationRules !== null) {
    validationRulesPhrase =
      '\n\n' +
      'Please also include the following MongoDB schema validation rules that are applied' +
      ' to each document:\n\n' +
      JSON.stringify(validationRules, null, 2);
  }

  return `Generate a JSON Schema for a faker-js factory function for the following collection's schema.

The database name is \`${databaseName}\`
The collection name is \`${collectionName}\`

Documents in the collection are described by the following schema:

${schemaJson}
${validationRulesPhrase}
`;
}
