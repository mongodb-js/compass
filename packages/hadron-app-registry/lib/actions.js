'use strict';

const debug = require('debug')('hadron-app-registry:actions');
const Reflux = require('reflux');

/**
 * The action for an action being deregistered.
 */
const actionDeregistered = Reflux.createAction({

  /**
   * Log the action.
   *
   * @param {String} name - The action name.
   */
  preEmit: function(name) {
    debug(`Action ${name} deregistered.`);
  }
});

/**
 * The action for an action being registered.
 */
const actionRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The action name.
   */
  preEmit: function(name) {
    debug(`Action ${name} registered.`);
  }
});

/**
 * The action for an action being overridden.
 */
const actionOverridden = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The action name.
   */
  preEmit: function(name) {
    debug(`Action ${name} overwrote existing action in the registry.`);
  }
});

/**
 * The action for a component being deregistered.
 */
const componentDeregistered = Reflux.createAction({

  /**
   * Log the action.
   *
   * @param {String} name - The component name.
   */
  preEmit: function(name) {
    debug(`Component ${name} deregistered.`);
  }
});

/**
 * The action for a component being registered.
 */
const componentRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The component name.
   */
  preEmit: function(name) {
    debug(`Component ${name} registered.`);
  }
});

/**
 * The action for a container being deregistered.
 */
const containerDeregistered = Reflux.createAction({

  /**
   * Log the action.
   *
   * @param {String} name - The container name.
   */
  preEmit: function(name) {
    debug(`Container ${name} deregistered.`);
  }
});

/**
 * The action for a container being registered.
 */
const containerRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The container name.
   */
  preEmit: function(name) {
    debug(`Container ${name} registered.`);
  }
});

/**
 * The action for a component being overridden.
 */
const componentOverridden = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The component name.
   */
  preEmit: function(name) {
    debug(`Component ${name} overwrote existing component in the registry.`);
  }
});

/**
 * The action for a role being deregistered.
 */
const roleDeregistered = Reflux.createAction({

  /**
   * Log the action.
   *
   * @param {String} name - The role name.
   */
  preEmit: function(name) {
    debug(`Role ${name} deregistered.`);
  }
});

/**
 * The action for a role being registered.
 */
const roleRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The role name.
   */
  preEmit: function(name) {
    debug(`Role ${name} registered.`);
  }
});

/**
 * The action for a store being deregistered.
 */
const storeDeregistered = Reflux.createAction({

  /**
   * Log the action.
   *
   * @param {String} name - The store name.
   */
  preEmit: function(name) {
    debug(`Store ${name} deregistered.`);
  }
});

/**
 * The action for a store being registered.
 */
const storeRegistered = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The store name.
   */
  preEmit: function(name) {
    debug(`Store ${name} registered.`);
  }
});

/**
 * The action for a store being overridden.
 */
const storeOverridden = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {String} name - The store name.
   */
  preEmit: function(name) {
    debug(`Store ${name} overwrote existing store in the registry.`);
  }
});

module.exports.actionDeregistered = actionDeregistered;
module.exports.actionRegistered = actionRegistered;
module.exports.actionOverridden = actionOverridden;
module.exports.componentDeregistered = componentDeregistered;
module.exports.componentRegistered = componentRegistered;
module.exports.componentOverridden = componentOverridden;
module.exports.containerDeregistered = containerDeregistered;
module.exports.containerRegistered = containerRegistered;
module.exports.roleDeregistered = roleDeregistered;
module.exports.roleRegistered = roleRegistered;
module.exports.storeDeregistered = storeDeregistered;
module.exports.storeRegistered = storeRegistered;
module.exports.storeOverridden = storeOverridden;
