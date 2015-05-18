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

var EmbeddedArrayFieldView = View.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    },
  },
  template: require('./array-field.jade'),
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
});

var EmbeddedDocumentFieldView = View.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    },
  },
  template: require('./object-field.jade'),
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
});

var FieldListView = View.extend({
  collections: {
    collection: FieldCollection
  },
  template: '<ul class="list-group" data-hook="fields"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, function(options) {
      var type = options.model.type;
      if (type === 'array') {
        return new EmbeddedArrayFieldView(options);
      }
      if (type === 'object') {
        return new EmbeddedDocumentFieldView(options);
      }
      return new BasicFieldView(options);
    }, this.queryByHook('fields'));
  }
});

module.exports = FieldListView;
