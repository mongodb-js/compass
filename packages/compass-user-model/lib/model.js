var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var uuid = require('uuid');
var electron = require('electron');
var electronApp = electron.remote ? electron.remote.app : undefined;

// var debug = require('debug')('scout:user');

var User = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Users',
  storage: {
    backend: 'disk',
    basepath: electronApp ? electronApp.getPath('userData') : undefined
  },
  props: {
    id: {
      type: 'string',
      required: true,
      default: function() {
        return uuid.v4();
      }
    },
    name: 'string',
    email: {
      type: 'any',
      default: undefined,
      required: false,
      allowNull: true
    },
    createdAt: 'date',
    lastUsed: 'date',
    avatarUrl: 'string',
    companyName: 'string',
    developer: 'boolean',
    twitter: 'string'
  }
});

User.getOrCreate = function(userId, done) {
  var user = new User({
    id: userId || uuid.v4(),
    createdAt: new Date()
  });
  user.fetch({
    success: function() {
      user.save({
        lastUsed: new Date()
      });
      done(null, user);
    },
    error: function(model, err) {
      done(err);
    }
  });
};

module.exports = User;
