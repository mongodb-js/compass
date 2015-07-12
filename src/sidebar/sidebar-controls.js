var CollectionFilterView = require('./collection-filter');
var SidebarControlsView = CollectionFilterView.extend({
  template: require('./sidebar-controls.jade'),
  applyFilter: function() {
    this.parent.filterFields(this.search);
  }
});

module.exports = SidebarControlsView;
