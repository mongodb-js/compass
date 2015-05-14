var AmpersandView = require('ampersand-view');
var TypeListView = require('./type-list');
var VizView = require('./viz');
var ViewSwitcher = require('ampersand-view-switcher');
var minicharts = require('./minicharts');
var _ = require('lodash');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  template: require('./field-list-item.jade'),
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
    this.model.on('change', _.debounce(function(model) {
      // for now pick first type, @todo: make the type bars clickable and toggle chart
      that.switchView(model.types.at(0));
    }, 100));
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('values-container'));
  },
  switchView: function(typeModel) {
    var type = typeModel._id.toLowerCase();

    // @todo to make below work, Schema has to return ObjectIds, and
    // minicharts/date.js needs to be able to extract dates from ObjectIds

    // _id is handled like date
    // if (this.model._id === '_id') {
    //   type = 'date';
    // }

    // @hack turn all strings into category type for now
    // @todo detect category properly
    if (type === 'string') {
      type = 'category';
    }

    // currently only support boolean, number, date, category
    if (['boolean', 'number', 'date', 'category'].indexOf(type) === -1) return;

    var vizView = new VizView({
      width: 400,
      height: 140,
      model: typeModel,
      renderMode: 'svg',
      className: 'minichart',
      debounceRender: false,
      vizFn: minicharts[type],
    });
    this.viewSwitcher.set(vizView);
  }
});
