'use strict';

const ComponentRegistry = require('mongodb-component-registry');
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
