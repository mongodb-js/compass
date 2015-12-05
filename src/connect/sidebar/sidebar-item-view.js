var ListItemView = require('../../sidebar/list').ListItemView;
var moment = require('moment');
var _ = require('lodash');
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
    }
    // user: {
    //   deps: ['model.authentication'],
    //   fn: function() {
    //     if (this.model.authentication === 'NONE') {
    //       return null;
    //     }
    //     if (this.model.authentication === 'MONGODB') {
    //       return this.model.mongodb_username;
    //     }
    //     if (this.model.authentication === 'KERBEROS') {
    //       return this.model.kerberos_principal;
    //     }
    //     if (this.model.authentication === 'PLAIN') {
    //       return this.model.ldap_username;
    //     }
    //     if (this.model.authentication === 'X509') {
    //       return this.model.x509_username;
    //     }
    //   }
    // }
  },
  bindings: _.extend({}, ListItemView.prototype.bindings, {
    date: {
      hook: 'date'
    }
    // user: [
    //   {
    //     type: 'toggle',
    //     hook: 'user'
    //   },
    //   {
    //     hook: 'username'
    //   }
    // ]
  })
});
