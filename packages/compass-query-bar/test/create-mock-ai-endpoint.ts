import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export async function startMockAIServer(
  {
    response,
    sendError,
  }: {
    response: any;
    sendError?: boolean;
  } = {
    response: {
      query: {
        find: {
          test: 'pineapple',
        },
      },
    },
  }
): Promise<{
  getRequests: () => {
    content: any;
    req: any;
  }[];
  endpoint: string;
  server: http.Server;
  stop: () => Promise<void>;
}> {
  const requests: {
    content: any;
    req: any;
  }[] = [];
  const server = http
    .createServer((req, res) => {
      let body = '';
      req
        .setEncoding('utf8')
        .on('data', (chunk) => {
          body += chunk;
        })
        .on('end', () => {
          const jsonObject = JSON.parse(body);
          requests.push({
            req,
            content: jsonObject,
          });

          if (sendError) {
            res.writeHead(500);
            res.end('Error occurred.');
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(response));
        });
    })
    .listen(0);
  await once(server, 'listening');

  // address() returns either a string or AddressInfo.
  const address = server.address() as AddressInfo;

  const endpoint = `http://localhost:${address.port}`;

  async function stop() {
    server.close();
    await once(server, 'close');
  }

  function getRequests() {
    return requests;
  }

  return {
    getRequests,
    endpoint,
    server,
    stop,
  };
}
