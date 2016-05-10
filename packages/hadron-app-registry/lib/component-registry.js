'use strict';

const _ = require('lodash');
const Action = require('hadron-action');

/**
 * Is a registry for all user interface components in the application.
 *
 * @todo: Durran: Is candidate for separate module.
 */
class ComponentRegistry {

  /**
   * Instantiate the registry.
   */
  constructor() {
    this.registry = {};
  }

  /**
   * Deregister a component.
   *
   * @param {Component} component - The component to deregister.
   *
   * @returns {ComponentRegistry} This instance.
   */
  deregister(component) {
    delete this.registry[component.displayName];
    Action.componentDeregistered(component);
    return this;
  }

  /**
   * Deregisters all components in the registry.
   *
   * @returns {ComponentRegistry} This instance.
   */
  deregisterAll() {
    _.each(this.registry, (value) => {
      this.deregister(value.component);
    });
    return this;
  }

  /**
   * Find all components by a specific container.
   *
   * @param {String} container - The container type.
   *
   * @returns {Array} The matching components.
   */
  findByContainer(container) {
    return _.reduce(this.registry, (result, value) => {
      if (value.container === container) {
        result.push(value.component);
      }
      return result;
    }, []);
  }

  /**
   * Find all components by a specific role.
   *
   * @param {String} role - The role type.
   *
   * @returns {Array} The matching components.
   */
  findByRole(role) {
    return _.reduce(this.registry, (result, value) => {
      if (value.role === role) {
        result.push(value.component);
      }
      return result;
    }, []);
  }

  /**
   * Register a component in the registry.
   *
   * @param {Component} component - The React Component.
   * @param {Object} options - The component options.
   *
   * @returns {ComponentRegistry} This instance.
   */
  register(component, options) {
    this.registry[component.displayName] = {
      component: component,
      container: options.container,
      role: options.role
    };
    Action.componentRegistered(component, options);
    return this;
  }
}

module.exports = ComponentRegistry;
