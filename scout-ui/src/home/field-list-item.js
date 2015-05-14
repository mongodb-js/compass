var AmpersandView = require('ampersand-view');
var TypeListView = require('./type-list');
var VizView = require('./viz');
var ViewSwitcher = require('ampersand-view-switcher');
var minicharts = require('./minicharts');

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
    this.model.on('change', function(model) {
      // for now pick first type, @todo: make the type bars clickable and toggle chart
      this.switchView(model.types.at(0));
    }, this);
  },
  render: function() {
    this.renderWithTemplate(this);
    this.viewSwitcher = new ViewSwitcher(this.queryByHook('values-container'));
  },
  switchView: function(typeModel) {
    var type = typeModel._id.toLowerCase();

    // @todo to make below work, Schema has to return ObjectIds, and
    // minicharts/date.js needs to be able to extract date objects from ObjectIds

    // _id is handled like date
    // if (this.model._id === '_id') {
    //   type = 'date';
    // }

    // currently only support boolean, number, date
    if (['boolean', 'number', 'date'].indexOf(type) === -1) return;

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
