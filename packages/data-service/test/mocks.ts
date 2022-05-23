import { EventEmitter } from 'events';
type Listener = (...args: any[]) => void;
class AbortSignal {
  private eventEmitter: EventEmitter = new EventEmitter();
  public aborted = false;

  onabort() {
    return;
  }
  removeEventListener(name: string, listener: Listener) {
    this.eventEmitter.removeListener(name, listener);
  }
  addEventListener(name: string, listener: Listener) {
    this.eventEmitter.on(name, listener);
  }
  dispatchEvent(type: string): boolean {
    const event = { type, target: this };
    const listenerName = `on${type}`;

    this[listenerName](event);
    return this.eventEmitter.emit(type, event);
  }
}
export class AbortController {
  constructor(public signal: AbortSignal = new AbortSignal()) {}
  abort(): void {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    this.signal.dispatchEvent('abort');
  }
}
