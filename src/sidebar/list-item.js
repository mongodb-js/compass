var View = require('ampersand-view');
var debug = require('debug')('mongodb-compass:sidebar:list-item');
var ListView = require('./list');
var _ = require('lodash');

var ListItemView = View.extend({
  template: require('./list-item.jade'),
  props: {
    icon: {
      type: 'string',
      default: null,
      required: false
    },
    nested: {
      type: 'object',
      default: null,
      required: false
    }
  },
  bindings: {
    icon: {
      type: 'class',
      hook: 'icon'
    },
    nested: {
      type: 'booleanClass',
      no: 'list-group-item',
      yes: 'list-group-item-heading'
    },
    value: {
      hook: 'value'
    },
    title: {
      type: 'attribute',
      hook: 'value',
      name: 'title'
    },
    'model.selected': {
      type: 'booleanClass',
      name: 'active'
    }
  },
  events: {
    click: 'onClick'
  },
  derived: {
    value: {
      deps: ['model.name'],
      fn: function() {
        return this.model.name;
      }
    },
    title: {
      // in the basic item view this is identical to value
      deps: ['value'],
      fn: function() {
        return this.value;
      }
    }
  },
  subviews: {
    list: {
      hook: 'nested-list-subview',
      waitFor: 'nested',
      prepareView: function(el) {
        var nested = this.nested;
        var ItemViewClass = nested.itemViewClass || ListItemView.extend({
          props: {
            icon: {
              type: 'string',
              default: nested.icon,
              required: false
            }
          },
          derived: {
            value: {
              deps: ['model.' + nested.displayProp],
              fn: function() {
                return _.get(this.model, nested.displayProp);
              }
            }
          }
        });
        return new ListView({
          el: el,
          parent: this,
          collection: this.model[nested.collectionName],
          itemViewClass: ItemViewClass,
          nested: this.nested.nested || null
        });
      }
    }
  },
  initialize: function(options) {
    debug('view options', options);
  },
  show: function(model) {
    // propagting up
    this.parent.parent.show(model);
  },
  onClick: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (!this.nested) {
      this.parent.show(this.model);
    }
  }
});

module.exports = ListItemView;
