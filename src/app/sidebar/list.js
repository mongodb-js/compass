var View = require('ampersand-view');
var raf = require('raf');
var _ = require('lodash');

var listTemplate = require('../templates').sidebar['list'];
var listItemTemplate = require('../templates').sidebar['list-item'];

var ListItemView;

var ListView = View.extend({
  props: {
    listOptions: {
      type: 'object',
      default: function() {
        return {};
      },
      required: true
    }
  },
  derived: {
    isNested: {
      deps: ['listOptions'],
      fn: function() {
        return !!this.listOptions.nested;
      }
    }
  },
  bindings: {
    isNested: {
      type: 'booleanClass',
      yes: 'root',
      no: 'nested'
    }
  },
  template: listTemplate,
  render: function() {
    var ItemViewClass = _.get(this.listOptions, 'itemViewClass', ListItemView);
    this.listOptions.parent = this;
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, ItemViewClass,
      this.queryByHook('item-container'), {
        viewOptions: this.listOptions
      }
    );
  },
  show: function(model) {
    var parent = this.parent;
    raf(function() {
      parent.show(model);
    });
  }
});

ListItemView = View.extend({
  template: listItemTemplate,
  props: {
    displayProp: ['any', false, undefined],
    icon: ['any', false, undefined],
    nested: ['any', false, undefined]
  },
  bindings: {
    iconName: [
      {
        type: 'class',
        hook: 'icon'
      },
      {
        type: 'toggle',
        hook: 'icon'
      }
    ],
    nested: {
      type: 'booleanClass',
      no: 'list-group-item',
      yes: 'list-group-item-heading'
    },
    displayValue: {
      hook: 'displayValue'
    },
    title: {
      type: 'attribute',
      hook: 'displayValue',
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
    hasChildren: {
      deps: ['nested', 'model'],
      fn: function() {
        return (this.nested && this.model[this.nested.collectionName]);
      }
    },
    displayValue: {
      deps: ['model', 'displayProp'],
      fn: function() {
        if (_.isFunction(this.displayProp)) {
          return this.displayProp(this);
        }
        return _.result(this.model, this.displayProp, this.model.getId());
      }
    },
    iconName: {
      deps: ['model', 'icon'],
      fn: function() {
        if (!this.icon) {
          return '';
        }
        if (_.isFunction(this.icon)) {
          return this.icon(this);
        }
        return this.icon;
      }
    },
    title: {
      // in the basic item view this is identical to displayValue
      deps: ['displayValue'],
      fn: function() {
        return this.displayValue;
      }
    }
  },
  subviews: {
    list: {
      hook: 'nested-list-subview',
      waitFor: 'hasChildren',
      prepareView: function(el) {
        var nested = this.nested;
        return new ListView({
          el: el,
          parent: this,
          collection: this.model[nested.collectionName],
          listOptions: this.nested
        });
      }
    }
  },
  render: function() {
    this.renderWithTemplate(this);
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

module.exports = ListView;
module.exports.ListItemView = ListItemView;
