var View = require('ampersand-view');
var TypeListView = require('./type-list');
var ValueListView = require('./value-list');
var FieldCollection = require('mongodb-schema').FieldCollection;

var BasicFieldView = View.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
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
    },
    values: {
      hook: 'values-container',
      prepareView: function(el) {
        return new ValueListView({
            el: el,
            parent: this,
            collection: this.model.values
          });
      }
    }
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
