var View = require('ampersand-view');
var TypeListView = require('./type-list');
var MinichartView = require('../minicharts');
var FieldCollection = require('mongodb-schema').FieldCollection;
var ViewSwitcher = require('ampersand-view-switcher');
var debug = require('debug')('scout-ui:field-list:index');
var _ = require('lodash');

var FieldView = View.extend({
  props: {
    minichartModel: 'state',
    expanded: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    'model.fields': {
      type: 'booleanClass',
      yes: 'caret',
      no: '',
      hook: 'caret'
    },
    'model.name': {
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
  template: require('./field.jade'),
  subviews: {
    types: {
      hook: 'types-subview',
      prepareView: function(el) {
        return new TypeListView({
            el: el,
            parent: this,
            collection: this.model.types
          });
      }
    },
    fields: {
      hook: 'fields-subview',
      waitFor: 'model.fields',
      prepareView: function(el) {
        return new FieldListView({
            el: el,
            parent: this,
            collection: this.model.fields
          });
      }
    }
  },
  initialize: function() {
    var that = this;
    // debounce prevents excessive rendering
    this.model.parent.on('end', function(evt) {
      debug('schema end trigger for', that.model.getType(), that.model.name);
      // for now pick first type, @todo: make the type bars clickable and toggle chart
      that.switchView(that.model.types.at(0));
    });
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('minichart-container'));
    if (this.model.types.length > 0) {
      this.switchView(this.model.types.at(0));
    }
  },
  switchView: function(typeModel) {
    var type = typeModel.getId().toLowerCase();

    // @todo currently only support boolean, number, date, category
    if (['objectid', 'boolean', 'number', 'date', 'string'].indexOf(type) === -1) return;

    this.minichartModel = typeModel;
    var miniview = new MinichartView({
      model: typeModel,
    });
    this.viewSwitcher.set(miniview);
  },
  click: function(evt) {
    // @todo: persist state of open nodes
    this.toggle('expanded');

    evt.preventDefault();
    evt.stopPropagation();
    return false;
  }
});

var FieldListView = View.extend({
  collections: {
    collection: FieldCollection
  },
  template: require('./index.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, FieldView, this.queryByHook('fields'));
  }
});

module.exports = FieldListView;
