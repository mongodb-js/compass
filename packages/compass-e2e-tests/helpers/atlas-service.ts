import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export type MockAtlasServerResponse = {
  status: number;
  body: any;
};

function aiFeatureEnableResponse(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  // Get request to hello service.
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      features: {
        GEN_AI_COMPASS: {
          enabled: true,
        },
      },
    })
  );
}

export async function startMockAtlasServiceServer(
  {
    response: _response,
  }: {
    response: MockAtlasServerResponse;
  } = {
    response: {
      status: 200,
      body: {
        content: {
          query: {
            filter: {
              test: 'pineapple',
            },
          },
        },
      },
    },
  }
): Promise<{
  clearRequests: () => void;
  getRequests: () => {
    content: any;
    req: any;
  }[];
  setMockAtlasServerResponse: (response: MockAtlasServerResponse) => void;
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
      if (req.method === 'GET') {
        requests.push({
          req,
          content: null,
        });
        return aiFeatureEnableResponse(req, res);
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

  function clearRequests() {
    requests = [];
  }

  function getRequests() {
    return requests;
  }

  function setMockAtlasServerResponse(newResponse: MockAtlasServerResponse) {
    response = newResponse;
  }

  return {
    clearRequests,
    getRequests,
    endpoint,
    server,
    setMockAtlasServerResponse,
    stop,
  };
}
