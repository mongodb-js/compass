/* eslint-disable no-console */
import type { SimplifiedSchema } from 'mongodb-schema';
import _parseShellBSON, { ParseMode } from '@mongodb-js/shell-bson-parser';
import { EJSON } from 'bson';
import type { Document } from 'bson';
// import type { Pipeline } from '../constants/query-properties';
import { getChatResponseFromAI } from '@mongodb-js/compass-generative-ai';

// TODO: maybe remove and see if it can just do ejson.
/**
 * @param source expression source (object or array expression with optional
 *               leading / trailing comments)
 */
export function parseShellBSON(source: string) {
  const parsed = _parseShellBSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('Source expression is invalid');
  }
  return parsed;
}

export function createSuggestionsSystemPrompt() {
  return `You are a MongoDB Extended JSON API text prompt creation service.
You must only respond with valid, parsable MongoDB Extended JSON.
Response with modern MongoDB syntax using MongoDB Extended JSON format.
You will receive information about a dataset and respond with potential natural text queries someone might ask of the data.
Answer with a MongoDB EJSON array with objects that have strings that are the questions someone might ask of the data.
Also include the pipeline that the text question would generate in the response with a "pipeline" key.
Do NOT wrap the response with any code block markdowns (\`\`\`json), follow the example format.
Try to make it a complex pipeline someone would actually write.
A simplified example response might be:
[{
  "text": "...",
  "pipeline": [{
    ...
  }]
}]
Wrap regex patterns with an object using the "$regex" operator using a string and not the / syntax.
You are a MongoDB expert.`;
}

export function createSuggestionsUserPrompt({
  schema,
  collectionName,
  databaseName,
  sampleDocuments,
}: {
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
}) {
  const prompt = [];

  if (schema && typeof schema === 'object') {
    prompt.push(
      `MongoDB collection document schema (from a sample): ${EJSON.stringify(
        schema,
        undefined,
        2,
        {
          relaxed: false,
        }
      )}`
    );
  }

  if (databaseName) {
    prompt.push(`Database name: "${databaseName}"`);
  }

  if (collectionName) {
    prompt.push(`Collection name: "${collectionName}"`);
  }

  if (sampleDocuments && typeof sampleDocuments === 'object') {
    prompt.push(
      `Sample documents from the collection: ${EJSON.stringify(
        sampleDocuments,
        undefined,
        2,
        {
          relaxed: false,
        }
      )}`
    );
  }

  prompt.push(
    'Give 3 possible questions someone might ask of this data. Answer using a JSON array with "pipeline" and "text" keys.'
  );
  prompt.push(
    'If there is not enough information to ask any questions return an empty array.'
  );
  prompt.push(
    'Respond using MongoDB extended JSON, do not use shell or javascript syntax.'
  );

  return prompt.join('\n');
}

export async function getPipelineSuggestions({
  collectionName,
  databaseName,
  schema,
  sampleDocuments,
  signal,
}: {
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
  signal: AbortSignal;
}): Promise<
  | {
      text: string;
      pipeline: Document;
    }[]
  | null
> {
  const chatCompletion = await getChatResponseFromAI({
    messages: [
      {
        role: 'system',
        content: createSuggestionsSystemPrompt(),
      },
      {
        role: 'user',
        content: createSuggestionsUserPrompt({
          schema,
          collectionName,
          databaseName,
          sampleDocuments,
        }),
      },
    ],
    signal,
  });

  if (
    !chatCompletion.choices ||
    chatCompletion.choices.length === 0 ||
    !chatCompletion.choices[0].message.content
  ) {
    return null;
  }

  try {
    console.log(
      'aaa \nRAW content:\n',
      chatCompletion.choices[0].message.content,
      '\n'
    );

    const content = EJSON.parse(chatCompletion.choices[0].message.content);

    // Align the fields of the content.
    // if (content?.length) {
    //   // for (const suggestion of content) {
    //   content.forEach((suggestion: Document) => {
    //     if (suggestion?.query?.find) {
    //       suggestion.query.filter = suggestion.query.find;
    //       delete suggestion.query.find;
    //     }
    //   });
    // }

    console.log('aaa \ncontent:\n', content, '\n');
    return content;
  } catch (parseError) {
    console.log('aaaa parser error on suggestion:', parseError);
    return null;
  }
}
