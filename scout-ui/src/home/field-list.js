var AmpersandView = require('ampersand-view');
var FieldListItem = require('./field-list-item');

module.exports = AmpersandView.extend({
  template: require('./field-list.jade'),
  render: function() {
    this.renderWithTemplate({});
    this.renderCollection(this.collection, FieldListItem, this.queryByHook('fields'));
  }
});
