'use strict';

const Action = require('./actions');

/**
 * Is a registry for all user interface components, stores, and actions
 * in the application.
 */
class AppRegistry {

  /**
   * Instantiate the registry.
   *
   * @todo: Package manager activates at end.
   */
  constructor() {
    this.actions = {};
    this.components = {};
    this.stores = {};
    this.containers = {};
    this.roles = {};
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
    return this.stores[name];
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
}

module.exports = AppRegistry;
