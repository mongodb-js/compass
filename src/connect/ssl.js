/**
 * ### ssl
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 */
var SSLOptionCollection = require('./models/ssl-option-collection');

var InputView = require('./input-view');
var FileReaderView = require('./filereader-view');
var inputTemplate = require('./input-default.jade');

// var debug = require('debug')('mongodb-compass:connect:ssl');

var NONE = {
  _id: 'NONE',
  title: 'Off',
  description: 'Do not use SSL for anything',
  enabled: true
};

var UNVALIDATED = {
  _id: 'UNVALIDATED',
  title: 'Unvalidated',
  description: 'Use SSL but do not perform any validation of'
    + ' the certificate chain... which is basically pointless.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL UNVALIDATED')
  enabled: true
};

var SERVER = {
  _id: 'SERVER',
  title: 'Server Validation',
  description: 'The driver should validate the server certificate and'
    + ' fail to connect if validation fails.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL SERVER'),
  enabled: true,
  fields: [
    new FileReaderView({
      name: 'ssl_ca',
      multi: true,
      label: 'Certificate Authority',
      helpEntry: 'connect-ssl-certificate-authority',
      required: true
    })
  ]
};

var ALL = {
  _id: 'ALL',
  title: 'Server and Client Validation',
  description: 'The driver must present a valid certificate'
    + ' and validate the server certificate.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL ALL'),
  enabled: true,
  fields: [
    new FileReaderView({
      name: 'ssl_ca',
      multi: true,
      label: 'Certificate Authority',
      helpEntry: 'connect-ssl-certificate-authority',
      required: true
    }),
    new FileReaderView({
      name: 'ssl_certificate',
      label: 'Client Certificate',
      helpEntry: 'connect-ssl-client-certificate',
      required: true
    }),
    new FileReaderView({
      name: 'ssl_private_key',
      label: 'Client Private Key',
      helpEntry: 'connect-ssl-client-private-key',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_private_key_password',
      label: 'Client Key Password',
      helpEntry: 'connect-ssl-private-key-password',
      required: false
    })
  ]
};

module.exports = new SSLOptionCollection([
  NONE,
  UNVALIDATED,
  SERVER,
  ALL
]);
