var View = require('ampersand-view');
var ListView = require('./list');
var FilterView = require('./filter');
var ListItemView = require('./list-item');
var _ = require('lodash');
// var debug = require('debug')('scout:sidebar:index');


var SidebarView = View.extend({
  props: {
    widgets: {
      type: 'array',
      default: function() {
        return [];
      },
      required: true
    },
    filterEnabled: {
      type: 'boolean',
      default: false,
      required: true
    },
    displayProp: {
      type: 'string',
      default: 'name',
      required: true
    },
    itemViewClass: {
      type: 'any',
      default: null,
      required: false
    },
    icon: {
      type: 'string',
      default: '',
      required: false
    },
    nested: {
      type: 'object',
      default: null,
      required: false
    }
  },
  bindings: {
    filterEnabled: {
      type: 'toggle',
      hook: 'filter'
    }
  },
  template: require('./index.jade'),
  subviews: {
    filter: {
      hook: 'filter-subview',
      waitFor: 'filterEnabled',
      prepareView: function(el) {
        return new FilterView({
          el: el,
          parent: this
        });
      }
    },
    list: {
      hook: 'list-subview',
      prepareView: function(el) {
        var displayProp = this.displayProp;
        var icon = this.icon;

        var ItemViewClass = this.itemViewClass || ListItemView.extend({
          props: {
            icon: {
              type: 'string',
              default: icon,
              required: false
            }
          },
          derived: {
            value: {
              deps: ['model.' + displayProp],
              fn: function() {
                return _.get(this.model, displayProp);
              }
            }
          }
        });

        return new ListView({
          el: el,
          parent: this,
          collection: this.collection,
          itemViewClass: ItemViewClass,
          nested: this.nested
        });
      }
    }
  },
  show: function(model) {
    this.trigger('show', model);
  },
  render: function() {
    this.renderWithTemplate(this);
    // render widgets
    _.each(this.widgets, function(widget) {
      widget.options = _.defaults({
        parent: this
      }, widget.options || {});
      /* eslint new-cap: 0 */
      this.renderSubview(new widget.viewClass(widget.options),
        this.queryByHook('widget-container'));
    }.bind(this));
  },
  filterItems: function(searchString) {
    var re = new RegExp(searchString);
    var displayProp = this.displayProp;
    var nested = this.nested;

    this.collection.filter(function(model) {
      if (re.test(_.get(model, displayProp))) {
        model[nested.collectionName].unfilter();
        return true;
      }
      if (nested) {
        model[nested.collectionName].filter(function(nestedModel) {
          return re.test(_.get(nestedModel, nested.displayProp));
        });
        return (model[nested.collectionName].length > 0);
      }
      return false;
    });
  }
});

module.exports = SidebarView;
