import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export const TEST_TOKEN = 'test_token';
export const TEST_AUTH_PASSWORD = 'testpass';

// Throws if doesn't match.
function checkReqAuth(req: http.IncomingMessage) {
  const authHeader = req.headers.authorization ?? '';

  if (authHeader !== TEST_TOKEN) {
    throw new Error('no match');
  }
}

export async function startMockAtlasServiceServer(
  {
    response,
  }: {
    response: {
      status: number;
      body: any;
    };
  } = {
    response: {
      status: 200,
      body: {
        content: {
          query: {
            find: {
              test: 'pineapple',
            },
          },
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
      try {
        checkReqAuth(req);
      } catch (err) {
        res.writeHead(401);
        res.end('Not authorized.');
        return;
      }

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

          res.setHeader('Content-Type', 'application/json');
          if (response.status !== 200) {
            res.writeHead(response.status);
          }
          return res.end(JSON.stringify(response.body));
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
