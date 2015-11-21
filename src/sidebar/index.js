var View = require('ampersand-view');
var ListView = require('./list');
var FilterView = require('./filter');
var ListItemView = require('./list-item');
var _ = require('lodash');
// var debug = require('debug')('scout:sidebar:index');


/**
 * Generic Sidebar class that is used in Compass. It provides optional
 * filtering, widgets that can be rendered at the top of the sidebar,
 * nesting (potentially multiple levels, but only one level tested so far).
 *
 * Collections used for the sidebar need to have the selectableMixin and
 * filterableMixin (if filtering is enabled), @see ../models/
 */
var SidebarView = View.extend({
  props: {
    /**
     * Provide widgets that are rendered above the sidebar. The format is
     * an array of documents:
     * {
     *   viewClass: MyWidgetView,    the widget view class
     *   options: { ... }            passed in when instantiating new view
     * }
     * @type {Array}
     */
    widgets: {
      type: 'array',
      default: function() {
        return [];
      },
      required: true
    },
    /**
     * Set to true to enable the filter above the sidebar
     * @type {Boolean}
     */
    filterEnabled: {
      type: 'boolean',
      default: false,
      required: true
    },
    /**
     * use this property of the model to display as string in sidebar
     * @type {String}
     */
    displayProp: {
      type: 'string',
      default: 'name',
      required: true
    },
    /**
     * a string corresponding to a fontawesome icon, e.g. `fa-database`. If
     * provided, the string will be prepended with this icon
     * @type {String}
     */
    icon: {
      type: 'string',
      default: '',
      required: false
    },
    /**
     * Provide a custom view class for the list-items. If provided, displayProp
     * and icon will be ignored and will have to be set manually in the
     * view class.
     * @type {Object}
     */
    itemViewClass: {
      type: 'any',
      default: null,
      required: false
    },
    /**
     * Enables nested menus. Provide and object with the following keys:
     * {
     *   collectionName {String}   the nested items are in a collection with
     *                             the given name. Default is `collection`.
     *   displayProp {String}      displayProp for nested list items. Default
     *                             is `name`.
     *   icon {String}             icon for the nested list items. Default
     *                             is '' (no icon).
     * }
     * Set to null to disable nesting.
     * @type {Object || null}
     */
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
        // build a custom item view class here, if none is provided. this
        // is necessary so we can have derived properties on a variable
        // name, i.e. `model.<displayProp>`
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
    var re;
    try {
      re = new RegExp(searchString, 'i');
    } catch (e) {
      // invalid regexes are ignored and match everything
      re = /.*/;
    }
    var displayProp = this.displayProp;
    var nested = this.nested;

    this.collection.filter(function(model) {
      if (re.test(_.result(model, displayProp))) {
        if (nested) {
          // if the top-level matches, show all children
          model[nested.collectionName].unfilter();
        }
        return true;
      }
      if (nested) {
        model[nested.collectionName].filter(function(nestedModel) {
          return re.test(_.result(nestedModel, nested.displayProp));
        });
        // show parent if at least one child matches the filter
        return (model[nested.collectionName].length > 0);
      }
      return false;
    });
  }
});

module.exports = SidebarView;
