import type { Store as RefluxStore } from 'reflux';
import type { Store as ReduxStore } from 'redux';
import EventEmitter from 'eventemitter3';
import { Actions } from './actions';

/**
 * A non-magic number that is still small and higher than
 * the number of components registered for a single role
 * that we would expect.
 */
const INT8_MAX = 127;

interface Role {
  name: string;
  component: React.ComponentType<any>;
  actionName?: string;
  configureActions?: () => any;
  storeName?: string;
  configureStore?: (storeSetup: any) => any;
  order?: number;
}

export type Store = (ReduxStore | Partial<RefluxStore>) & {
  onActivated?: (appRegistry: AppRegistry) => void;
};

export function isReduxStore(store: Store): store is ReduxStore {
  return (
    store &&
    typeof store === 'object' &&
    Object.prototype.hasOwnProperty.call(store, 'dispatch')
  );
}

export interface Plugin {
  store: Store;
  actions?: Record<string, unknown>;
  deactivate?: () => void;
}

/**
 * Is a registry for all user interface components, stores, and actions
 * in the application.
 */
export class AppRegistry {
  _emitter: EventEmitter;
  actions: Record<string, unknown>;
  components: Record<string, React.ComponentType<any>>;
  stores: Record<string, Store>;
  roles: Record<string, Role[]>;
  plugins: Record<string, Plugin>;
  storeMisses: Record<string, number>;

  /**
   * Instantiate the registry.
   */
  constructor() {
    this._emitter = new EventEmitter();
    this.actions = {};
    this.components = {};
    this.stores = {};
    this.roles = {};
    this.plugins = {};
    this.storeMisses = {};
  }

  // Helper until this module is 'proper' fake ESM
  static get Actions(): typeof Actions {
    return Actions;
  }

  // Helper until this module is 'proper' fake ESM
  static get AppRegistry(): typeof AppRegistry {
    return AppRegistry;
  }

  /**
   * Deregister an Actions.
   *
   * @param {String} name - The action to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterAction(name: string): this {
    delete this.actions[name];
    Actions.actionDeregistered(name);
    return this;
  }

  /**
   * Deregister a component.
   *
   * @param {String} name - The component to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterComponent(name: string): this {
    delete this.components[name];
    Actions.componentDeregistered(name);
    return this;
  }

  /**
   * Deregister a role.
   *
   * @param {String} name - The role name.
   * @param {Object} object - The role to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterRole(name: string, object: Role): this {
    const roles = this.roles[name];
    roles.splice(roles.indexOf(object), 1);
    Actions.roleDeregistered(name);
    return this;
  }

  /**
   * Deregister a store.
   *
   * @param {String} name - The store to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterStore(name: string): this {
    delete this.stores[name];
    Actions.storeDeregistered(name);
    return this;
  }

  deregisterPlugin(name: string): this {
    delete this.plugins[name];
    return this;
  }

  /**
   * Get an action for the name.
   *
   * @param {String} name - The action name.
   *
   * @returns {Action} The Actions.
   */
  getAction(name: string): unknown {
    return this.actions[name];
  }

  /**
   * Get a component by name.
   *
   * @param {String} name - The component name.
   *
   * @returns {Component} The component.
   */
  getComponent(name: string): React.ComponentType<any> | undefined {
    return this.components[name];
  }

  /**
   * Get a role by name.
   *
   * @param {String} name - The role name.
   *
   * @returns {Array} The role components.
   */
  getRole(name: string): Role[] | undefined {
    return this.roles[name];
  }

  /**
   * Get a store by name.
   *
   * @param {String} name - The store name.
   *
   * @returns {Store} The store.
   */
  getStore(name: string): Store | undefined {
    return this.stores[name];
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins[name];
  }

  /**
   * Calls onActivated on all the stores in the registry.
   *
   * @returns {AppRegistry} The app registry.
   */
  onActivated(): this {
    return this._callOnStores((store) => {
      if (store.onActivated) {
        store.onActivated(this);
      }
    });
  }

  /**
   * Register an action in the registry.
   *
   * @param {String} name - The name of the Actions.
   * @param {Action} action - The Actions.
   *
   * @returns {AppRegistry} This instance.
   */
  registerAction(name: string, action: unknown): this {
    const overwrite = Object.prototype.hasOwnProperty.call(this.actions, name);
    this.actions[name] = action;
    if (overwrite) {
      Actions.actionOverridden(name);
    } else {
      Actions.actionRegistered(name);
    }
    return this;
  }

  /**
   * Register a component in the registry.
   *
   * @param {String} name - The name of the component.
   * @param {Component} component - The React Component.
   *
   * @returns {AppRegistry} This instance.
   */
  registerComponent(name: string, component: React.ComponentType<any>): this {
    const overwrite = Object.prototype.hasOwnProperty.call(
      this.components,
      name
    );
    this.components[name] = component;
    if (overwrite) {
      Actions.componentOverridden(name);
    } else {
      Actions.componentRegistered(name);
    }
    return this;
  }

  /**
   * Register a role.
   *
   * @param {String} name - The role name.
   * @param {Object} role - The role object.
   *
   * @returns {AppRegistry} This instance.
   */
  registerRole(name: string, role: Role): this {
    if (
      Object.prototype.hasOwnProperty.call(this.roles, name) &&
      !this.roles[name].includes(role)
    ) {
      this.roles[name].push(role);
      this.roles[name].sort(this._roleComparator.bind(this));
    } else {
      this.roles[name] = [role];
    }
    Actions.roleRegistered(name);
    return this;
  }

  /**
   * Register a store in the registry.
   *
   * @param name - The name of the store.
   * @param store - The Reflux store.
   *
   * @returns This instance.
   */
  registerStore(name: string, store: Store): this {
    const overwrite = Object.prototype.hasOwnProperty.call(this.stores, name);
    this.stores[name] = store;
    if (overwrite) {
      Actions.storeOverridden(name);
    } else {
      Actions.storeRegistered(name);
    }
    return this;
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

  _callOnStores(fn: (store: Store) => void): this {
    for (const key of Object.keys(this.stores)) {
      const store = this.stores[key];
      fn(store);
    }
    return this;
  }

  _roleComparator(a: Role, b: Role): number {
    const aOrder = a.order || INT8_MAX;
    const bOrder = b.order || INT8_MAX;
    return aOrder - bOrder;
  }
}

/**
 * Create a global app registry and prevent modification.
 */
export const globalAppRegistry = Object.freeze(new AppRegistry());

export type { Role };
