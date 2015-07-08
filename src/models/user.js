var Model = require('ampersand-model');
var localforage = require('ampersand-sync-localforage');
var uuid = require('uuid');

var User = Model.extend({
  modelType: 'User',
  props: {
    id: 'string',
    name: 'string',
    email: 'string',
    created_at: 'date'
  },
  sync: localforage('User')
});

User.getOrCreate = function(done) {
  var id = localStorage.getItem('user_id');
  var user;

  if (!id) {
    id = uuid.v4();
    localStorage.setItem('user_id', id);
    user = new User({
      id: id,
      created_at: new Date()
    });
    user.save();
    done(null, user);
  } else {
    user = new User({
      id: id
    });
    user.fetch({
      success: function() {
        done(null, user);
      },
      error: function(model, err) {
        done(err);
      }
    });
  }
};

module.exports = User;
