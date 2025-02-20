import type {
  Server as HTTPServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import { request } from 'http';
import type { Socket } from 'net';
import { connect } from 'net';

export interface ProxyHandlersResult {
  connectRequests: IncomingMessage[];
  httpForwardRequests: IncomingMessage[];
  connections: Socket[];
}

export function setupProxyServer(server: HTTPServer): ProxyHandlersResult {
  const connectRequests: IncomingMessage[] = [];
  const httpForwardRequests: IncomingMessage[] = [];
  const connections: Socket[] = [];

  server.on('connect', onconnect);
  server.on('request', onrequest);
  function onconnect(
    this: HTTPServer,
    req: IncomingMessage,
    socket: Socket,
    head: Buffer
  ): void {
    (req as any).server = this;
    let host: string;
    let port: string;
    if (req.url?.includes(']:')) {
      [host, port] = req.url.slice(1).split(']:');
    } else {
      [host, port] = (req.url ?? '').split(':');
    }
    if (host === 'compass.mongodb.com' || host === 'downloads.mongodb.com') {
      // The snippet loader and update notifier can reach out to thes endpoints,
      // but we usually do not actually wait for this to happen or not in CI,
      // so we're just ignoring these requests here to avoid flaky behavior.
      socket.end();
      return;
    }
    connectRequests.push(req);
    socket.unshift(head);
    socket.write('HTTP/1.0 200 OK\r\n\r\n');
    const outbound = connect(+port, host);
    socket.pipe(outbound).pipe(socket);
    // socket.on('data', chk => console.log('[from client] ' + chk.toString()));
    // outbound.on('data', chk => console.log('[from server] ' + chk.toString()));
    const cleanup = () => {
      outbound.destroy();
      socket.destroy();
    };
    outbound.on('error', cleanup);
    socket.on('error', cleanup);
    connections.push(socket, outbound);
  }
  function onrequest(req: IncomingMessage, res: ServerResponse) {
    httpForwardRequests.push(req);
    const proxyReq = request(
      req.url!,
      { method: req.method, headers: req.headers },
      (proxyRes) => proxyRes.pipe(res)
    );
    if (req.method === 'GET') proxyReq.end();
    else req.pipe(proxyReq);
  }

  return { connections, connectRequests, httpForwardRequests };
}
