import fetch from 'node-fetch';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { Document } from 'mongodb';

const serverErrorMessageName = 'AIError';

function getAIQueryEndpoint(): string {
  if (!process.env.DEV_AI_QUERY_ENDPOINT) {
    throw new Error(
      'No AI Query endpoint to fetch. Please set the environment variable `DEV_AI_QUERY_ENDPOINT`'
    );
  }

  return process.env.DEV_AI_QUERY_ENDPOINT;
}

function getAIBasicAuth(): string {
  if (!process.env.DEV_AI_USERNAME || !process.env.DEV_AI_PASSWORD) {
    throw new Error(
      'No AI auth information found. Please set the environment variable `DEV_AI_USERNAME` and `DEV_AI_PASSWORD`'
    );
  }

  const authBuffer = Buffer.from(
    `${process.env.DEV_AI_USERNAME}:${process.env.DEV_AI_PASSWORD}`
  );
  return `Basic ${authBuffer.toString('base64')}`;
}

const MAX_REQUEST_SIZE = 15000;
const MIN_SAMPLE_DOCUMENTS = 1;

export async function runFetchAIQuery({
  signal,
  userPrompt,
  collectionName,
  databaseName,
  schema,
  sampleDocuments,
}: {
  signal: AbortSignal;
  userPrompt: string;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
}) {
  let msgBody = JSON.stringify({
    userPrompt,
    collectionName,
    databaseName,
    schema,
    sampleDocuments,
  });
  if (msgBody.length > MAX_REQUEST_SIZE) {
    // When the message body is over the max size, we try
    // to see if with fewer sample documents we can still perform the request.
    // If that fails we throw an error indicating this collection's
    // documents are too large to send to the ai.
    msgBody = JSON.stringify({
      userPrompt,
      collectionName,
      databaseName,
      schema,
      sampleDocuments: sampleDocuments?.slice(0, MIN_SAMPLE_DOCUMENTS),
    });
    if (msgBody.length > MAX_REQUEST_SIZE) {
      throw new Error(
        'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
      );
    }
  }

  const endpoint = `${getAIQueryEndpoint()}/ai/api/v1/mql-query`;

  const res = await fetch(endpoint, {
    signal: signal as NodeFetchAbortSignal,
    method: 'POST',
    headers: {
      Authorization: getAIBasicAuth(),
      'Content-Type': 'application/json',
    },
    body: msgBody,
  });

  if (!res.ok) {
    // We try to parse the response to see if the server returned any
    // information we can show a user.
    let serverErrorMessage = `${res.status} ${res.statusText}`;
    try {
      const messageJSON = await res.json();
      if (messageJSON.name === serverErrorMessageName) {
        serverErrorMessage = `${messageJSON.codeName as string}: ${
          messageJSON.errorMessage as string
        }`;
      }
    } catch (err) {
      // no-op, use the default status and statusText in the message.
    }
    throw new Error(`Error: ${serverErrorMessage}`);
  }

  const jsonResponse = await res.json();

  return jsonResponse;
}

// TODO: Rename/refactor this file for more generalized ai requests.
export async function runFetchAISuggestions({
  signal,
  collectionName,
  databaseName,
  schema,
  sampleDocuments,
}: {
  signal: AbortSignal;
  collectionName: string;
  databaseName: string;
  schema?: SimplifiedSchema;
  sampleDocuments?: Document[];
}) {
  let msgBody = JSON.stringify({
    collectionName,
    databaseName,
    schema,
    sampleDocuments,
  });
  if (msgBody.length > MAX_REQUEST_SIZE) {
    // When the message body is over the max size, we try
    // to see if with fewer sample documents we can still perform the request.
    // If that fails we throw an error indicating this collection's
    // documents are too large to send to the ai.
    msgBody = JSON.stringify({
      collectionName,
      databaseName,
      schema,
      sampleDocuments: sampleDocuments?.slice(0, MIN_SAMPLE_DOCUMENTS),
    });
    if (msgBody.length > MAX_REQUEST_SIZE) {
      throw new Error(
        'Error: too large of a request to send to the ai. Please use a collection with smaller documents.'
      );
    }
  }

  const endpoint = `${getAIQueryEndpoint()}/ai/api/v1/query-prompt-suggestions`;

  const res = await fetch(endpoint, {
    signal: signal as NodeFetchAbortSignal,
    method: 'POST',
    headers: {
      Authorization: getAIBasicAuth(),
      'Content-Type': 'application/json',
    },
    body: msgBody,
  });

  console.log('aaa res:', res);

  if (!res.ok) {
    // We try to parse the response to see if the server returned any
    // information we can show a user.
    let serverErrorMessage = `${res.status} ${res.statusText}`;
    try {
      const messageJSON = await res.json();
      if (messageJSON.name === serverErrorMessageName) {
        serverErrorMessage = `${messageJSON.codeName as string}: ${
          messageJSON.errorMessage as string
        }`;
      }
    } catch (err) {
      // no-op, use the default status and statusText in the message.
    }
    throw new Error(`Error: ${serverErrorMessage}`);
  }

  const jsonResponse = await res.json();
  console.log('aaa json response:', jsonResponse);

  return jsonResponse;
}
