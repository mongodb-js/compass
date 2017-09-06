const Reflux = require('reflux');
const Actions = require('../actions');

const GridStore = Reflux.createStore( {

  init: function() {
    this.filter = {};
    this.listenTo(Actions.addColumn, this.addColumn.bind(this));
    this.listenTo(Actions.removeColumn, this.removeColumn.bind(this));
  },

  addColumn: function(columnBefore, rowIndex) {
    this.trigger(columnBefore, rowIndex);
  },

  removeColumn: function(colId) {
    this.trigger(colId, -1);
  }
});

module.exports = GridStore;
