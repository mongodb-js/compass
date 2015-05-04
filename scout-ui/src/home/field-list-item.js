var AmpersandView = require('ampersand-view');
var TypeListView = require('./type-list');

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
      prepareView: function(el){
        return new TypeListView({
          el: el,
          parent: this,
          collection: this.model.types
        });
      }
    }
  }
});
