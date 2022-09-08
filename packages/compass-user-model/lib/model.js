const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const uuid = require('uuid');

let electronApp;
try {
  electronApp = require('@electron/remote').app;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load @electron/remote', e.message);
}

// const debug = require('debug')('scout:user');

const User = Model.extend(storageMixin, {
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

User.getOrCreate = (id) => new Promise((resolve, reject) => {
  const user = new User({
    id: id || uuid.v4(),
    createdAt: new Date()
  });
  user.fetch({
    success: function() {
      user.save({
        lastUsed: new Date()
      });
      resolve(user);
    },
    error: function(model, err) {
      reject(err);
    }
  });
});

module.exports = User;
