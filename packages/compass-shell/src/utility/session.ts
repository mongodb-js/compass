import { pathToFileURL } from 'url';
import Worker from 'web-worker';
import { interrupt as nativeInterrupt } from 'interruptor';
import type { InterruptHandle } from 'interruptor';
import type { MessagePortMain } from 'electron';
import type { ShellMetaEvent, ShellMetaRequest } from './protocol';
import { isShellMeta } from './protocol';
import type { Logger } from '@mongodb-js/compass-logging';

type RpcCall = { sender: string; id: string; func: string; args: unknown[] };

function isRpcCall(data: unknown, func?: string): data is RpcCall {
  return (
    typeof data === 'object' &&
    data !== null &&
    'sender' in data &&
    data.sender === 'postmsg-rpc/client' &&
    'func' in data &&
    (func === undefined || data.func === func)
  );
}

type ShellSessionOptions = {
  logger: Logger;
  /** `@mongosh/node-runtime-worker-thread/dist/worker-runtime.js` on disk */
  workerRuntimePath: string;
};

/**
 * One shell session per port. Runtime RPC traffic is forwarded between the
 * port and the worker; meta messages are handled here. The worker reports an
 * interrupt handle before each evaluation; `interruptor` can only use it from
 * the process that owns the worker thread, which is why `interrupt` is meta.
 */
export class ShellSession implements Disposable {
  private readonly port: MessagePortMain;
  private readonly logger: Logger;
  private readonly workerRuntimePath: string;
  private worker: Worker | null = null;
  private interruptHandle: InterruptHandle | null = null;

  constructor(port: MessagePortMain, options: ShellSessionOptions) {
    this.port = port;
    this.workerRuntimePath = options.workerRuntimePath;
    this.logger = options.logger;
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_445),
      'ShellSession',
      'Session started'
    );
    port.on('message', this.onPortMessage);
    port.on('close', this.onPortClose);
  }

  private send(event: ShellMetaEvent) {
    this.port.postMessage(event);
  }

  private onPortMessage = ({ data }: { data: unknown }) => {
    if (isShellMeta(data)) {
      this.handleMeta(data as ShellMetaRequest);
      return;
    }
    this.worker?.postMessage(data);
  };

  private onPortClose = () => {
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_447),
      'ShellSession',
      'Session ended, renderer closed the port'
    );
    this.worker?.terminate();
  };

  private onWorkerMessage = ({ data }: MessageEvent) => {
    if (isRpcCall(data, 'onRunInterruptible')) {
      this.interruptHandle = (data.args[0] as InterruptHandle | null) ?? null;
      this.worker?.postMessage({
        sender: 'postmsg-rpc/server',
        id: data.id,
        res: { type: 'Message', payload: undefined },
      });
      return;
    }
    this.port.postMessage(data);
  };

  private onWorkerError = (event: Event) => {
    const error = event as unknown as Error;
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_448),
      'ShellSession',
      'Worker error',
      { message: error.message }
    );
    this.send({ meta: 'error', error });
  };

  private handleMeta(request: ShellMetaRequest) {
    switch (request.meta) {
      case 'spawn':
        this.spawn(request.workerOptions);
        return;
      case 'interrupt':
        this.interrupt();
        return;
      case 'terminate':
        this.logger.log.debug(
          this.logger.mongoLogId(1_001_000_449),
          'ShellSession',
          'Worker terminated'
        );
        this.worker?.terminate();
        return;
    }
  }

  private spawn(workerOptions: { name?: string }) {
    this.worker = new Worker(pathToFileURL(this.workerRuntimePath).href, {
      type: 'module',
      name: workerOptions.name,
    });
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_450),
      'ShellSession',
      'Worker spawned',
      { name: workerOptions.name }
    );
    this.worker.addEventListener('message', this.onWorkerMessage);
    this.worker.addEventListener('error', this.onWorkerError);
  }

  private interrupt() {
    const interrupted = this.interruptHandle !== null;
    if (this.interruptHandle) nativeInterrupt(this.interruptHandle);
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_451),
      'ShellSession',
      'Interrupt',
      { interrupted }
    );
    this.send({ meta: 'interrupted', interrupted });
  }

  [Symbol.dispose]() {
    this.logger.log.debug(
      this.logger.mongoLogId(1_001_000_452),
      'ShellSession',
      'Session disposed'
    );
    this.port.off('message', this.onPortMessage);
    this.port.off('close', this.onPortClose);
    this.worker?.terminate();
    this.port.close();
  }
}
