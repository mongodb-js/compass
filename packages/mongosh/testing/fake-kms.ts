import DuplexPair from 'duplexpair';
import http from 'http';

// Exact values specified by RFC6749 ;)
const oauthToken = { access_token: '2YotnFZFEjr1zCsicMWpAA', expires_in: 3600 };

type RequestData = { url: string, body: string };
type HandlerFunction = (data: RequestData) => any;
type HandlerList = { host: RegExp, handler: HandlerFunction }[];
type Duplex = NodeJS.ReadableStream & NodeJS.WritableStream;

// Return a Duplex stream that behaves like an HTTP stream, with the 'server'
// being provided by the handler function in this case (which is expected
// to return JSON).
export function makeFakeHTTPConnection(handlerList: HandlerList): Duplex & { requests: http.IncomingMessage[] } {
  const { socket1, socket2 } = new DuplexPair();
  const server = makeFakeHTTPServer(handlerList);
  server.emit('connection', socket2);
  return Object.assign(socket1, { requests: server.requests });
}

type FakeHTTPServer = http.Server & { requests: http.IncomingMessage[] };
export function makeFakeHTTPServer(handlerList: HandlerList): FakeHTTPServer {
  const server = http.createServer((req, res) => {
    (server as FakeHTTPServer).requests.push(req);
    let handler: HandlerFunction | undefined;
    const host = req.headers['host'];
    for (const potentialHandler of handlerList) {
      if (potentialHandler.host.test(host)) {
        handler = potentialHandler.handler;
        break;
      }
    }
    if (!handler) {
      res.writeHead(404, {
        'Content-Type': 'text/plain'
      });
      res.end(`Host ${host} not found`);
      return;
    }

    let body = '';
    req.setEncoding('utf8').on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(handler({ url: req.url, body })));
    });
  });
  return Object.assign(server, { requests: [] });
}

export const fakeAWSHandlers: HandlerList = [
  { host: /\.amazonaws\.com$/, handler: awsHandler },
  { host: /\.microsoftonline.com$|\.azure.net$/, handler: azureHandler },
  { host: /\.googleapis.com$/, handler: gcpHandler }
];

function awsHandler({ body }: RequestData): any {
  const request = JSON.parse(body);
  let response;
  if (request.KeyId && request.Plaintext) {
    // Famously "unbreakable" base64 encryption ;) We use this to forward
    // both KeyId and Plaintext so that they are available for generating
    // the decryption response, which also provides the KeyId and Plaintext
    // based on the CiphertextBlob alone.
    const CiphertextBlob = Buffer.from(request.KeyId + '\0' + request.Plaintext).toString('base64')
    return {
      CiphertextBlob,
      EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
      KeyId: request.KeyId
    };
  } else {
    const [ KeyId, Plaintext ] = Buffer.from(request.CiphertextBlob, 'base64').toString().split('\0');
    return {
      Plaintext,
      EncryptionAlgorithm: 'SYMMETRIC_DEFAULT',
      KeyId
    };
  }
}

function azureHandler({ body, url }: RequestData): any {
  if (url.endsWith('/token')) {
    return oauthToken;
  } else if (url.match(/\/(un)?wrapkey/)) {
    // Just act as if this was encrypted.
    return { value: JSON.parse(body).value };
  }
}

function gcpHandler({ body, url }: RequestData): any {
  if (url.endsWith('/token')) {
    return oauthToken;
  } else if (url.endsWith(':encrypt')) {
    // Here we also just perform noop encryption.
    return { ciphertext: JSON.parse(body).plaintext };
  } else if (url.endsWith(':decrypt')) {
    return { plaintext: JSON.parse(body).ciphertext };
  }
}
