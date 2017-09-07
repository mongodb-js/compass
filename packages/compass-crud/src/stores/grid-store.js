const Reflux = require('reflux');
const Actions = require('../actions');

const GridStore = Reflux.createStore( {

  init: function() {
    this.filter = {};
    this.listenTo(Actions.addColumn, this.addColumn.bind(this));
    this.listenTo(Actions.removeColumn, this.removeColumn.bind(this));
  },

  addColumn: function(columnBefore, rowIndex) {
    this.trigger({add: {colId: columnBefore, rowIndex: rowIndex}});
  },

  removeColumn: function(colId) {
    this.trigger({remove: {colIds: [colId]}});
  }
});

module.exports = GridStore;
