var ListItemView = require('../../sidebar/list').ListItemView;
var moment = require('moment');
var _ = require('lodash');
var format = require('util').format;
// var debug = require('debug')('mongodb-compass:connect:sidebar-item-view');

var TWO_DAYS = 24 * 60 * 60 * 1000;

module.exports = ListItemView.extend({
  template: require('./sidebar-item-view.jade'),
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
    }
  },
  bindings: _.extend({}, ListItemView.prototype.bindings, {
    date: {
      hook: 'date'
    },
    'model.name': [
      {
        type: 'toggle',
        hook: 'name'
      },
      {
        hook: 'name'
      }
    ],
    host: [
      {
        type: 'toggle',
        hook: 'host'
      },
      {
        hook: 'host-text'
      },
      {
        type: 'attribute',
        hook: 'host-text',
        name: 'title'
      }
    ],
    'model.username': [
      {
        type: 'toggle',
        hook: 'user'
      },
      {
        hook: 'user-text'
      },
      {
        type: 'attribute',
        hook: 'user-text',
        name: 'title'
      }
    ]
  })
});
