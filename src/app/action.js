'use strict';

const debug = require('debug')('compass:action');
const Reflux = require('reflux');

/**
 * The action for the filter being changed.
 */
const filterChanged = Reflux.createAction({
  /**
   * Log the action.
   *
   * @param {Component} component - The React component.
   */
  preEmit: function(filter) {
    debug(`Filter changed to: ${filter}.`);
  }
});

module.exports.filterChanged = filterChanged;
