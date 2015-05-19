var AmpersandView = require('ampersand-view');
var ValueListItem = require('./value-list-item');

module.exports = AmpersandView.extend({
  template: require('./value-list.jade'),
  render: function() {
    this.renderWithTemplate({});
    this.renderCollection(this.collection, ValueListItem, this.queryByHook('values'));
  }
});
