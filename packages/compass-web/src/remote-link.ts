import { listen } from '@mongodb-js/compass-utils';
import type { MultiplexLink, MultiplexSocketCallbacks } from './multiplex-link';

type Destination = { da: string; dp: number };

type WorkerToPage =
  | { t: 'register'; sp: number }
  | ({ t: 'data'; sp: number; data: Uint8Array } & Destination)
  | ({ t: 'error'; sp: number; er: string } & Destination)
  | { t: 'unregister'; sp: number };

type PageToWorker =
  | { t: 'registered'; sp: number; er?: string }
  | { t: 'data'; sp: number; data: Uint8Array }
  | { t: 'error'; sp: number; er: string }
  | { t: 'close'; sp: number };

/**
 * Transferring a view's buffer detaches everything else sharing it (Node.js
 * Buffers are often views into a pooled allocation), so only transfer a
 * buffer the view covers exactly. Copies with the Uint8Array constructor
 * because `Buffer#slice` returns another view, not a copy.
 */
function ownBuffer(data: Uint8Array): Uint8Array {
  return data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
    ? data
    : new Uint8Array(data);
}

/**
 * The tab's Link as seen from a worker. Workers don't share the page's
 * globals, so the sockets they open are forwarded over `port` to the page,
 * where `serveLink` puts them on the one real WebSocket.
 *
 * Ports are numbered per worker; the page maps them to ports on the real
 * Link, so `allocatePort` stays synchronous.
 */
export class RemoteLink implements MultiplexLink {
  private nextPort = 1;
  private readonly sockets = new Map<number, MultiplexSocketCallbacks>();
  private readonly pending = new Map<number, PromiseWithResolvers<void>>();
  private readonly port: MessagePort;

  constructor(port: MessagePort) {
    this.port = port;
    listen(port, 'message', ({ data }: MessageEvent<PageToWorker>) =>
      this.onMessage(data)
    );
    port.start();
  }

  private send(message: WorkerToPage, transfer: Transferable[] = []): void {
    this.port.postMessage(message, transfer);
  }

  private onMessage(message: PageToWorker): void {
    if (message.t === 'registered') {
      const pending = this.pending.get(message.sp);
      this.pending.delete(message.sp);
      if (message.er === undefined) {
        pending?.resolve();
      } else {
        this.sockets.delete(message.sp);
        pending?.reject(new Error(message.er));
      }
      return;
    }
    const callbacks = this.sockets.get(message.sp);
    if (!callbacks) return;
    if (message.t === 'data') {
      callbacks.onData(message.data);
      return;
    }
    this.sockets.delete(message.sp);
    if (message.t === 'error') {
      callbacks.onError(new Error(message.er));
    } else {
      callbacks.onClose();
    }
  }

  allocatePort(): number {
    return this.nextPort++;
  }

  registerSocket(
    sourcePort: number,
    callbacks: MultiplexSocketCallbacks
  ): Promise<void> {
    const pending = Promise.withResolvers<void>();
    this.pending.set(sourcePort, pending);
    this.sockets.set(sourcePort, callbacks);
    this.send({ t: 'register', sp: sourcePort });
    return pending.promise;
  }

  unregisterSocket(sourcePort: number): void {
    this.sockets.delete(sourcePort);
    this.send({ t: 'unregister', sp: sourcePort });
  }

  sendData(
    sourcePort: number,
    destAddr: string,
    destPort: number,
    data: Uint8Array
  ): void {
    const own = ownBuffer(data);
    this.send(
      { t: 'data', sp: sourcePort, da: destAddr, dp: destPort, data: own },
      [own.buffer]
    );
  }

  sendError(
    sourcePort: number,
    destAddr: string,
    destPort: number,
    errorMessage: string
  ): void {
    this.send({
      t: 'error',
      sp: sourcePort,
      da: destAddr,
      dp: destPort,
      er: errorMessage,
    });
  }
}

/**
 * Serves the page's Link to one worker's `RemoteLink`. `getLink` is read when
 * a socket registers, because the page replaces the Link when it reconnects.
 * Disposing unregisters every socket the worker still has open.
 */
export function serveLink(
  port: MessagePort,
  getLink: () => MultiplexLink | null
): Disposable {
  using ds = new DisposableStack();
  const streams = new Map<number, { link: MultiplexLink; sp: number }>();
  const send = (message: PageToWorker, transfer: Transferable[] = []) =>
    port.postMessage(message, transfer);

  const onRegister = async (sp: number) => {
    try {
      const link = getLink();
      if (!link) throw new Error('Link is not available');

      const stream = { link, sp: link.allocatePort() };
      streams.set(sp, stream);

      await link.registerSocket(stream.sp, {
        onData: (data) => {
          const own = ownBuffer(data);
          send({ t: 'data', sp, data: own }, [own.buffer]);
        },
        onClose: () => {
          streams.delete(sp);
          send({ t: 'close', sp });
        },
        onError: (err) => {
          streams.delete(sp);
          send({ t: 'error', sp, er: err.message });
        },
      });

      send({ t: 'registered', sp });
    } catch (err) {
      streams.delete(sp);
      send({ t: 'registered', sp, er: (err as Error).message });
    }
  };

  ds.use(
    listen(port, 'message', ({ data: message }: MessageEvent<WorkerToPage>) => {
      if (message.t === 'register') {
        void onRegister(message.sp);
        return;
      }
      const stream = streams.get(message.sp);
      if (!stream) return;
      if (message.t === 'data') {
        stream.link.sendData(stream.sp, message.da, message.dp, message.data);
      } else if (message.t === 'error') {
        stream.link.sendError(stream.sp, message.da, message.dp, message.er);
      } else {
        streams.delete(message.sp);
        stream.link.unregisterSocket(stream.sp);
      }
    })
  );
  ds.defer(() => {
    for (const { link, sp } of streams.values()) link.unregisterSocket(sp);
    streams.clear();
    port.close();
  });
  port.start();
  return ds.move();
}
