'use strict';

const Reflux = require('reflux');
const EventEmitter = require('eventemitter3');
const debug = require('debug')('hadron-app-registry:app-registry');

const Action = require('./actions');

/**
 * A non-magic number that is still small and higher than
 * the number of components registered for a single role
 * that we would expect.
 */
const INT8_MAX = 127;

/**
 * Returning a fake store when asking for a store that does not
 * exist.
 */
const STUB_STORE = Reflux.createStore();

/**
 * Is a registry for all user interface components, stores, and actions
 * in the application.
 */
class AppRegistry {
  /**
   * Instantiate the registry.
   */
  constructor() {
    this._emitter = new EventEmitter();
    this.actions = {};
    this.components = {};
    this.stores = {};
    this.containers = {};
    this.roles = {};
    this.storeMisses = {};
  }

  /**
   * Deregister an action.
   *
   * @param {String} name - The action to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterAction(name) {
    delete this.actions[name];
    Action.actionDeregistered(name);
    return this;
  }

  /**
   * Deregister a component.
   *
   * @param {String} name - The component to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterComponent(name) {
    delete this.components[name];
    Action.componentDeregistered(name);
    return this;
  }

  /**
   * Deregister a container.
   *
   * @param {String} name - The container name.
   * @param {Component} component - The container to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterContainer(name, component) {
    const containers = this.containers[name];
    containers.splice(containers.indexOf(component), 1);
    Action.containerDeregistered(name);
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
  deregisterRole(name, object) {
    const roles = this.roles[name];
    roles.splice(roles.indexOf(object), 1);
    Action.roleDeregistered(name);
    return this;
  }

  /**
   * Deregister a store.
   *
   * @param {String} name - The store to deregister.
   *
   * @returns {AppRegistry} This instance.
   */
  deregisterStore(name) {
    delete this.stores[name];
    Action.storeDeregistered(name);
    return this;
  }

  /**
   * Get an action for the name.
   *
   * @param {String} name - The action name.
   *
   * @returns {Action} The action.
   */
  getAction(name) {
    return this.actions[name];
  }

  /**
   * Get a container by name.
   *
   * @param {String} name - The container name.
   *
   * @returns {Array} The container components.
   */
  getContainer(name) {
    return this.containers[name];
  }

  /**
   * Get a component by name.
   *
   * @param {String} name - The component name.
   *
   * @returns {Component} The component.
   */
  getComponent(name) {
    return this.components[name];
  }

  /**
   * Get a role by name.
   *
   * @param {String} name - The role name.
   *
   * @returns {Array} The role components.
   */
  getRole(name) {
    return this.roles[name];
  }

  /**
   * Get a store by name.
   *
   * @param {String} name - The store name.
   *
   * @returns {Store} The store.
   */
  getStore(name) {
    const store = this.stores[name];
    if (store === undefined) {
      this.storeMisses[name] = (this.storeMisses[name] || 0) + 1;
      return STUB_STORE;
    }
    return store;
  }

  /**
   * Calls onActivated on all the stores in the registry.
   *
   * @returns {AppRegistry} The app registry.
   */
  onActivated() {
    return this._callOnStores((store) => {
      if (store.onActivated) {
        store.onActivated(this);
      }
    });
  }

  /**
   * Register an action in the registry.
   *
   * @param {String} name - The name of the action.
   * @param {Action} action - The action.
   *
   * @returns {AppRegistry} This instance.
   */
  registerAction(name, action) {
    var overwrite = this.actions.hasOwnProperty(name);
    this.actions[name] = action;
    if (overwrite) {
      Action.actionOverridden(name);
    } else {
      Action.actionRegistered(name);
    }
    return this;
  }

  /**
   * Register a container.
   *
   * @param {String} name - The container name.
   * @param {Component} container - The container component.
   *
   * @returns {AppRegistry} This instance.
   */
  registerContainer(name, container) {
    if (this.containers.hasOwnProperty(name) && !this.containers[name].includes(container)) {
      this.containers[name].push(container);
    } else {
      this.containers[name] = [ container ];
    }
    Action.containerRegistered(name);
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
  registerComponent(name, component) {
    var overwrite = this.components.hasOwnProperty(name);
    this.components[name] = component;
    if (overwrite) {
      Action.componentOverridden(name);
    } else {
      Action.componentRegistered(name);
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
  registerRole(name, role) {
    if (this.roles.hasOwnProperty(name) && !this.roles[name].includes(role)) {
      this.roles[name].push(role);
      this.roles[name].sort(this._roleComparator);
    } else {
      this.roles[name] = [ role ];
    }
    Action.roleRegistered(name);
    return this;
  }

  /**
   * Register a store in the registry.
   *
   * @param {String} name - The name of the store.
   * @param {Store} store - The Reflux store.
   *
   * @returns {AppRegistry} This instance.
   */
  registerStore(name, store) {
    var overwrite = this.stores.hasOwnProperty(name);
    this.stores[name] = store;
    if (overwrite) {
      Action.storeOverridden(name);
    } else {
      Action.storeRegistered(name);
    }
    return this;
  }

  /**
   * Adds a listener for the event name to the underlying event emitter.
   *
   * @param {String} eventName - The event name.
   * @param {Function} listener - The listener.
   *
   * @returns {AppRegistry} The chainable app registry.
   */
  addListener(eventName, listener) {
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
  emit(eventName, ...args) {
    return this._emitter.emit(eventName, ...args);
  }

  /**
   * Return all the event names.
   *
   * @returns {Array} The event names.
   */
  eventNames() {
    return this._emitter.eventNames();
  }

  /**
   * Gets a count of listeners for the event name.
   *
   * @param {String} eventName - The event name.
   *
   * @returns {Number} The listener count.
   */
  listenerCount(eventName) {
    return this._emitter.listeners(eventName).length;
  }

  /**
   * Get all the listeners for the event.
   *
   * @param {String} eventName - The event name.
   *
   * @returns {Array} The listeners for the event.
   */
  listeners(eventName) {
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
  on(eventName, listener) {
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
  once(eventName, listener) {
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
  removeListener(eventName, listener) {
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
  removeAllListeners(eventName) {
    this._emitter.removeAllListeners(eventName);
    return this;
  }

  _callOnStores(fn) {
    for (let key in this.stores) {
      if (this.stores.hasOwnProperty(key)) {
        const store = this.stores[key];
        fn(store);
      }
    }
    return this;
  }

  _roleComparator(a, b) {
    const aOrder = a.order || INT8_MAX;
    const bOrder = b.order || INT8_MAX;
    return aOrder - bOrder;
  }
}

module.exports = AppRegistry;
