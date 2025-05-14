import OpenAI from 'openai';

let _client: OpenAI;
async function getClient() {
  if (!_client) {
    let apiKey: string;
    try {
      apiKey = process.env.OPEN_AI_KEY ?? (await import('./api-key')).apiKey;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error importing api key for open ai:', error);
      throw new Error('API key not found. Ask Rhys');
    }

    _client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

const openAIModel = 'gpt-4.1-mini';
// const openAIModel = 'gpt-4o';

export async function* getStreamResponseFromOpenAI({
  messages,
  model = openAIModel,
  signal,
}: {
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
  model?: string;
  signal: AbortSignal;
}) {
  try {
    const client = await getClient();
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        stream: true,
      },
      {
        signal,
      }
    );

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error streaming ai response:', error);
    throw error;
  }
}

export async function getResponseFromOpenAI({
  messages,
  model = openAIModel,
  signal,
}: {
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
  model?: string;
  signal: AbortSignal;
}) {
  const client = await getClient();
  return client.chat.completions.create(
    {
      model,
      messages,
    },
    {
      signal,
    }
  );
}
