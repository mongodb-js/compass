/**
 * ### authentication
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-authentication
 */
var app = require('ampersand-app');
var AuthenticationOption = require('./models/authentication-option');
var AuthenticationOptionCollection = require('./models/authentication-option-collection');

var InputView = require('./input-view');
var inputTemplate = require('./input-default.jade');

var NONE = {
  _id: 'NONE',
  title: 'None',
  enabled: true
};

var MONGODB = {
  _id: 'MONGODB',
  title: 'Username / Password',
  enabled: true,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'mongodb_database_name',
      label: 'Database Name',
      placeholder: 'admin',
      required: false
    }),
    new InputView({
      template: inputTemplate,
      name: 'mongodb_username',
      label: 'Username',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      type: 'password',
      name: 'mongodb_password',
      label: 'Password',
      placeholder: '',
      required: false
    })
  ]
};

var KERBEROS = {
  _id: 'KERBEROS',
  title: 'Kerberos',
  enabled: app.isFeatureEnabled('Connect with Kerberos'),
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'kerberos_service_name',
      label: 'Kerberos Service Name',
      placeholder: 'mongodb',
      required: false
    }),
    new InputView({
      template: inputTemplate,
      name: 'kerberos_principal',
      label: 'Kerberos Principal',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      type: 'password',
      name: 'kerberos_password',
      label: 'Password',
      placeholder: '',
      required: false
    })
  ]
};

var X509 = {
  _id: 'X509',
  title: 'X.509',
  enabled: app.isFeatureEnabled('Connect with X.509'),
  fields: []
};

var LDAP = {
  _id: 'LDAP',
  title: 'LDAP',
  enabled: app.isFeatureEnabled('Connect with LDAP'),
  fields: []
};

module.exports = new AuthenticationOptionCollection([
  NONE,
  MONGODB,
  KERBEROS,
  X509,
  LDAP
]);
