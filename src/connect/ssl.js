/**
 * ### ssl
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 */
var app = require('ampersand-app');
var AuthenticationOption = require('./models/authentication-option');
var AuthenticationOptionCollection = require('./models/authentication-option-collection');

var InputView = require('./input-view');
var inputTemplate = require('./input-default.jade');

var NONE = {
  _id: 'NONE',
  title: 'Do not use SSL for anything',
  enabled: true
};

var UNVALIDATED = {
  _id: 'UNVALIDATED',
  title: 'Use SSL but do not perform any validation of'
    + ' the certificate chain... which is basically pointless.',
  enabled: app.isFeatureEnabled('Connect with SSL UNVALIDATED')
};

var SERVER = {
  _id: 'SERVER',
  title: 'The driver should validate the server certificate and'
    + ' fail to connect if validation fails.',
  enabled: app.isFeatureEnabled('Connect with SSL SERVER'),
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'ssl_ca',
      label: 'Path to SSL CA file',
      placeholder: '',
      required: true
    })
  ]
};

var ALL = {
  _id: 'ALL',
  title: 'The driver must present a valid certificate'
    + ' and validate the server certificate.',
  enabled: app.isFeatureEnabled('Connect with SSL ALL'),
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'ssl_ca',
      label: 'Path to Certificate Authority file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_private_key',
      label: 'Path to Private Key file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_certificate',
      label: 'Path to Certificate file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_private_key_password',
      type: 'password',
      label: 'Private Key Password',
      placeholder: '',
      required: false
    }),
  ]
};

module.exports = new AuthenticationOptionCollection([
  NONE,
  UNVALIDATED,
  SERVER,
  ALL
]);
