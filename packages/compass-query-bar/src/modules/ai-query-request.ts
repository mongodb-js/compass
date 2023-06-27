import fetch from 'node-fetch';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';

function getAIQueryEndpoint(): string {
  if (!process.env.DEV_AI_QUERY_ENDPOINT) {
    throw new Error(
      'No AI Query endpoint to fetch. Please specific in the environment variable `DEV_AI_QUERY_ENDPOINT`'
    );
  }

  return process.env.DEV_AI_QUERY_ENDPOINT;
}

export async function runFetchAIQuery({
  signal,
  userPrompt,
}: {
  signal: AbortSignal;
  userPrompt: string;
}) {
  const endpoint = `${getAIQueryEndpoint()}/ai/api/v1/mql-query`;

  const res = await fetch(endpoint, {
    signal: signal as NodeFetchAbortSignal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // TODO(COMPASS-6979): Send the schema, example documents, and collection name.
      userPrompt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error: ${res.status} ${res.statusText}`);
  }

  const jsonResponse = await res.json();

  return jsonResponse;
}
