var View = require('ampersand-view');
var TypeListView = require('./type-list');
var MinichartView = require('../minicharts');
var FieldCollection = require('mongodb-schema').FieldCollection;
var ViewSwitcher = require('ampersand-view-switcher');
var _ = require('lodash');

var BasicFieldView = View.extend({
  bindings: {
    'model._id': [
      {
        hook: 'name'
      },
      {
        hook: 'name',
        type: function(el) {
          if (this.model._id === '__basic__') {
            el.classList.add('hidden');
          }
        }
      }
    ]
  },
  template: require('./basic-field.jade'),
  subviews: {
    types: {
      hook: 'types-container',
      prepareView: function(el) {
        return new TypeListView({
            el: el,
            parent: this,
            collection: this.model.types
          });
      }
    }
  },
  initialize: function() {
    var that = this;
    // the debounce cuts down computation time by a factor of 5-10 here
    this.model.types.on('sync', _.debounce(function() {
      // for now pick first type, @todo: make the type bars clickable and toggle chart
      that.switchView(that.model.types.at(0));
    }, 300));
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('minichart-container'));
  },
  switchView: function(typeModel) {
    var type = typeModel._id.toLowerCase();

    // @todo currently only support boolean, number, date, category
    if (['objectid', 'boolean', 'number', 'date', 'string'].indexOf(type) === -1) return;

    var miniview = new MinichartView({
      model: typeModel,
    });
    this.viewSwitcher.set(miniview);
  }
});

var ExpandableFieldMixin = {
  bindings: {
    'model._id': {
      hook: 'name'
    },
    'expanded': {
      type: 'booleanClass',
      yes: 'expanded',
      no: 'collapsed'
    }
  },
  events: {
    'click .schema-field-name': 'click',
  },
  props: {
    expanded: {
      type: 'boolean',
      default: true
    }
  },
  click: function(evt) {
    // @todo: persist state of open nodes
    this.toggle('expanded');

    evt.preventDefault();
    evt.stopPropagation();
    return false;
  },
  subviews: {
    fields: {
      hook: 'fields-container',
      prepareView: function(el) {
        return new FieldListView({
            el: el,
            parent: this,
            collection: this.model.fields
          });
      }
    }
  }
};

var EmbeddedArrayFieldView = View.extend(ExpandableFieldMixin, {
  template: require('./array-field.jade')
});

var EmbeddedDocumentFieldView = View.extend(ExpandableFieldMixin, {
  template: require('./object-field.jade')
});

var FieldListView = View.extend({
  collections: {
    collection: FieldCollection
  },
  template: '<div class="schema-field-list" data-hook="fields"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, function(options) {
      var type = options.model.type;
      if (type === 'Array') {
        return new EmbeddedArrayFieldView(options);
      }
      if (type === 'Object') {
        return new EmbeddedDocumentFieldView(options);
      }
      return new BasicFieldView(options);
    }, this.queryByHook('fields'));
  }
});

module.exports = FieldListView;
