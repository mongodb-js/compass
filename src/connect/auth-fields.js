var InputView = require('./input-view');
var inputTemplate = require('./input-default.jade');
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
var mongodb_username = new InputView({
  template: inputTemplate,
  name: 'mongodb_username',
  label: 'Username',
  placeholder: '',
  required: true
});

/**
 * Input field for authentication database. Stores its result in `database_name`.
 */
var mongodb_database_name = new InputView({
  template: inputTemplate,
  name: 'mongodb_database_name',
  label: 'Authentication Database',
  placeholder: 'admin',
  required: false
});

/**
 * Input field for password. Stores its result in `mongodb_password`. Uses type='password' to
 * hide input.
 */
var mongodb_password = new InputView({
  template: inputTemplate,
  type: 'password',
  name: 'mongodb_password',
  label: 'Password',
  placeholder: '',
  required: true
});

/**
 * Input field for GSSAPI service name (Kerberos). Stores its result in `gssapi_service_name`.
 */
var kerberos_service_name = new InputView({
  template: inputTemplate,
  name: 'kerberos_service_name',
  label: 'Kerberos Service Name',
  placeholder: 'mongodb',
  required: false
});

var kerberos_principal = new InputView({
  template: inputTemplate,
  name: 'kerberos_principal',
  label: 'Kerberos Principal',
  placeholder: '',
  required: true
});

var kerberos_password = new InputView({
  template: inputTemplate,
  type: 'password',
  name: 'kerberos_password',
  label: 'Password',
  placeholder: '',
  required: false
});

/**
 * Define fields for each auth method here
 */
module.exports = {
  NONE: [],
  MONGODB: [
    mongodb_username,
    mongodb_password,
    mongodb_database_name
  ],
  KERBEROS: [
    kerberos_service_name,
    kerberos_principal,
    kerberos_password
  ],
  X509: [],
  LDAP: []
};
