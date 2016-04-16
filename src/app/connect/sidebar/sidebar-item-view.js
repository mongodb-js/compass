var ListItemView = require('../../sidebar/list').ListItemView;
var moment = require('moment');
var _ = require('lodash');

var sidebarItemTemplate = require('./sidebar-item-view.jade');
// var debug = require('debug')('mongodb-compass:connect:sidebar-item-view');

var TWO_DAYS = 24 * 60 * 60 * 1000;

module.exports = ListItemView.extend({
  template: sidebarItemTemplate,
  derived: {
    date: {
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
    },
    host: {
      deps: ['model.hostname', 'model.port'],
      fn: function() {
        return this.model.hostname + ':' + this.model.port;
      }
    },
    name: {
      deps: ['model.name', 'model.username', 'host'],
      fn: function() {
        if (this.model.is_favorite) {
          return this.model.name;
        }
        var name = this.host;
        if (this.model.authentication !== 'NONE') {
          name = this.model.username + '@' + name;
        }
        return name;
      }
    }
  },
  bindings: _.extend({}, ListItemView.prototype.bindings, {
    date: {
      hook: 'date'
    },
    name: [
      {
        type: 'toggle',
        hook: 'name'
      },
      {
        hook: 'name'
      }
    ],
    host: {
      type: 'attribute',
      name: 'title'
    }
  })
});
