var View = require('ampersand-view');

var CollectionFilterView = View.extend({
  template: require('./collection-filter.jade'),
  props: {
    search: 'string'
  },
  initialize: function() {
    this.listenTo(this, 'change:search', this.applyFilter);
  },
  events: {
    'input [data-hook=search]': 'handleInputChanged'
  },
  render: function() {
    this.renderWithTemplate(this);
    this.cacheElements({
      input: '[data-hook=search]'
    });
    this.input.addEventListener('input', this.handleInputChanged.bind(this), false);
  },
  handleInputChanged: function() {
    this.search = this.input.value.trim();
  },
  applyFilter: function() {
    this.parent.filterCollections(this.search);
  }
});
module.exports = CollectionFilterView;
