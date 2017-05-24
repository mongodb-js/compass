/**
 * ### authentication
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-authentication
 */
var AuthenticationOptionCollection = require('./models/authentication-option-collection');

var InputView = require('./input-view');
var _ = require('lodash');

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
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'mongodb_database_name',
      label: 'Authentication Database',
      placeholder: 'admin',
      helpEntry: 'https://docs.mongodb.com/manual/core/security-users/#user-authentication-database',
      required: false
    })
  ]
};

var KERBEROS = {
  _id: 'KERBEROS',
  title: 'Kerberos',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with Kerberos'),
  enabled: true,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'kerberos_principal',
      label: 'Principal',
      placeholder: '',
      helpEntry: 'https://docs.mongodb.com/manual/core/kerberos/#principals',
      required: true,
      tests: [function(value) {
        if (!value.match(/\S+@\S+/)) {
          return 'Principal must contain a realm, e.g. user@REALM';
        }
      }
      ]
    }),
    new InputView({
      template: inputTemplate,
      type: 'password',
      name: 'kerberos_password',
      label: 'Password',
      placeholder: '',
      required: false
    }),
    new InputView({
      template: inputTemplate,
      name: 'kerberos_service_name',
      label: 'Service Name',
      placeholder: 'mongodb',
      required: false
    })
  ]
};

var LDAP = {
  _id: 'LDAP',
  title: 'LDAP',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with LDAP'),
  enabled: true,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'ldap_username',
      label: 'Username',
      placeholder: '',
      helpEntry: 'https://docs.mongodb.com/manual/core/security-ldap/',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      type: 'password',
      name: 'ldap_password',
      label: 'Password',
      placeholder: '',
      required: true
    })
  ]
};

var X509 = {
  _id: 'X509',
  title: 'X.509',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with X.509'),
  enabled: false,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'x509_username',
      label: 'Username',
      placeholder: '',
      required: true
    })
  ]
};

var allAuthModes = [
  NONE,
  MONGODB,
  KERBEROS,
  LDAP,
  X509
];

module.exports = new AuthenticationOptionCollection(_.filter(allAuthModes, 'enabled'));
