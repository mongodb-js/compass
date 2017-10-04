const Reflux = require('reflux');
const toNS = require('mongodb-ns');
const Actions = require('../actions');
const _ = require('lodash');

/**
 * The reflux store for resetting the document list.
 */
const ResetDocumentListStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.filter = {};
    this.sort = [[ '_id', 1 ]];
    this.limit = 0;
    this.skip = 0;
    this.project = null;
    this.ns = '';
    Actions.refreshDocuments.listen(this.reset.bind(this));
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    if (state.ns && toNS(state.ns).collection) {
      this.filter = state.filter || {};
      this.sort = _.toPairs(state.sort);
      this.limit = state.limit;
      this.skip = state.skip;
      this.project = state.project;
      this.ns = state.ns;
      this.reset();
    }
  },

  /**
   * This function is called when the collection filter changes.
   *
   * @param {Object} filter - The query filter.
   */
  reset: function() {
    const countOptions = {
      skip: this.skip
    };

    const findOptions = {
      sort: this.sort,
      fields: this.project,
      skip: this.skip,
      limit: 20,
      promoteValues: false
    };

    // only set limit if it's > 0, read-only views cannot handle 0 limit.
    if (this.limit > 0) {
      countOptions.limit = this.limit;
      findOptions.limit = Math.min(20, this.limit);
    }

    global.hadronApp.dataService.count(this.ns, this.filter, countOptions, (err, count) => {
      if (!err) {
        global.hadronApp.dataService.find(this.ns, this.filter, findOptions, (error, documents) => {
          this.trigger(error, documents, count);
        });
      } else {
        // If the count gets an error we need to display this to the user since
        // they have the wrong privs.
        this.trigger(err);
      }
    });
  }
});

module.exports = ResetDocumentListStore;
