/* eslint-disable no-console */
const MONGODB_DOCS_CHATBOT_BASE_URI = 'https://knowledge.mongodb.com/';

const MONGODB_DOCS_CHATBOT_API_VERSION = 'v1';

function getUri(path: string) {
  const serverBaseUri = MONGODB_DOCS_CHATBOT_BASE_URI;

  return `${serverBaseUri}api/${MONGODB_DOCS_CHATBOT_API_VERSION}${path}`;
}

function checkStatusAndThrowIfBad(res: Response, data?: any) {
  if (res.status === 400) {
    throw new Error(`[Docs chatbot] Bad request: ${data?.error}`);
  }
  if (res.status === 404) {
    throw new Error(`[Docs chatbot] Conversation not found: ${data?.error}`);
  }
  if (res.status === 429) {
    throw new Error(`[Docs chatbot] Rate limited: ${data?.error}`);
  }
  if (res.status === 504) {
    throw new Error(`[Docs chatbot] Timeout: ${data?.error}`);
  }
  if (res.status >= 500) {
    throw new Error(
      `[Docs chatbot] Internal server error: ${
        data?.error ?? `${res.status} - ${res.statusText}`
      }`
    );
  }
}

// Top and status report on the database page?
// Passing in the top and current op information.
// Maybe the storage size things.
// Maybe the deployment information.
// "Describe this cluster"
// Or connection page?

function docsFetch({
  uri,
  method,
  body,
  signal,
  headers,
}: {
  uri: string;
  method: string;
  signal?: AbortSignal;
  body?: string;
  headers?: { [key: string]: string };
}) {
  return fetch(uri, {
    headers: {
      'X-Request-Origin': `skunkworks-rhys-compass-test/docs`,
      'User-Agent': `Compass Dev (Rhys Skunkworks)`,
      ...headers,
    },
    method,
    signal,
    ...(body && { body }),
  });
}

export async function createDocsAIConversation({
  signal,
}: {
  signal: AbortSignal;
}) {
  const createConversationUri = getUri('/conversations');
  const createConversationResponse = await docsFetch({
    uri: createConversationUri,
    method: 'POST',
    signal,
  });

  let data;
  try {
    data = await createConversationResponse.json();
  } catch (error) {
    throw new Error(
      `Error parsing response: [Docs chatbot] Internal server error ${error}`
    );
  }

  checkStatusAndThrowIfBad(createConversationResponse, data);

  const conversationId = data._id;
  if (!conversationId) {
    throw new Error('[Docs chatbot] No conversationId returned');
  }

  return conversationId;
}

export async function* getStreamResponseFromDocsAI({
  message,
  signal,
}: {
  message: string;
  signal: AbortSignal;
}) {
  try {
    // 1. Create a docs chatbot conversation.
    const conversationId = await createDocsAIConversation({ signal });

    // 2. Send messages and stream the response.
    const messagesUri = getUri(`/conversations/${conversationId}/messages`);
    const messagesResponse = await docsFetch({
      uri: messagesUri,
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json' },
      signal,
    });

    checkStatusAndThrowIfBad(messagesResponse);

    // 3. Stream the response body.
    if (!messagesResponse.body) {
      throw new Error('[Docs chatbot] No response body to stream');
    }

    const reader = messagesResponse.body.getReader();
    const decoder = new TextDecoder();

    let partial = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('aaa raw value', value);

      partial += decoder.decode(value, { stream: true });
      console.log('aaa partial now', partial);

      // Assume each chunk is a JSON line or text chunk
      // Maybe need to update this based on the streaming format
      const lines = partial.split('\n');
      partial = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed?.content;
            if (content) {
              yield content;
            }
          } catch {
            // If not JSON, yield as text
            yield line;
          }
        }
      }
    }
    if (partial.trim()) {
      try {
        const parsed = JSON.parse(partial);
        const content = parsed?.content;
        if (content) {
          yield content;
        }
      } catch {
        yield partial;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error performing docs ai request:', error);
    throw error;
  }
}
