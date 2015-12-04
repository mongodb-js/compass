var View = require('../../sidebar/list').ListItemView;
var moment = require('moment');
var _ = require('lodash');
// var debug = require('debug')('mongodb-compass:connect:sidebar-item-view');

var TWO_DAYS = 24 * 60 * 60 * 1000;

module.exports = View.extend({
  template: require('./sidebar-item-view.jade'),
  derived: {
    'date': {
      deps: ['model.last_used'],
      fn: function() {
        if (this.model.last_used === null) {
          return 'never';
        }
        if ((new Date() - this.model.last_used) < TWO_DAYS) {
          return moment(this.model.last_used).fromNow();
        }
        return moment(this.model.last_used).format('lll');
      }
    }
  },
  bindings: _.extend({}, View.prototype.bindings, {
    'date': {
      hook: 'date'
    }
  })
});
