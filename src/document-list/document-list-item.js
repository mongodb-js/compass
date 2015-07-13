var View = require('ampersand-view');
var moment = require('moment');
var _ = require('lodash');

function getType(value) {
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
    this.renderWithTemplate({
      getType: getType,
      model: this.model,
      moment: moment
    });
  }
});
module.exports = DocumentListItemView;
