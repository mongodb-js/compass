var Model = require('ampersand-model');
var MetadataSync = require('./sync/metadata');
var sync = new MetadataSync('com.mongodb.compass.User');
var uuid = require('uuid');

var User = Model.extend({
  modelType: 'User',
  props: {
    id: 'string',
    name: 'string',
    email: 'string',
    created_at: 'date',
    avatar_url: 'string',
    company_name: 'string'
    // github_username: 'string',
    /**
     * `public_repos + public_gists + followers + following`
     */
    // github_score: 'number',
    // github_last_activity_at: 'date'
  },
  sync: sync.exec.bind(sync)
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
