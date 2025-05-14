/* eslint-disable no-console */
const ollamaGenerateUrl = 'http://localhost:11434/api/generate';
const ollamaChatUrl = 'http://localhost:11434/api/chat';

// Sends a streaming request to Ollama's /api/generate endpoint and yields response chunks as they arrive.
async function* streamOllamaResponse({
  body,
  signal,
  endpoint,
}: {
  body:
    | {
        messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
        model: string;
        stream: boolean;
      }
    | {
        model: string;
        prompt: string;
        stream: boolean;
      };
  endpoint: 'chat' | 'generate';
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  try {
    const url = endpoint === 'chat' ? ollamaChatUrl : ollamaGenerateUrl;
    console.log('Ollama URL:', url);
    console.log('Ollama body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    console.log('Ollama response status and ok:', response.status, response.ok);
    if (!response.ok || !response.body) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Ollama streams JSON objects separated by newlines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Save incomplete line for next chunk

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (endpoint === 'generate' && typeof json.response === 'string') {
            yield json.response;
          } else if (
            endpoint === 'chat' &&
            typeof json.message.content === 'string'
          ) {
            yield json.message.content;
          }
        } catch (e) {
          console.error('Error parsing Ollama response:', e);

          // Ignore parse errors for incomplete lines
        }
      }
    }
  } catch (error) {
    console.error('Error streaming Ollama response:', error);
    throw error;
  }
}

// async function pingOllama() {
//   console.log('aaa Pinging Ollama...');

//   const requestBody = {
//     model: 'gemma3:1b',
//     prompt: 'Hello, how are you?',
//     stream: true
//   };

//   let fullResponse = '';

//   try {
//     for await (const chunk of streamOllamaResponse(requestBody)) {
//       // console.log('aaa chunk received:', chunk);
//       // console.log(chunk); // Log each streamed chunk
//       fullResponse += chunk; // Accumulate the response
//     }
//     console.log('aaa Full response:', fullResponse);
//   } catch (error) {
//     console.error('aaa Failed to stream Ollama response:', error);
//   }
// }

const AI_MODEL = 'gemma3:1b';

export function getResponseFromLocalAI({
  prompt,
  signal,
}: {
  prompt: string;
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  return streamOllamaResponse({
    body: {
      model: AI_MODEL,
      prompt,
      stream: true,
    },
    signal,
    endpoint: 'generate',
  });
}

export function getChatResponseFromLocalAI({
  messages,
  signal,
}: {
  messages: { role: 'user' | 'system'; content: string }[];
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  return streamOllamaResponse({
    endpoint: 'chat',
    body: {
      model: AI_MODEL,
      // messages: [
      //   { role: 'system', content: systemPrompt },
      //   { role: 'user', content: userPrompt }
      // ],
      messages,
      stream: true,
    },
    signal,
  });
}
