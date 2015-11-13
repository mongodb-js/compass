var View = require('ampersand-view');
var format = require('util').format;
// var debug = require('debug')('scout:help:index');

module.exports = View.extend({
  session: {
    id: 'string',
    default: '',
    required: true
  },
  template: require('./index.jade'),
  initialize: function(id) {
    // @imlucas how does the id get passed in here?
    this.id = id;
  },
  render: function() {
    this.renderWithTemplate(this);
    var subview = new View();
    subview.template = require(format('./items/%s.jade', this.id));
    this.renderSubview(subview, this.queryByHook('item-subview'));
  }
});

// convenience helper method to open the Help window with the right id
module.exports.open = function(id) {
  var url = format('%s?id=%s#help', window.location.origin, id);
  window.open(url);
};
