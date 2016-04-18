var View = require('ampersand-view');
var debug = require('debug')('mongodb-compass:sidebar:filter');

var filterTemplate = require('./filter.jade');

var CollectionFilterView = View.extend({
  template: filterTemplate,
  props: {
    search: 'string',
    placeholder: {
      type: 'string',
      default: 'filter',
      required: false
    }
  },
  initialize: function() {
    this.listenTo(this, 'change:search', this.applyFilter);
  },
  events: {
    'input [data-hook=search]': 'handleInputChanged'
  },
  bindings: {
    placeholder: {
      type: 'attribute',
      name: 'placeholder',
      hook: 'search'
    }
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
    debug('applying filter for `%s`', this.search);
    this.parent.filterItems(this.search);
  }
});
module.exports = CollectionFilterView;
