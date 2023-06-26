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
  const endpoint = `${getAIQueryEndpoint()}/api/v1/ai/generate-query`;

  const res = await fetch(endpoint, {
    signal: signal as NodeFetchAbortSignal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // TODO: Send the schema and example document(s).
      userPrompt,
    }),
  });
  console.log('res', res);

  const jsonResponse = await res.json();
  console.log('jsonResponse', jsonResponse);
  console.log('keys', Object.keys(jsonResponse));
  console.log('typeof jsonResponse', typeof jsonResponse);

  return jsonResponse;
}
