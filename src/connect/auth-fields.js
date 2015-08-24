var InputView = require('./input-view');

/**
 * Define different input fields for authentication methods here. The tabs will automatically
 * render the fields correctly and provide name:value in the resulting object returned by the form.
 *
 * If you use the same objects across different auth methods, they will retain their values, e.g.
 * username or password. If you them to be independent, create separate objects but with the same
 * names and labels.
 */

// var debug = require('debug')('scout:connect:auth-fields');

/**
 * Input field for username. Stores its result in `mongodb_username`.
 */
var username = new InputView({
  template: require('./input-default.jade'),
  name: 'mongodb_username',
  label: 'Username',
  placeholder: '',
  required: true
});

/**
 * Input field for authentication database. Stores its result in `authdb`.
 */
var authdb = new InputView({
  template: require('./input-default.jade'),
  name: 'authdb',
  label: 'Authentication Database',
  placeholder: 'admin',
  required: false
});

/**
 * Input field for password. Stores its result in `mongodb_password`. Uses type='password' to
 * hide input.
 */
var password = new InputView({
  template: require('./input-default.jade'),
  type: 'password',
  name: 'mongodb_password',
  label: 'Password',
  placeholder: '',
  required: true
});

/**
 * Input field for GSSAPI service name (Kerberos). Stores its result in `gssapi_service_name`.
 */
var service_name = new InputView({
  template: require('./input-default.jade'),
  name: 'gssapi_service_name',
  label: 'Kerberos Service Name',
  placeholder: '',
  required: true
});


/**
 * Define fields for each auth method here
 */
module.exports = {
  'SCRAM-SHA-1': [
    username,
    password,
    authdb
  ],

  'MONGODB-CR': [
    username,
    password,
    authdb
  ],

  GSSAPI: [
    username,
    service_name
  ],

  'MONGODB-X509': [
  // @todo what do we need here? nothing?
  ],

  PLAIN: [
  // @todo what do we need here? username/pw?
  ]
};
