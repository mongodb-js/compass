var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var uuid = require('uuid');

// var debug = require('debug')('scout:user');

var User = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Users',
  storage: 'local',
  props: {
    id: {
      type: 'string',
      required: true,
      default: function() {
        return uuid.v4();
      }
    },
    name: 'string',
    email: 'string',
    createdAt: 'date',
    lastUsed: 'date',
    avatarUrl: 'string',
    companyName: 'string'
    // github_username: 'string',
    // github_score: 'number',
    // github_last_activity_at: 'date'
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
