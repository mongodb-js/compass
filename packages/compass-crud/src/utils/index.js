import { EventEmitter } from 'events';

// TODO: remove this as soon as we're on node 15+
export class AbortSignal {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.onabort = null;
    this.aborted = false;
  }
  toString() {
    return '[object AbortSignal]';
  }
  get [Symbol.toStringTag]() {
    return 'AbortSignal';
  }
  removeEventListener(name, handler) {
    this.eventEmitter.removeListener(name, handler);
  }
  addEventListener(name, handler) {
    this.eventEmitter.on(name, handler);
  }
  dispatchEvent(type) {
    const event = { type, target: this };
    const handlerName = `on${type}`;

    if (typeof this[handlerName] === 'function') this[handlerName](event);

    this.eventEmitter.emit(type, event);
  }
}
// TODO: remove this as soon as we're on node 15+
export class AbortController {
  constructor() {
    this.signal = new AbortSignal();
  }
  abort() {
    if (this.signal.aborted) return;

    this.signal.aborted = true;
    this.signal.dispatchEvent('abort');
  }
  toString() {
    return '[object AbortController]';
  }
  get [Symbol.toStringTag]() {
    return 'AbortController';
  }
}

/**
 * Get the size for the string value.
 * Returns 1 with an empty string.
 *
 * @param {Object} value - The value.
 *
 * @return {Number} The size.
 */
export const fieldStringLen = (value) => {
  const length = String(value).length;
  return length === 0 ? 1 : length;
};
