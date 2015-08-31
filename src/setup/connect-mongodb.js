var View = require('ampersand-view');
var debug = require('debug')('scout:setup:connect-mongodb');

module.exports = View.extend({
  events: {
    'click [data-hook=continue]': 'onSubmit'
  },
  template: require('./connect-mongodb.jade'),
  onSubmit: function(evt) {
    evt.preventDefault();
    this.parent.set({
      hostname: this.query('input[name=hostname]').value || 'localhost',
      port: parseInt(this.query('input[name=port]').value || 27017, 10),
      connection_name: this.query('input[name=name]').value || 'Local'
    });

    this.parent.step++;
  }
});
