'use strict';

const Reflux = require('reflux');
const Actions = require('./actions');
const DataService = require('./data-service');

/**
 * The store for handling data service interactions.
 */
const DataServiceStore = Reflux.createStore({

  /**
   * Initialize the store by listening to all the actions.
   */
  init: function() {
    this.listenTo(Actions.connect, this.connect.bind(this));
  },

  /**
   * Connect the data service store.
   *
   * @param {ConnectionModel} model - The connection model.
   */
  connect: function(model) {
    this.dataService = new DataService(model);
    this.dataService.on('topologyDescriptionChanged', (evt) => {
      Actions.topologyDescriptionChanged(evt);
    });
    this.dataService.connect((error) => {
      this.trigger(error, this.dataService);
    });
  }
});

module.exports = DataServiceStore;
