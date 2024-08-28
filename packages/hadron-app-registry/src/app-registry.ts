import type { Store as ReduxStore } from 'redux';
import EventEmitter from 'eventemitter3';
import type { ReactReduxContext } from 'react-redux';

// This type is very generic on purpose so that registerPlugin function generic
// type can derive it automatically based on the passed activate function. This
// is helpful when using useActivate hook to get the stricter type of returned
// activate store elsewhere in the code
export type Store = any & {
  onActivated?: (appRegistry: AppRegistry) => void;
};

// This is basically what createActions will return, this doesn't exactly match
// reflux.Actions type
export type RefluxActions = Record<string, any>;

export function isReduxStore(store: Store): store is ReduxStore {
  return (
    store &&
    typeof store === 'object' &&
    Object.prototype.hasOwnProperty.call(store, 'dispatch')
  );
}

export interface Plugin {
  /**
   * Redux or reflux store that will be automatically passed to a
   * corresponding provider
   */
  store: Store;
  /**
   * Optional, only relevant for plugins using redux stores in cases where
   * exposed plugin methods need access to plugin store in react tree where
   * another redux store is mounted
   */
  context?: typeof ReactReduxContext;
  /**
   * Optional, only relevant for plugins still using reflux
   */
  actions?: RefluxActions;
  /**
   * Will be called to clean up plugin subscriptions when it is deactivated by
   * app registry scope
   */
  deactivate: () => void;
}

/**
 * Is a registry for all user interface components, stores, and actions
 * in the application.
 */
export class AppRegistry {
  _emitter: EventEmitter;
  plugins: Record<string, Plugin>;

  /**
   * Instantiate the registry.
   */
  constructor() {
    this._emitter = new EventEmitter();
    this.plugins = {};
  }

  // Helper until this module is 'proper' fake ESM
  static get AppRegistry(): typeof AppRegistry {
    return AppRegistry;
  }

  deregisterPlugin(name: string): this {
    delete this.plugins[name];
    return this;
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins[name];
  }

  registerPlugin(name: string, plugin: Plugin): this {
    this.plugins[name] = plugin;
    return this;
  }

  deactivate() {
    for (const [name, plugin] of Object.entries(this.plugins)) {
      plugin.deactivate?.();
      this.deregisterPlugin(name);
    }
    for (const event of this.eventNames()) {
      this.removeAllListeners(event);
    }
  }

  /**
   * Adds a listener for the event name to the underlying event emitter.
   *
   * @param {String} eventName - The event name.
   * @param {Function} listener - The listener.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  addListener(eventName: string, listener: (...args: any[]) => void): this {
    return this.on(eventName, listener);
  }

  /**
   * Emits an event for the name with the provided arguments.
   *
   * @param {String} eventName - The event name.
   * @param {...Object} args - The arguments.
   *
   * @returns {Boolean} If the event had listeners.
   */
  emit(eventName: string, ...args: any[]): boolean {
    return this._emitter.emit(eventName, ...args);
  }

  /**
   * Return all the event names.
   *
   * @returns {Array} The event names.
   */
  eventNames(): string[] {
    return this._emitter.eventNames() as string[];
  }

  /**
   * Gets a count of listeners for the event name.
   *
   * @param {String} eventName - The event name.
   *
   * @returns {Number} The listener count.
   */
  listenerCount(eventName: string): number {
    return this._emitter.listeners(eventName).length;
  }

  /**
   * Get all the listeners for the event.
   *
   * @param {String} eventName - The event name.
   *
   * @returns {Array} The listeners for the event.
   */
  listeners(eventName: string): ((...args: any[]) => void)[] {
    return this._emitter.listeners(eventName);
  }

  /**
   * Adds a listener for the event name to the underlying event emitter.
   *
   * @param {String} eventName - The event name.
   * @param {Function} listener - The listener.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  on(eventName: string, listener: (...args: any[]) => void): this {
    this._emitter.on(eventName, listener);
    return this;
  }

  /**
   * Adds a listener for the event name to the underlying event emitter
   * to handle an event only once.
   *
   * @param {String} eventName - The event name.
   * @param {Function} listener - The listener.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  once(eventName: string, listener: (...args: any[]) => void): this {
    this._emitter.once(eventName, listener);
    return this;
  }

  /**
   * Removes a listener for the event.
   *
   * @param {String} eventName - The event name.
   * @param {Function} listener - The listener.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  removeListener(eventName: string, listener: (...args: any[]) => void): this {
    this._emitter.removeListener(eventName, listener);
    return this;
  }

  /**
   * Removes all the listeners for the event name.
   *
   * @param {String} eventName - The event name.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  removeAllListeners(eventName: string): this {
    this._emitter.removeAllListeners(eventName);
    return this;
  }
}

/**
 * Create a global app registry and prevent modification.
 */
export const globalAppRegistry = Object.freeze(new AppRegistry());
