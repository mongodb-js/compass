var AmpersandView = require('ampersand-view');
var TypeListView = require('./type-list');
var ValueListView = require('./value-list');
var FieldListView = require('./field-list');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    },
    'model.has_children': {
      type: 'booleanClass',
      yes: 'expandable'
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
    },
// fields: {
//   hook: 'fields-container',
//   prepareView: function(el) {
//     return new FieldListView({
//         el: el,
//         parent: this,
//         collection: this.model.fields
//       });
//   }
// }
  }
});
