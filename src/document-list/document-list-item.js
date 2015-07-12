var View = require('ampersand-view');

var _ = require('lodash');

var DocumentListItemView = View.extend({
  props: {
    visible: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  events: {
    'click .document-property-header': 'onClick'
  },
  initialize: function() {
    this.listenTo(this.model.collection, 'sync', function() {
      this.visible = true;
    });
  },
  onClick: function(event) {
    event.preventDefault();
    var el = event.delegateTarget.parentElement;
    el.classList.toggle('expanded');
  },
  template: require('./document-list-item.jade'),
  render: function() {
    this.renderWithTemplate(this);
  },
  getType: function(value) {
    if (_.isPlainObject(value)) {
      return 'Object';
    }
    if (_.isArray(value)) {
      return 'Array';
    }
    if (_.has(value, '_bsontype')) {
      return value._bsontype;
    }
    return Object.prototype.toString.call(value)
      .replace(/\[object (\w+)\]/, '$1');
  }
});
module.exports = DocumentListItemView;
