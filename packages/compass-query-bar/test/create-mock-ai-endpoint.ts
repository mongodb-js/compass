import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export const TEST_AUTH_USERNAME = 'testuser';
export const TEST_AUTH_PASSWORD = 'testpass';

// Throws if doesn't match.
function checkReqAuth(req: http.IncomingMessage) {
  const header = req.headers.authorization ?? '';
  const token = header.split(/\s+/).pop() ?? '';
  const auth = Buffer.from(token, 'base64').toString();
  const [username, password] = auth.split(':');

  if (username !== TEST_AUTH_USERNAME || password !== TEST_AUTH_PASSWORD) {
    throw new Error('no match');
  }
}

export async function startMockAIServer(
  {
    response,
    sendError,
  }: {
    response: any;
    sendError?: boolean;
  } = {
    response: {
      content: {
        query: {
          find: {
            test: 'pineapple',
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
