var AmpersandView = require('ampersand-view');
var TypeListItem = require('./type-list-item');

module.exports = AmpersandView.extend({
  template: require('./type-list.jade'),
  render: function() {
    this.renderWithTemplate({});
    this.renderCollection(this.collection.sort(), TypeListItem, this.queryByHook('types'));
  }
});
