'use strict';

const core = require('compass-core');
const ComponentRegistry = core.ComponentRegistry;
const IndexesComponent = require('./component/indexes-component');

module.exports = {
  /**
   * Activate the compass-indexes package.
   */
  activate: function() {
    ComponentRegistry.register(
      IndexesComponent, { role: "Modal::Indexes" }
    );
  },

  /**
   * Deactivate the compass-indexes package.
   */
  deactivate: function() {
    ComponentRegistry.deregister(IndexesComponent);
  }
};
