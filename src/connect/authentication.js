/**
 * ### authentication
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-authentication
 */
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
      label: 'Database Name',
      placeholder: 'admin',
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
      required: true,
      tests: [
        function(value) {
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

var X509 = {
  _id: 'X509',
  title: 'X.509',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with X.509'),
  enabled: true,
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

module.exports = new AuthenticationOptionCollection([
  NONE,
  MONGODB,
  KERBEROS,
  X509,
  LDAP
]);
