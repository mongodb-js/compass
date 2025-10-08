import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export type MockAssistantResponse = {
  status: number;
  body: string;
};

function sendStreamingResponse(res: http.ServerResponse, content: string) {
  // OpenAI Responses API streaming response format using Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked',
  });

  const responseId = `resp_${Date.now()}`;
  const itemId = `item_${Date.now()}`;
  let sequenceNumber = 0;

  // Send response.created event
  res.write(
    `data: ${JSON.stringify({
      type: 'response.created',
      response: {
        id: responseId,
        object: 'realtime.response',
        status: 'in_progress',
        output: [],
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        },
      },
      sequence_number: sequenceNumber++,
    })}\n\n`
  );

  // Send output_item.added event
  res.write(
    `data: ${JSON.stringify({
      type: 'response.output_item.added',
      response_id: responseId,
      output_index: 0,
      item: {
        id: itemId,
        object: 'realtime.item',
        type: 'message',
        role: 'assistant',
        content: [],
      },
      sequence_number: sequenceNumber++,
    })}\n\n`
  );

  // Send the content in chunks
  const words = content.split(' ');
  let index = 0;

  const sendChunk = () => {
    if (index < words.length) {
      const word = words[index] + (index < words.length - 1 ? ' ' : '');
      // Send output_text.delta event
      res.write(
        `data: ${JSON.stringify({
          type: 'response.output_text.delta',
          response_id: responseId,
          item_id: itemId,
          output_index: 0,
          delta: word,
          sequence_number: sequenceNumber++,
        })}\n\n`
      );
      index++;
      setTimeout(sendChunk, 10);
    } else {
      // Send output_item.done event
      res.write(
        `data: ${JSON.stringify({
          type: 'response.output_item.done',
          response_id: responseId,
          output_index: 0,
          item: {
            id: itemId,
            object: 'realtime.item',
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          },
          sequence_number: sequenceNumber++,
        })}\n\n`
      );

      // Send response.completed event
      const tokenCount = Math.ceil(content.split(' ').length * 1.3);
      res.write(
        `data: ${JSON.stringify({
          type: 'response.completed',
          response: {
            id: responseId,
            object: 'realtime.response',
            status: 'completed',
            output: [
              {
                id: itemId,
                object: 'realtime.item',
                type: 'message',
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: content,
                  },
                ],
              },
            ],
            usage: {
              input_tokens: 10,
              output_tokens: tokenCount,
              total_tokens: 10 + tokenCount,
            },
          },
          sequence_number: sequenceNumber++,
        })}\n\n`
      );

      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  sendChunk();
}

export const MOCK_ASSISTANT_SERVER_PORT = 27097;
export async function startMockAssistantServer(
  {
    response: _response,
  }: {
    response: MockAssistantResponse;
  } = {
    response: {
      status: 200,
      body: 'This is a test response from the AI assistant.',
    },
  }
): Promise<{
  clearRequests: () => void;
  getResponse: () => MockAssistantResponse;
  setResponse: (response: MockAssistantResponse) => void;
  getRequests: () => {
    content: any;
    req: any;
  }[];
  endpoint: string;
  server: http.Server;
  stop: () => Promise<void>;
}> {
  let requests: {
    content: any;
    req: any;
  }[] = [];
  let response = _response;
  const server = http
    .createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Request-Origin, User-Agent'
      );

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Only handle POST requests for chat completions
      if (req.method !== 'POST') {
        res.writeHead(404);
        return res.end('Not Found');
      }

      let body = '';
      req
        .setEncoding('utf8')
        .on('data', (chunk) => {
          body += chunk;
        })
        .on('end', () => {
          let jsonObject;
          try {
            jsonObject = JSON.parse(body);
          } catch {
            res.writeHead(400);
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }

          requests.push({
            req,
            content: jsonObject,
          });

          if (response.status !== 200) {
            res.writeHead(response.status);
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: response.body }));
          }

          // Send streaming response
          return sendStreamingResponse(res, response.body);
        });
    })
    .listen(MOCK_ASSISTANT_SERVER_PORT);
  await once(server, 'listening');

  // address() returns either a string or AddressInfo.
  const address = server.address() as AddressInfo;

  const endpoint = `http://localhost:${address.port}`;

  async function stop() {
    server.close();
    await once(server, 'close');
  }

  function clearRequests() {
    requests = [];
  }

  function getRequests() {
    return requests;
  }

  function getResponse() {
    return response;
  }

  function setResponse(newResponse: MockAssistantResponse) {
    response = newResponse;
  }

  return {
    clearRequests,
    getRequests,
    endpoint,
    server,
    getResponse,
    setResponse,
    stop,
  };
}
