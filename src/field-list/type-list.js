var View = require('ampersand-view');
var TypeListItem = require('./type-list-item');

module.exports = View.extend({
  template: require('./type-list.jade'),
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, TypeListItem, this.queryByHook('types'));
  }
});
