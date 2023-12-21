import { EventEmitter } from 'events';
class Server extends EventEmitter {
  listen() {
    queueMicrotask(() => {
      this.emit('listening');
    });
  }
  address() {
    return null;
  }
  close() {
    // noop
  }
}
export function createServer() {
  return new Server();
}
